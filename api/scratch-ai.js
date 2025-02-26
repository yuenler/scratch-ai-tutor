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
    const { url, question } = body;
    if (!url || !question) {
      return res.status(400).json({ error: "Missing 'url' or 'question' in request body." });
    }

    if (!url.includes("scratch.mit.edu")) {
      return res.status(400).json({ error: "URL must be from scratch.mit.edu." });
    }

    console.log("Converting URL to blocks...");
    const scratchBlocks = await convertScratchURLToBlocks(url);

    if (!scratchBlocks) {
      return res.status(400).json({ error: "Could not convert URL to blocks." });
    }

    console.log("Generating prompt...");
    const prompt = `Using the following Scratch blocks context:\n${JSON.stringify(
      scratchBlocks,
      null,
      2
    )}\n\nAnswer the following question: "${question}"\n\nWhen including Scratch code examples in your response, use the scratchblocks format by wrapping code in triple backticks with 'scratchblocks' as the language identifier like this:\n\n\`\`\`scratchblocks\nwhen green flag clicked\nsay [Hello!] for (2) seconds\n\`\`\``;

    const openai = new OpenAI(process.env.OPENAI_API_KEY);
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { 
          role: "system", 
          content: "You are a helpful assistant specializing in Scratch programming. When you provide Scratch code examples, always format them using scratchblocks markdown syntax by wrapping the code in triple backticks with 'scratchblocks' as the language identifier.\n\nFormatting guidelines:\n1. Use ```scratchblocks to start and ``` to end a code block\n2. Format blocks according to standard Scratch syntax\n3. Use correct Scratch block shapes in your descriptions\n\nExamples of properly formatted scratchblocks:\n\n```scratchblocks\nwhen green flag clicked\nforever\n  move (10) steps\n  if <touching [edge v]?> then\n    turn right (180) degrees\n  end\nend\n```\n\n```scratchblocks\nwhen [space v] key pressed\nswitch costume to [next costume v]\nplay sound [pop v] until done\nbroadcast [costume changed v]\n```\n\nThis format ensures the code will be rendered as visual Scratch blocks in the interface." 
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });


    console.log("Answer:", completion.choices[0].message.content);
    const answer = completion.choices[0].message.content.trim();

    return res.status(200).json({ answer });
  } catch (error) {
    console.error("Error processing request:", error);
    return res.status(500).json({ error: error.message });
  }
}
