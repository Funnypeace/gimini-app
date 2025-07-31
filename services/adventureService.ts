import { StorySegment } from "../types";

export const adventureService = {
  getInitialScene: async (genre: string): Promise<StorySegment> => {
    // 🚀 Angepasst: Genau 4 Optionen für Konsistenz
    const prompt = `Starte eine neue ${genre}-Abenteuergeschichte. Alles auf Deutsch! Kurz und prägnant! Max 2 Sätze Szene, dann genau 4 Optionen. JSON: { "sceneDescription": "Kurze Szene auf Deutsch", "choices": ["Option 1 auf Deutsch", "Option 2 auf Deutsch", "Option 3 auf Deutsch", "Option 4 auf Deutsch"], "isGameOver": false }`;
    return adventureService.generateStory(prompt);
  },

  getNextScene: async (previousScene: string, choice: string, history: string[]): Promise<StorySegment> => {
    // 🚀 Angepasst: Genau 4 Optionen für Konsistenz
    const historySummary = history.slice(-2).join(" → ");
    const prompt = `Fortsetzung: Vorher "${previousScene.substring(0, 100)}..." Wahl: "${choice}". Alles auf Deutsch! Kurze neue Szene (max 2 Sätze) + genau 4 Optionen. JSON: { "sceneDescription": "Kurze neue Szene auf Deutsch", "choices": ["Option 1 auf Deutsch", "Option 2 auf Deutsch", "Option 3 auf Deutsch", "Option 4 auf Deutsch"], "isGameOver": false }`;
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
