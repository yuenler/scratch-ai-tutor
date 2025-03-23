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
    const { projectId, question, projectToken } = body;
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
    const prompt = `Using the Scratch blocks from this project:\n${JSON.stringify(
      result.blocksText,
      null,
      2
    )}\n\nHelp with this question: "${question}"`;

    const openai = new OpenAI(process.env.OPENAI_API_KEY);
    const completion = await openai.chat.completions.create({
      model: "o3-mini",
      messages: [
        { 
          role: "system", 
          content: "You are a friendly Scratch programming tutor for kids. Follow these important rules:\n\n1. Use simple language that children can understand\n2. Don't give direct answers - guide students to discover solutions themselves with hints and questions\n3. Encourage experimentation and learning through trying things out\n4. Break down complex concepts into smaller, easier steps\n5. Always format Scratch code examples using ```scratchblocks syntax\n6. Be encouraging and positive\n7. Give concise answers that kids can read quickly without getting overwhelmed\n\nWhen showing Scratch code, always use this format:\n```scratchblocks\nwhen green flag clicked\nsay [Hello!] for (2) seconds\n```\n\nThis special format makes the blocks show up visually in the student's browser." 
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });


    console.log("Answer:", completion.choices[0].message.content);
    const answer = completion.choices[0].message.content.trim();

    return res.status(200).json({ 
      answer,
      projectToken: result.token
    });
  } catch (error) {
    console.error("Error processing request:", error);
    return res.status(500).json({ error: error.message });
  }
}
