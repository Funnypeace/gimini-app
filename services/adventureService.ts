import { StorySegment } from "../types";

export const adventureService = {
  getInitialScene: async (genre: string): Promise<StorySegment> => {
    // 🚀 OPTIMIERT: Kürzerer, präziserer Prompt
    const prompt = `Starte eine neue ${genre}-Abenteuergeschichte auf Deutsch. Kurz und prägnant! Max 2 Sätze Szene, dann 2-3 Optionen. JSON: { "sceneDescription": "Kurze Szene", "choices": ["Option 1", "Option 2"], "isGameOver": false }`;
    return adventureService.generateStory(prompt);
  },

  getNextScene: async (previousScene: string, choice: string, history: string[]): Promise<StorySegment> => {
    // 🚀 OPTIMIERT: Komprimierte Geschichte nur mit letzten 2 Elementen
    const historySummary = history.slice(-2).join(" → ");
    const prompt = `Fortsetzung: Vorher "${previousScene.substring(0, 100)}..." Wahl: "${choice}". Kurze neue Szene (max 2 Sätze) + 2-3 Optionen. JSON: { "sceneDescription": "Kurze neue Szene", "choices": ["Option 1", "Option 2"], "isGameOver": false }`;
    return adventureService.generateStory(prompt);
  },

  generateStory: async (prompt: string): Promise<StorySegment> => {
    try {
      const response = await fetch('/api/adventure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });

      if (!response.ok) {
        const errorResponse = await response.json();
        throw new Error(errorResponse.error || "Unbekannter Fehler beim API-Aufruf.");
      }

      return await response.json();
    } catch (error) {
      console.error("Error generating story:", error);
      throw new Error(`Hoppla! Abenteuer konnte nicht gestartet werden: ${error.message}`);
    }
  }
};
