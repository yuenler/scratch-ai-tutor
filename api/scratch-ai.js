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
    const { projectId, question, projectToken, chatHistory, useThinkingModel = true } = body;
    if (!projectId || !question) {
      return res.status(400).json({ error: "Missing 'projectId' or 'question' in request body." });
    }

    const url = `https://scratch.mit.edu/projects/${projectId}/`;

    console.log("Converting URL to blocks...");
    let result;
    try {
      result = await convertScratchURLToBlocks(url, projectToken);
      if (!result.blocksText) {
        console.error("Failed to convert project to blocks");
      }
    } catch (error) {
      console.error("Error converting Scratch URL to blocks:", error);
    }

    console.log("Generating prompt...");
    
    // Create system prompt with project blocks
    const systemPrompt = `You are a friendly Scratch tutor for kids. Rules:
1. Use simple language, break down complex concepts into steps
2. Guide with hints and socratic questioning, don't give direct answers. Encourage them to experiment.
3. Always use \`\`\`scratchblocks syntax for ALL code examples. NEVER make a reference to a scratch block without using the syntax, even if it's just a single block that you are suggesting they use.
4. Keep answers concise.
5. Never use scratchblocks syntax without \`\`\`scratchblocks\`\`\` delimiters. I want your responses to very generously show scratch block examples in scratchblocks syntax. If you don't, I will be VERY MAD.

When showing code or making a reference to a block, use the \`\`\`scratchblocks syntax:
\`\`\`scratchblocks
when green flag clicked
say [Hello!] for (2) seconds
\`\`\`

Below are the blocks from the user's project in scratchblocks syntax. If what you see below is null, inform the user you can't see their code and answer based on general knowledge:

${JSON.stringify(result.blocksText, null, 2)}`;

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
    } else {
      // Add current prompt
      messages.push({
        role: "user",
        content: question,
      });
    }

    console.log("Messages array:", JSON.stringify(messages, null, 2));

    // Determine which model to use based on useThinkingModel parameter
    const modelName = useThinkingModel ? "o3-mini" : "gpt-4o-mini";
    console.log(`Using model: ${modelName} (Thinking mode: ${useThinkingModel})`);

    const openai = new OpenAI(process.env.OPENAI_API_KEY);
    const completion = await openai.chat.completions.create({
      model: modelName,
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
