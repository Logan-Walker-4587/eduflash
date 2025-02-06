// pages/api/generate-flashcard.js
import fs from "fs";
import pdfParse from "pdf-parse";
import { IncomingForm } from "formidable";
import Groq from "groq-sdk";

// Disable Next.js built-in body parsing so we can handle multipart/form-data.
export const config = {
  api: {
    bodyParser: false,
  },
};

const parseForm = (req) =>
  new Promise((resolve, reject) => {
    const form = new IncomingForm();
    form.keepExtensions = true;
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
    const { userInput, apiKey } = fields;

    if (!files.pdfFile) {
      res.status(400).json({ error: "No PDF file uploaded." });
      return;
    }

    // If pdfFile is an array, take the first element
    const pdfFile = Array.isArray(files.pdfFile) ? files.pdfFile[0] : files.pdfFile;

    // Log the file data for debugging (optional)
    console.log("Uploaded file data:", pdfFile);

    // Use pdfFile.filepath (for Formidable v2) or pdfFile.path (older versions)
    const filePath = pdfFile.filepath || pdfFile.path;
    if (!filePath) {
      res.status(400).json({ error: "No file path found in uploaded file." });
      return;
    }

    const dataBuffer = fs.readFileSync(filePath);

    // Extract text from the PDF
    const pdfData = await pdfParse(dataBuffer);
    let pdfText = pdfData.text;

    // Limit text length (similar to your Python script)
    pdfText = pdfText.substring(0, 1500);

    // Build the prompt template
    const promptTemplate = `You are a chatbot that helps users learn topics from a given document by creating flashcards. The document content is as follows:\n\n'${pdfText}'\n\nUser's question or topic: '${userInput}'\nCreate a flashcard with a question and answer based on the document content.`;

    // Initialize Groq client
    const groq = new Groq({ apiKey });

    // Make the API call to generate the flashcard
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: promptTemplate,
        },
      ],
      model: "gemma2-9b-it",
    });

    const flashcardContent = chatCompletion.choices[0]?.message?.content || "";
    res.status(200).json({ flashcard: flashcardContent });
  } catch (error) {
    console.error("Error in generate-flashcard:", error);
    res.status(500).json({ error: error.message });
  }
}
