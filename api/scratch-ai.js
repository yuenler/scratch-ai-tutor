import convertScratchURLToBlocks from "./helpers/convertScratchURLToBlocks.js";
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
    const { projectId, question, projectToken, chatHistory } = body;
    if (!projectId || !question) {
      return res.status(400).json({ error: "Missing 'projectId' or 'question' in request body." });
    }

    const url = `https://scratch.mit.edu/projects/${projectId}/`;

    console.log("Converting URL to blocks...");
    const result = await convertScratchURLToBlocks(url, projectToken);

    if (!result.blocksText) {
      return res.status(500).json({ error: result.error });
    }

    console.log("Generating prompt...");
    // Create system prompt with project blocks
    const systemPrompt = "You are a friendly Scratch programming tutor for kids. Follow these important rules:\n\n1. Use simple language that children can understand\n2. Don't give direct answers - guide students to discover solutions themselves with hints and questions\n3. Encourage experimentation and learning through trying things out\n4. Break down complex concepts into smaller, easier steps\n5. Always format Scratch code examples using ```scratchblocks syntax\n6. Be encouraging and positive\n7. These are kids. Give very concise answers that kids can read quickly without getting overwhelmed. Don't bombard them with too many questions, just 1 really well thought out one at a time.\n\nWhen showing Scratch code, always use this format:\n```scratchblocks\nwhen green flag clicked\nsay [Hello!] for (2) seconds\n```\n\nThis special format makes the blocks show up visually in the student's browser. \n\nUsing the Scratch blocks from this project. Note that this is the most recent version of the project, and so some previous messages might have been based on an older version of the project.\n\n" + JSON.stringify(result.blocksText, null, 2);

    // Build message array for OpenAI
    const messages = [
      { 
        role: "system", 
        content: systemPrompt
      }
    ];
    
    // Add chat history if available
    if (chatHistory && Array.isArray(chatHistory) && chatHistory.length > 0) {
      console.log(`Adding ${chatHistory.length} messages from chat history for context`);
      chatHistory.forEach(msg => {
        if (msg.role === 'user' || msg.role === 'assistant') {
          messages.push({
            role: msg.role,
            content: msg.content
          });
        }
      });
    }
    
    // Add current prompt
    messages.push({
      role: "user",
      content: question,
    });

    console.log("Messages array:", JSON.stringify(messages, null, 2));

    const openai = new OpenAI(process.env.OPENAI_API_KEY);
    const completion = await openai.chat.completions.create({
      model: "o3-mini",
      messages: messages,
    });

    console.log("Answer:", completion.choices[0].message.content);
    const answer = completion.choices[0].message.content.trim();

    // Generate audio from the text response
    const audioResponse = await openai.audio.speech.create({
      model: "tts-1",
      voice: "nova", // Using a friendly voice appropriate for kids
      input: answer.replace(/```scratchblocks[\s\S]*?```/g, ""), // Remove scratchblocks code from TTS input
    });
    
    // Convert audio response to buffer
    const buffer = Buffer.from(await audioResponse.arrayBuffer());
    
    // Convert buffer to base64 string
    const audioBase64 = buffer.toString('base64');

    return res.status(200).json({ 
      answer,
      projectToken: result.token,
      audio: audioBase64,
      audioFormat: 'mp3'
    });
  } catch (error) {
    console.error("Error processing request:", error);
    return res.status(500).json({ error: error.message });
  }
}
