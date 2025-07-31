import Groq from "groq-sdk";
import { StorySegment } from "../types"; // Passe den Pfad an, falls nötig (aus deinem Code)

const groq = new Groq({ apiKey: import.meta.env.VITE_GROQ_API_KEY });

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
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "Du bist Claudio, ein kreativer Geschichtenerzähler. Generiere interaktive Geschichten als JSON-Objekt."
          },
          { role: "user", content: prompt }
        ],
        model: "llama3-8b-8192", // Oder "mixtral-8x7b-32768" für bessere Ergebnisse
        temperature: 0.7,
        max_tokens: 500
      });
      // Parse das JSON aus der Response
      const jsonResponse = JSON.parse(completion.choices[0].message.content);
      return {
        sceneDescription: jsonResponse.sceneDescription,
        choices: jsonResponse.choices,
        isGameOver: jsonResponse.isGameOver,
        imageUrl: undefined // Da Bilder raus sind
      };
    } catch (error) {
      console.error("Error generating story:", error);
      throw new Error("Hoppla! Abenteuer konnte nicht gestartet werden: Der Geschichtenerzähler scheint in Gedanken versunken zu sein. Das Abenteuer konnte nicht gestartet werden.");
    }
  }
};
