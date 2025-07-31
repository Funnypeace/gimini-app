import Groq from "groq-sdk";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { prompt } = req.body;
  console.log("Prompt received:", prompt);

  const apiKey = process.env.GROQ_API_KEY;
  console.log("API Key loaded:", !!apiKey);

  if (!apiKey) {
    return res.status(500).json({ error: "API Key missing on server" });
  }

  const groq = new Groq({ apiKey });

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "Du bist Claudio, ein kreativer Geschichtenerzähler. Generiere kurze, prägnante interaktive Geschichten als JSON-Objekt. Halte Antworten kompakt und fokussiert."
        },
        { role: "user", content: prompt }
      ],
      model: process.env.GROQ_MODEL || "llama-3.1-8b-instant",
      temperature: parseFloat(process.env.GROQ_TEMPERATURE) || 0.2,
      max_tokens: parseInt(process.env.GROQ_MAX_TOKENS) || 300,
      top_p: 0.9,
      frequency_penalty: 0.1,
      presence_penalty: 0.1
    });

    const responseText = completion.choices[0].message.content;
    console.log("Groq response:", responseText);

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
