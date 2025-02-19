import convertScratchURLToBlocks from "./helpers/convertScratchURLToBlocks.js";
import OpenAI from "openai";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { url, question } = req.body;
    if (!url || !question) {
      return res.status(400).json({ error: "Missing 'url' or 'question' in request body." });
    }

    if (!url.includes("scratch.mit.edu")) {
      return res.status(400).json({ error: "URL must be from scratch.mit.edu." });
    }

    const scratchBlocks = await convertScratchURLToBlocks(url);

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

    const answer = completion.choices[0].message.content.trim();

    return res.status(200).json({ answer });
  } catch (error) {
    console.error("Error processing request:", error);
    return res.status(500).json({ error: error.message });
  }
}
