import convertScratchURLToBlocks from "./helpers/convertScratchURLToBlocks.js";
import OpenAI from "openai";

export default async function handler(req, res) {
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
    console.log("URL:", url);
    console.log("Question:", question);
    if (!url || !question) {
      return res.status(400).json({ error: "Missing 'url' or 'question' in request body." });
    }

    if (!url.includes("scratch.mit.edu")) {
      return res.status(400).json({ error: "URL must be from scratch.mit.edu." });
    }

    console.log("Converting URL to blocks...");
    const scratchBlocks = await convertScratchURLToBlocks(url);

    console.log("Generating prompt...");
    const prompt = `Using the following Scratch blocks context:\n${JSON.stringify(
      scratchBlocks,
      null,
      2
    )}\nAnswer the following question: "${question}"`;

    const openai = new OpenAI(process.env.OPENAI_API_KEY);
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
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
