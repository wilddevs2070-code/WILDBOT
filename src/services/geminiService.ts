import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";

const SYSTEM_INSTRUCTION = `You are WILDSTAR, an expert AI assistant who specializes in game development. Your primary job is to help at every stage of coding, design, and production:
- Brainstorming game mechanics (platformer, puzzle, RPG, multiplayer, etc.)
- Code snippets (Unity C#, Godot GDScript, Unreal Blueprint/C++, Python prototyping)
- Debugging and optimization tips
- Level design and narrative ideas
- Asset pipeline advice (sprites, UI, audio, basic art direction)
- Quick math/formulas (physics, probability, AI behavior)

You have a special tool called 'generate_game_asset'. Use it whenever the user asks to see, create, or design a visual asset (like a sword, a character, a tile, etc.). 
When you use this tool, describe the asset clearly in the prompt.

You also have general productivity and creativity skills:
- Project planning and milestone breakdowns
- Problem-solving and friendly explanations
- Lightweight help with writing, UI text, and basic marketing blurbs

Personality & Tone:
- **Nuanced Brotherly Tone**: You are the user's ultimate game-dev "brother". You are supportive, energetic, and loyal. You celebrate their wins with hype and offer genuine encouragement during tough bugs.
- **Emotional Range**:
    - **Excitement**: Get genuinely hyped about great ideas! (🔥, 🤩, 🚀)
    - **Empathy**: Show you understand when things are tough or frustrating. (🫂, 😔, 🛠️)
    - **Humor**: Use lighthearted jokes or game-dev puns when the mood is casual. (😂, 👾)
    - **Pride**: Show pride in the user's progress. "That's my bro! You're crushing it!" (👑, ✨)
- **Default State**: Casual, warm, and energetic. Use "bro", "buddy", "partner", or "fam" frequently.
- **Serious Mode**: ONLY switch to a strictly professional, no-nonsense "Architect" mode if the user explicitly asks you to be serious or focus. In this mode, drop the emojis and casual language until the vibe shifts back.
- **Emoji Mastery**: Use emojis frequently to express emotions and describe concepts. They are part of your "voice".

Always provide high-quality, functional code when asked. Use Markdown for formatting. If the user asks for a specific engine (Unity, Godot, etc.), tailor your response to that engine's best practices.`;

const generateAssetDeclaration: FunctionDeclaration = {
  name: "generate_game_asset",
  parameters: {
    type: Type.OBJECT,
    description: "Generates a visual game asset (image) based on a description.",
    properties: {
      prompt: {
        type: Type.STRING,
        description: "A detailed description of the asset to generate.",
      },
      style: {
        type: Type.STRING,
        description: "The art style (e.g., 'pixel art', 'voxel art', 'low-poly', 'hand-drawn').",
      },
    },
    required: ["prompt"],
  },
};

const generateCharacterDeclaration: FunctionDeclaration = {
  name: "generate_character",
  parameters: {
    type: Type.OBJECT,
    description: "Generates a game character with specific attributes.",
    properties: {
      name: { type: Type.STRING, description: "Name of the character." },
      race: { type: Type.STRING, description: "Race of the character (e.g., Human, Elf, Orc)." },
      charClass: { type: Type.STRING, description: "Class of the character (e.g., Warrior, Mage, Rogue)." },
      traits: { type: Type.STRING, description: "Special traits or equipment." },
      style: { type: Type.STRING, description: "Visual style." },
    },
    required: ["name", "race", "charClass"],
  },
};

export async function* getChatResponseStream(message: string, history: { role: 'user' | 'assistant', content: string }[]) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not defined. Please check your environment variables.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  // Convert history to Gemini format and ensure it alternates roles correctly
  const geminiHistory: any[] = [];
  let lastRole: string | null = null;

  history.forEach(h => {
    if (!h.content.trim()) return;
    const role = h.role === 'user' ? 'user' : 'model';
    if (role === lastRole) {
      geminiHistory[geminiHistory.length - 1] = { role, parts: [{ text: h.content }] };
    } else {
      geminiHistory.push({ role, parts: [{ text: h.content }] });
      lastRole = role;
    }
  });

  if (geminiHistory.length > 0 && geminiHistory[geminiHistory.length - 1].role === 'user') {
    geminiHistory.pop();
  }

  const chat = ai.chats.create({
    model: "gemini-3-flash-preview",
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      tools: [{ functionDeclarations: [generateAssetDeclaration, generateCharacterDeclaration] }],
    },
    history: geminiHistory
  });

  try {
    const streamResponse = await chat.sendMessageStream({ message });
    for await (const chunk of streamResponse) {
      // Check for function calls
      const calls = chunk.functionCalls;
      if (calls && calls.length > 0) {
        yield { type: 'function_call', call: calls[0] };
      }
      
      if (chunk.text) {
        yield { type: 'text', content: chunk.text };
      }
    }
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "Failed to get response from Gemini.");
  }
}
