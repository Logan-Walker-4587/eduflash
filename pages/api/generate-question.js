// pages/api/generate-question.js
import fs from "fs";
import pdfParse from "pdf-parse";
import { IncomingForm } from "formidable";
import Groq from "groq-sdk";

export const config = {
  api: {
    bodyParser: false,
  },
};

const parseForm = (req) =>
  new Promise((resolve, reject) => {
    const form = new IncomingForm({ keepExtensions: true });
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      resolve({ fields, files });
    });
  });

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  try {
    const { fields, files } = await parseForm(req);
    const { apiKey, userInput } = fields;
    if (!files.pdfFile) {
      res.status(400).json({ error: "No PDF file uploaded." });
      return;
    }
    const pdfFile = Array.isArray(files.pdfFile) ? files.pdfFile[0] : files.pdfFile;
    const filePath = pdfFile.filepath || pdfFile.path;
    if (!filePath) {
      res.status(400).json({ error: "No file path found in uploaded file." });
      return;
    }
    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(dataBuffer);
    let pdfText = pdfData.text.substring(0, 1500);

    const prompt = `You are an AI that generates multiple-choice questions based on a given document.
The document content is:
"${pdfText}"
Generate a multiple-choice question with four options labeled A, B, C, and D.
Return only the JSON object (no additional text) in this exact format:
{
  "question": "Your question here",
  "options": ["A. Option text", "B. Option text", "C. Option text", "D. Option text"]
}
User's instruction: "${userInput}"`;

    const groq = new Groq({ apiKey });
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gemma2-9b-it",
    });

    const rawResponse = chatCompletion.choices[0]?.message?.content || "";
    console.log("Raw response from generate-question:", rawResponse);

    let output;
    try {
      output = JSON.parse(rawResponse);
    } catch (e) {
      console.error("JSON parse error in generate-question:", e);
      return res.status(500).json({
        error: "Failed to parse AI response as JSON.",
        raw: rawResponse,
      });
    }

    return res.status(200).json(output);
  } catch (error) {
    console.error("Error in generate-question:", error);
    res.status(500).json({ error: error.message });
  }
}

