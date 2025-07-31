import Groq from "groq-sdk";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { prompt } = req.body;
  console.log("Prompt received:", prompt); // Logging für Vercel Logs

  const apiKey = process.env.GROQ_API_KEY;
  console.log("API Key loaded:", !!apiKey); // Check, ob Key da ist (true/false)

  if (!apiKey) {
    return res.status(500).json({ error: "API Key missing on server" });
  }

  const groq = new Groq({ apiKey });

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "Du bist Claudio, ein kreativer Geschichtenerzähler. Generiere interaktive Geschichten als JSON-Objekt."
        },
        { role: "user", content: prompt }
      ],
      model: "llama3-8b-8192",
      temperature: 0.7,
      max_tokens: 500
    });
    const responseText = completion.choices[0].message.content;
    console.log("Groq response:", responseText); // Log die Raw-Response

    // Robustes Parsing: Extrahiere JSON, falls umgeben von Text
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const jsonResponse = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(responseText);

    res.status(200).json({
      sceneDescription: jsonResponse.sceneDescription,
      choices: jsonResponse.choices,
      isGameOver: jsonResponse.isGameOver,
      imageUrl: undefined
    });
  } catch (error) {
    console.error("Error in API:", error.message);
    res.status(500).json({ error: `Hoppla! Abenteuer konnte nicht gestartet werden: ${error.message}` });
  }
}
