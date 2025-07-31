import Groq from "groq-sdk";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { prompt } = req.body;
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY }); // Key server-side, sicher!

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
    const jsonResponse = JSON.parse(completion.choices[0].message.content);
    res.status(200).json({
      sceneDescription: jsonResponse.sceneDescription,
      choices: jsonResponse.choices,
      isGameOver: jsonResponse.isGameOver,
      imageUrl: undefined
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Hoppla! Abenteuer konnte nicht gestartet werden: Der Geschichtenerzähler scheint in Gedanken versunken zu sein." });
  }
}
