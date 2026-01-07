import { mutation } from "./_generated/server";

export const seedDiseases = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if diseases already exist
    const existing = await ctx.db.query("diseases").first();
    if (existing) {
      return "Diseases already seeded";
    }

    const diseases = [
      {
        name: "Leaf Spot Disease",
        scientificName: "Taphrina maculans",
        severity: "moderate" as const,
        symptoms: [
          "Brown or black spots on leaves",
          "Yellowing around spots",
          "Premature leaf drop",
          "Reduced plant vigor"
        ],
        causes: "Fungal infection caused by excessive moisture and poor air circulation. Common in humid conditions and overcrowded plantings.",
        prevention: [
          "Ensure proper spacing between plants",
          "Improve air circulation",
          "Avoid overhead watering",
          "Remove infected plant debris",
          "Apply preventive fungicide sprays"
        ],
        treatment: "Remove affected leaves immediately. Apply copper-based fungicide or neem oil spray. Improve drainage and reduce watering frequency. Ensure good air circulation around plants.",
        description: "A common fungal disease affecting turmeric leaves, characterized by dark spots that can spread rapidly in humid conditions."
      },
      {
        name: "Rhizome Rot",
        scientificName: "Pythium aphanidermatum",
        severity: "high" as const,
        symptoms: [
          "Soft, mushy rhizomes",
          "Foul smell from roots",
          "Yellowing and wilting leaves",
          "Stunted growth",
          "Plant collapse"
        ],
        causes: "Waterlogged soil conditions leading to fungal infection. Poor drainage and overwatering are primary causes.",
        prevention: [
          "Ensure excellent drainage",
          "Avoid overwatering",
          "Use raised beds in heavy soils",
          "Plant in well-draining soil mix",
          "Rotate crops annually"
        ],
        treatment: "Remove affected plants immediately. Improve soil drainage. Apply fungicide drench with metalaxyl or fosetyl-al. Reduce watering and ensure proper soil aeration.",
        description: "A serious fungal disease that attacks the rhizome system, potentially causing complete plant loss if not treated promptly."
      },
      {
        name: "Leaf Blight",
        scientificName: "Colletotrichum capsici",
        severity: "moderate" as const,
        symptoms: [
          "Large brown patches on leaves",
          "Leaf margins turning brown",
          "Defoliation in severe cases",
          "Reduced rhizome yield"
        ],
        causes: "Fungal pathogen that thrives in warm, humid conditions. Spread through water splash and contaminated tools.",
        prevention: [
          "Use disease-free planting material",
          "Maintain proper plant spacing",
          "Apply preventive copper sprays",
          "Remove plant debris",
          "Avoid working with wet plants"
        ],
        treatment: "Apply copper oxychloride or mancozeb fungicide. Remove infected leaves and destroy them. Improve air circulation and reduce leaf wetness duration.",
        description: "A foliar disease that can significantly reduce plant health and rhizome production if left untreated."
      },
      {
        name: "Bacterial Wilt",
        scientificName: "Ralstonia solanacearum",
        severity: "high" as const,
        symptoms: [
          "Sudden wilting of leaves",
          "Yellowing from bottom up",
          "Brown vascular discoloration",
          "Plant death within days",
          "No recovery after watering"
        ],
        causes: "Soil-borne bacterial pathogen that enters through root wounds. Spreads rapidly in warm, moist conditions.",
        prevention: [
          "Use certified disease-free rhizomes",
          "Avoid soil from infected areas",
          "Practice crop rotation",
          "Maintain soil pH 6.0-7.0",
          "Ensure good drainage"
        ],
        treatment: "No effective cure once infected. Remove and destroy affected plants immediately. Treat soil with copper sulfate. Plant resistant varieties in future seasons.",
        description: "A devastating bacterial disease that can cause rapid plant death and soil contamination for future crops."
      },
      {
        name: "Healthy Plant",
        scientificName: "Curcuma longa",
        severity: "low" as const,
        symptoms: [
          "Vibrant green leaves",
          "Strong upright growth",
          "No discoloration or spots",
          "Healthy root system"
        ],
        causes: "Optimal growing conditions with proper nutrition, water management, and disease prevention practices.",
        prevention: [
          "Maintain consistent care routine",
          "Monitor for early disease signs",
          "Ensure proper nutrition",
          "Regular health inspections",
          "Preventive treatments as needed"
        ],
        treatment: "Continue current care practices. Monitor regularly for any changes. Maintain optimal growing conditions with balanced fertilization and proper watering.",
        description: "A healthy turmeric plant showing no signs of disease or stress, indicating optimal growing conditions."
      }
    ];

    for (const disease of diseases) {
      await ctx.db.insert("diseases", disease);
    }

    return "Diseases seeded successfully";
  },
});
