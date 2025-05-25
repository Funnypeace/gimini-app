import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { StorySegment, GeminiStoryResponse } from '../types';
import { GEMINI_TEXT_MODEL_NAME, IMAGEN_MODEL_NAME, GEMINI_SYSTEM_INSTRUCTION_JSON } from '../constants';

// Besser: Umgebungsvariable als VITE_API_KEY einbinden!
const API_KEY = import.meta.env.VITE_API_KEY;
if (!API_KEY) {
  console.error("VITE_API_KEY Umgebungsvariable nicht gefunden. Die Anwendung wird nicht korrekt funktionieren.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY || "MISSING_API_KEY" });

const parseGeminiJsonResponse = (responseText: string): GeminiStoryResponse => {
  let jsonStr = responseText.trim();
  const fenceRegex = /^```(?:json)?\s*\n?(.*?)\n?\s*```$/is;
  const match = jsonStr.match(fenceRegex);
  if (match && match[1]) {
    jsonStr = match[1].trim();
  }

  try {
    const parsed = JSON.parse(jsonStr);
    if (
      typeof parsed.sceneDescription !== 'string' ||
      !Array.isArray(parsed.choices) ||
      !parsed.choices.every((c: unknown) => typeof c === 'string') ||
      typeof parsed.imagePrompt !== 'string'
    ) {
      throw new Error('Ungültige JSON-Struktur von Gemini empfangen.');
    }
    return parsed as GeminiStoryResponse;
  } catch (e) {
    console.error("Fehler beim Parsen der JSON-Antwort von Gemini:", e, "Rohantwort:", responseText);
    throw new Error(`Die Antwort des Geschichtenerzählers konnte nicht verstanden werden. Das Format war unerwartet. Rohdaten: ${jsonStr.substring(0,100)}`);
  }
};

const generateImageFromPrompt = async (prompt: string): Promise<string | undefined> => {
  if (!prompt) return undefined;
  try {
    const response = await ai.models.generateImages({
      model: IMAGEN_MODEL_NAME,
      prompt: prompt,
      config: { numberOfImages: 1, outputMimeType: 'image/jpeg' },
    });

    if (response.generatedImages && response.generatedImages.length > 0 && response.generatedImages[0].image?.imageBytes) {
      const base64ImageBytes = response.generatedImages[0].image.imageBytes;
      return `data:image/jpeg;base64,${base64ImageBytes}`;
    }
    console.warn("Imagen-Antwort enthielt keine erwarteten Bilddaten für Prompt:", prompt);
    return undefined;
  } catch (error) {
    console.error("Fehler beim Generieren des Bildes mit Imagen:", error);
    return undefined;
  }
};

/**
 * Holt die erste Szene. Der Prompt ist jetzt GENRE-STARK formuliert!
 */
const getInitialScene = async (genre: string): Promise<StorySegment> => {
  const prompt = `
Du bist ein KI-Geschichtenerzähler und erstellst ein interaktives Abenteuerspiel auf Deutsch.
Das Genre der Geschichte ist: "${genre}".
Erzeuge eine Eröffnungsszene, die ganz klar die typischen Merkmale, Themen, Atmosphäre und Stil dieses Genres erkennen lässt.
Sei dabei kreativ und gehe sicher, dass keine Szene jemals gleich beginnt.

Spezifische Vorgaben:
- Die Szene muss sich für das gewählte Genre absolut passend anfühlen!
- Nutze für "${genre}" typische Handlungselemente, Motive und eine stimmungsvolle Sprache.
- Stelle einen interessanten Konflikt, Mysterium oder Wendepunkt vor, der typisch für dieses Genre ist.
- Gib dem Spieler genau 3 bis 4 spannende Wahlmöglichkeiten als kurze Aktionssätze.
- Generiere zusätzlich einen passenden Bildprompt für die Szene.

Antworte **ausschließlich** im folgenden JSON-Format:

{
  "sceneDescription": "...",
  "choices": ["...","..."],
  "imagePrompt": "..."
}
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_TEXT_MODEL_NAME,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction: GEMINI_SYSTEM_INSTRUCTION_JSON,
      },
    });

    const storyData = parseGeminiJsonResponse(response.text);
    const imageUrl = await generateImageFromPrompt(storyData.imagePrompt);

    return {
      ...storyData,
      imageUrl,
      isGameOver: storyData.choices.length === 0,
    };
  } catch (error) {
    console.error("Fehler beim Abrufen der Anfangsszene von Gemini:", error);
    if (
      error instanceof Error &&
      (error.message.includes("Ungültige JSON-Struktur") ||
        error.message.includes("Antwort des Geschichtenerzählers konnte nicht verstanden werden"))
    ) {
      throw error;
    }
    throw new Error("Der Geschichtenerzähler scheint in Gedanken versunken zu sein. Das Abenteuer konnte nicht gestartet werden.");
  }
};

const getNextScene = async (previousSceneDescription: string, playerChoice: string, history: string[]): Promise<StorySegment> => {
  const historyContext = history.length > 0 ? `\n\nKürzliche Ereignisse als Kontext (nicht direkt wiederholen):\n${history.join('\n---\n')}` : "";
  const prompt = `
Die bisherige Szene:
"${previousSceneDescription}"

Der Spieler wählte: "${playerChoice}"
${historyContext}

Setze das Abenteuer **im exakt gleichen Genre wie bisher** fort! 
Die nächste Szene muss die Atmosphäre, Sprache und Motive des Genres fortführen.
Baue gerne eine überraschende Wendung oder eine Genre-typische Entwicklung ein.
Erzeuge einen neuen, kreativen Bildprompt für die Szene.

Antworte **ausschließlich** im folgenden JSON-Format:

{
  "sceneDescription": "...",
  "choices": ["...","..."],
  "imagePrompt": "..."
}
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_TEXT_MODEL_NAME,
      contents: [{ role: "user", parts: [{text: prompt}] }],
      config: {
        systemInstruction: GEMINI_SYSTEM_INSTRUCTION_JSON,
      },
    });

    const storyData = parseGeminiJsonResponse(response.text);
    const imageUrl = await generateImageFromPrompt(storyData.imagePrompt);
    
    return {
      ...storyData,
      imageUrl,
      isGameOver: storyData.choices.length === 0,
    };
  } catch (error) {
    console.error("Fehler beim Abrufen der nächsten Szene von Gemini:", error);
    if (error instanceof Error && (error.message.includes("Ungültige JSON-Struktur") || error.message.includes("Antwort des Geschichtenerzählers konnte nicht verstanden werden"))) {
        throw error;
    }
    throw new Error("Der vor uns liegende Pfad ist unklar. Der Geschichtenerzähler ist gestolpert.");
  }
};

export const adventureService = {
  getInitialScene,
  getNextScene,
};
