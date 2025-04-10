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
    const { projectId, question, projectToken, chatHistory, useThinkingModel = true, screenshot } = body;
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
1. Use simple language and give concise answers. If the question is complex and requires multiple steps, only respond with one step at a time. That is, only provide hints for 1-2 blocks at a time, and NO MORE than that.
2. Guide with hints and socratic questioning, don't give direct answers. Encourage them to experiment, don't just give them the correct code for their project.
3. Always use \`\`\`scratchblocks syntax for ALL code examples. NEVER make a reference to a scratch block without using the syntax, even if it's just a single block that you are suggesting they use.
4. Keep answers concise.
5. IMPORTANT: the user will sometimes include a screenshot of their project to help you understand what they're working on. If you see a screenshot, analyze it and use it to help you answer the user's question.
6. Never use scratchblocks syntax without \`\`\`scratchblocks\`\`\` delimiters. I want your responses to very generously show scratch block examples in scratchblocks syntax. If you don't, I will be VERY MAD.

When showing code or making a reference to a block, use the \`\`\`scratchblocks syntax:
\`\`\`scratchblocks
when green flag clicked
say [Hello!] for (2) seconds
\`\`\``;

    // Build message array for OpenAI
    const messages = [
      { 
        role: "system", 
        content: systemPrompt
      }
    ];
    
    // Format user message content with question first, then blocks and screenshot info
    const userMessageContent = question + (result.blocksText ? `

Below are my project's blocks in scratchblocks syntax:

${JSON.stringify(result.blocksText, null, 2)}` : `

I don't have any blocks from my Scratch project to show you right now. My project is either empty or there was an error loading it.`) + (screenshot ? `

I've also included a screenshot of my Scratch environment.` : `

I don't have a screenshot of my Scratch environment to share.`);

    console.log("User message content:", userMessageContent);

    // Process chat history and current question
    const hasCurrentMessage = chatHistory && 
                             Array.isArray(chatHistory) && 
                             chatHistory.length > 0 && 
                             chatHistory[chatHistory.length - 1].role === 'user' && 
                             chatHistory[chatHistory.length - 1].content === question;
    
    console.log("Has current message:", hasCurrentMessage);
    
    if (chatHistory && Array.isArray(chatHistory) && chatHistory.length > 0) {
      console.log(`Adding ${chatHistory.length} messages from chat history for context`);
      
      // Add all messages except possibly the last one (if it's a duplicate of the current question)
      const messagesToAdd = hasCurrentMessage ? chatHistory.slice(0, -1) : chatHistory;
      
      messagesToAdd.forEach(msg => {
        if (msg.role === 'user' || msg.role === 'assistant') {
          messages.push({
            role: msg.role,
            content: msg.content
          });
        }
      });
    }
    
    // Add or modify the current user message with screenshot if available
    if (screenshot) {
      messages.push({
        role: "user",
        content: [
          { 
            type: "text", 
            text: userMessageContent
          },
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${screenshot}`
            }
          }
        ]
      });
    } else {
      // No screenshot case - always add the message since we've already filtered out duplicates
      messages.push({
        role: "user",
        content: userMessageContent
      });
    }

    console.log("Messages array:", JSON.stringify(messages, null, 2));

    // Determine which model to use based on useThinkingModel parameter
    const modelName = useThinkingModel ? "o3-mini" : "gpt-4o-mini";
    console.log(`Using model: ${modelName} (Thinking mode: ${useThinkingModel}, Screenshot: ${screenshot ? 'yes' : 'no'})`);

    const openai = new OpenAI(process.env.OPENAI_API_KEY);
    
    // Set up streaming response
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });

    // Initialize the streamed response
    let streamedResponse = '';
    
    // Create streaming completion
    const stream = await openai.chat.completions.create({
      model: modelName,
      messages: messages,
      stream: true,
    });

    // Stream the response chunks to the client
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        streamedResponse += content;
        // Send the chunk to the client
        res.write(`data: ${JSON.stringify({ 
          chunk: content,
          done: false 
        })}\n\n`);
      }
    }

    // Send final message with project token
    res.write(`data: ${JSON.stringify({ 
      chunk: '',
      done: true,
      fullResponse: streamedResponse,
      projectToken: result.token 
    })}\n\n`);

    res.end();
  } catch (error) {
    console.error("Error processing request:", error);
    // If we've already started streaming, send error in stream format
    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    } else {
      // Otherwise send a standard error response
      return res.status(500).json({ error: error.message });
    }
  }
}
