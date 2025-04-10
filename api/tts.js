import OpenAI from "openai";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (error) {
        console.error('Failed to parse JSON body:', error);
      }
    }
    
    const { text } = body;
    if (!text) {
      return res.status(400).json({ error: "Missing 'text' in request body." });
    }

    console.log("Generating TTS for text:", text.substring(0, 100) + (text.length > 100 ? "..." : ""));
    
    const openai = new OpenAI(process.env.OPENAI_API_KEY);
    
    // Generate audio from the text response
    const audioResponse = await openai.audio.speech.create({
      model: "tts-1",
      voice: "nova", // Using a friendly voice appropriate for kids
      input: text.replace(/```scratchblocks[\s\S]*?```/g, ""), // Remove scratchblocks code from TTS input
    });
    
    // Convert audio response to buffer
    const buffer = Buffer.from(await audioResponse.arrayBuffer());
    
    // Convert buffer to base64 string
    const audioBase64 = buffer.toString('base64');

    return res.status(200).json({ 
      audio: audioBase64,
      audioFormat: 'mp3'
    });
  } catch (error) {
    console.error("Error processing TTS request:", error);
    return res.status(500).json({ error: error.message });
  }
}
