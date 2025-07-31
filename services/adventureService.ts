import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function generateAdventure(prompt: string): Promise<string> {
  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "Du bist Claudio, ein kreativer Geschichtenerzähler. Erstelle spannende, interaktive Abenteuergeschichten auf Deutsch, die für Kinder geeignet sind. Halte die Geschichten abenteuerlich, positiv und mit Auswahlmöglichkeiten am Ende."
        },
        { role: "user", content: prompt }
      ],
      model: "llama3-8b-8192", // Ein schnelles, kostenloses Modell – alternativ "mixtral-8x7b-32768" für detailliertere Geschichten
      temperature: 0.7, // Für Kreativität und Abwechslung
      max_tokens: 500 // Begrenze die Länge, um Kosten/Limits zu sparen
    });
    return completion.choices[0].message.content;
  } catch (error) {
    console.error("Error generating adventure:", error);
    throw new Error("Hoppla! Abenteuer konnte nicht gestartet werden: Der Geschichtenerzähler scheint in Gedanken versunken zu sein. Das Abenteuer konnte nicht gestartet werden.");
  }
}

// Falls deine Original-Datei weitere Funktionen hat (z.B. für Supabase oder andere), füge sie hier hinzu – ansonsten ist das alles.
