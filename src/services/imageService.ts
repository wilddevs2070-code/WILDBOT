import { GoogleGenAI } from "@google/genai";

export async function generateForgeIcon() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          text: "A professional and unique logo for the 'WILDSTAR' application. The logo represents game development and AI assistance, featuring a pixelated star with a glowing neural network pattern inside. The style is Minecraft-inspired (blocky/voxel art) but with a modern, high-tech finish. Color palette: Predominantly dark charcoal and deep obsidian with vibrant neon yellow and emerald green accents. Isolated on a clean background, vector style.",
        },
      ],
    },
    config: {
      imageConfig: {
        aspectRatio: "1:1",
      },
    },
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return null;
}

export async function generateAssetImage(prompt: string, style: string = "pixel art") {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
  const fullPrompt = `A game asset of ${prompt}. Style: ${style}. High quality, isolated on a simple background, suitable for use in a game engine.`;
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          text: fullPrompt,
        },
      ],
    },
    config: {
      imageConfig: {
        aspectRatio: "1:1",
      },
    },
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return null;
}
