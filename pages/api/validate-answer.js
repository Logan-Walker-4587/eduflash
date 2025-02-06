// pages/api/validate-answer.js
import Groq from "groq-sdk";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  try {
    const { question, selectedOption, apiKey } = req.body;
    if (!question || !selectedOption || !apiKey) {
      res.status(400).json({ error: "Missing required parameters (question, selectedOption, apiKey)." });
      return;
    }
    const prompt = `You are an AI that validates answers for multiple-choice questions.
The question is:
"${question}"
The user selected:
"${selectedOption}"
Return only a JSON object strictly in the following format (no extra text):
{"correct": true} 
if the answer is correct or {"correct": false} if not.`;

    const groq = new Groq({ apiKey });
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gemma2-9b-it",
    });

    // Log raw response for debugging
    const rawResponse = chatCompletion.choices[0]?.message?.content || "";
    console.log("Raw response from validate-answer:", rawResponse);

    let output;
    try {
      output = JSON.parse(rawResponse);
    } catch (e) {
      console.error("JSON parse error in validate-answer:", e);
      return res.status(500).json({
        error: "Failed to parse AI response as JSON.",
        raw: rawResponse,
      });
    }
    res.status(200).json(output);
  } catch (error) {
    console.error("Error in validate-answer:", error);
    res.status(500).json({ error: error.message });
  }
}
