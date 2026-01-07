import { action, mutation, query, internalMutation, internalAction } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api, internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

export const analyzeImage = action({
  args: {
    imageBase64: v.string(),
  },
  handler: async (ctx, args): Promise<Id<"analyses">> => {
    const userId = await getAuthUserId(ctx);
    
    // Create initial analysis record
    const analysisId: Id<"analyses"> = await ctx.runMutation(internal.analysis.createAnalysis, {
      userId: userId || undefined,
      status: "analyzing",
    });

    try {
      // Use the bundled OpenAI API for image analysis
      const openai = await import("openai");
      const client = new openai.default({
        baseURL: process.env.CONVEX_OPENAI_BASE_URL,
        apiKey: process.env.CONVEX_OPENAI_API_KEY,
      });

      const response = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this turmeric plant leaf image for diseases. You are an expert plant pathologist specializing in turmeric (Curcuma longa) diseases.

Please provide your analysis in the following JSON format:
{
  "detectedDisease": "Disease name or 'Healthy Plant'",
  "confidence": 85,
  "severity": "low|moderate|high",
  "symptoms": ["symptom1", "symptom2", "symptom3"],
  "summary": "Brief description of what you observe"
}

Common turmeric diseases to look for:
- Leaf Spot Disease: Brown/black spots on leaves
- Rhizome Rot: Soft, mushy appearance, yellowing
- Leaf Blight: Large brown patches, leaf margin browning
- Bacterial Wilt: Sudden wilting, yellowing from bottom
- Healthy Plant: Vibrant green, no discoloration

Focus on visible symptoms like spots, discoloration, wilting, or signs of fungal/bacterial infection.`
              },
              {
                type: "image_url",
                image_url: {
                  url: args.imageBase64
                }
              }
            ]
          }
        ],
        max_tokens: 500,
      });

      const analysisText = response.choices[0]?.message?.content;
      if (!analysisText) {
        throw new Error("No analysis received from AI");
      }

      // Parse the JSON response
      let analysisResult;
      try {
        // Extract JSON from the response (in case there's extra text)
        const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? jsonMatch[0] : analysisText;
        analysisResult = JSON.parse(jsonString);
      } catch (parseError) {
        // Fallback parsing if JSON is malformed
        analysisResult = {
          detectedDisease: "Analysis Error",
          confidence: 0,
          severity: "moderate",
          symptoms: ["Unable to parse analysis results"],
          summary: "Error processing image analysis"
        };
      }

      // Get treatment information
      const treatment = await ctx.runAction(internal.analysis.getTreatmentInfo, {
        disease: analysisResult.detectedDisease,
        symptoms: analysisResult.symptoms,
      });

      // Update analysis with results
      await ctx.runMutation(internal.analysis.updateAnalysis, {
        analysisId,
        detectedDisease: analysisResult.detectedDisease,
        confidence: analysisResult.confidence,
        severity: analysisResult.severity,
        symptoms: analysisResult.symptoms,
        treatment: treatment.treatment,
        sources: treatment.sources,
        status: "completed",
      });

      return analysisId;
    } catch (error) {
      console.error("Analysis failed:", error);
      
      // Update analysis with error status
      await ctx.runMutation(internal.analysis.updateAnalysis, {
        analysisId,
        detectedDisease: "Analysis Failed",
        confidence: 0,
        severity: "moderate",
        symptoms: ["Unable to analyze image"],
        treatment: "Please try again with a clearer image of the turmeric leaf.",
        sources: [],
        status: "failed",
      });

      throw error;
    }
  },
});

export const getTreatmentInfo = internalAction({
  args: {
    disease: v.string(),
    symptoms: v.array(v.string()),
  },
  handler: async (ctx, args): Promise<{
    treatment: string;
    sources: Array<{
      title: string;
      url: string;
      snippet: string;
    }>;
  }> => {
    try {
      // Get disease info from database first
      const diseases = await ctx.runQuery(api.diseases.list);
      const matchedDisease = diseases.find((d: any) => 
        d.name.toLowerCase().includes(args.disease.toLowerCase()) ||
        args.disease.toLowerCase().includes(d.name.toLowerCase())
      );

      if (matchedDisease) {
        return {
          treatment: matchedDisease.treatment,
          sources: []
        };
      }

      // Fallback to AI-generated treatment advice
      const openai = await import("openai");
      const client = new openai.default({
        baseURL: process.env.CONVEX_OPENAI_BASE_URL,
        apiKey: process.env.CONVEX_OPENAI_API_KEY,
      });

      const response = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: `Provide treatment recommendations for turmeric plant disease: ${args.disease}

Symptoms observed: ${args.symptoms.join(", ")}

Please provide:
1. Immediate treatment steps
2. Preventive measures
3. Organic/sustainable solutions when possible
4. Timeline for recovery

Format as clear, actionable advice for farmers.`
          }
        ],
        max_tokens: 400,
      });

      const treatment = response.choices[0]?.message?.content || 
        "Consult with a local agricultural extension office for specific treatment recommendations.";

      return {
        treatment,
        sources: []
      };
    } catch (error) {
      console.error("Treatment info failed:", error);
      return {
        treatment: "Unable to fetch treatment information. Please consult with a local agricultural expert or extension office for proper diagnosis and treatment recommendations.",
        sources: []
      };
    }
  },
});

export const createAnalysis = internalMutation({
  args: {
    userId: v.optional(v.id("users")),
    status: v.union(v.literal("analyzing"), v.literal("completed"), v.literal("failed")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("analyses", {
      userId: args.userId,
      detectedDisease: "",
      confidence: 0,
      severity: "moderate",
      symptoms: [],
      treatment: "",
      status: args.status,
    });
  },
});

export const updateAnalysis = internalMutation({
  args: {
    analysisId: v.id("analyses"),
    detectedDisease: v.string(),
    confidence: v.number(),
    severity: v.union(v.literal("low"), v.literal("moderate"), v.literal("high")),
    symptoms: v.array(v.string()),
    treatment: v.string(),
    sources: v.array(v.object({
      title: v.string(),
      url: v.string(),
      snippet: v.string(),
    })),
    status: v.union(v.literal("analyzing"), v.literal("completed"), v.literal("failed")),
  },
  handler: async (ctx, args) => {
    const { analysisId, ...updates } = args;
    await ctx.db.patch(analysisId, updates);
  },
});

export const getAnalysis = query({
  args: {
    analysisId: v.id("analyses"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.analysisId);
  },
});

export const getUserAnalyses = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    
    return await ctx.db
      .query("analyses")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(10);
  },
});
