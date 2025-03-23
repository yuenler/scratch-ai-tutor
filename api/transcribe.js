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
        return res.status(400).json({ error: "Invalid JSON body" });
      }
    }
    
    const { audioData } = body;
    
    if (!audioData) {
      return res.status(400).json({ error: "Missing 'audioData' in request body." });
    }

    console.log("Received audio data for transcription");
    
    // Decode base64 audio data
    const buffer = Buffer.from(audioData, 'base64');
    
    // Initialize OpenAI client
    const openai = new OpenAI(process.env.OPENAI_API_KEY);
    
    // Create a temporary file with the audio data in memory
    const file = new File([buffer], "audio.webm", { type: "audio/webm" });
    
    // Send to Whisper API for transcription
    const transcription = await openai.audio.transcriptions.create({
      model: "whisper-1",
      file: file,
    });
    
    console.log("Transcription completed:", transcription.text);
    
    return res.status(200).json({ 
      text: transcription.text 
    });
  } catch (error) {
    console.error("Error processing transcription request:", error);
    return res.status(500).json({ error: error.message });
  }
}
