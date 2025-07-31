import { StorySegment } from "../types";

export const adventureService = {
  getInitialScene: async (genre: string): Promise<StorySegment> => {
    const prompt = `Starte eine neue interaktive Abenteuergeschichte im Genre ${genre}. Die Geschichte soll auf Deutsch sein, für Kinder geeignet, positiv und abenteuerlich. Beginne mit einer einleitenden Szene und gib 2-3 Auswahlmöglichkeiten am Ende. Returniere als JSON: { "sceneDescription": "Beschreibung der Szene", "choices": ["Option 1", "Option 2", "Option 3"], "isGameOver": false }`;
    return adventureService.generateStory(prompt);
  },

  getNextScene: async (previousScene: string, choice: string, history: string[]): Promise<StorySegment> => {
    const historySummary = history.join("\n");
    const prompt = `Fortsetze die interaktive Abenteuergeschichte basierend auf der vorherigen Szene: "${previousScene}" und der Wahl des Spielers: "${choice}". Berücksichtige die Geschichte bisher: "${historySummary}". Halte es auf Deutsch, kinderfreundlich, positiv und abenteuerlich. Gib eine neue Szene und 2-3 neue Auswahlmöglichkeiten. Wenn die Geschichte endet, setze isGameOver auf true. Returniere als JSON: { "sceneDescription": "Neue Beschreibung", "choices": ["Option 1", "Option 2", "Option 3"], "isGameOver": false }`;
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
        throw new Error(await response.json().error);
      }
      return await response.json();
    } catch (error) {
      console.error("Error generating story:", error);
      throw new Error("Hoppla! Abenteuer konnte nicht gestartet werden: Der Geschichtenerzähler scheint in Gedanken versunken zu sein. Das Abenteuer konnte nicht gestartet werden.");
    }
  }
};
