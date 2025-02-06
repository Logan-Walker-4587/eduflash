// pages/test.js
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/router";

export default function TestPage() {
  const [pdfFile, setPdfFile] = useState(null);
  const [apiKey, setApiKey] = useState("");
  const [questionData, setQuestionData] = useState(null); // { question, options: [opt1, opt2, opt3, opt4] }
  const [selectedOption, setSelectedOption] = useState(null);
  const [validationResult, setValidationResult] = useState(null); // { correct: boolean }
  const [scoreRecords, setScoreRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  const router = useRouter();

  // Protect page: redirect to login if not logged in.
  useEffect(() => {
    const user = localStorage.getItem("user");
    if (!user) {
      router.push("/login");
    }
  }, [router]);

  const handleFileChange = (e) => {
    setPdfFile(e.target.files[0]);
  };

  // Generate a new, different multiple-choice question based on the PDF.
  const handleGenerateQuestion = async () => {
    if (!pdfFile || !apiKey) {
      alert("Please provide a PDF file and API key.");
      return;
    }
    setLoading(true);
    // Clear previous question data so the UI resets.
    setQuestionData(null);
    setSelectedOption(null);
    setValidationResult(null);

    const formData = new FormData();
    formData.append("pdfFile", pdfFile);
    formData.append("apiKey", apiKey);
    // Build a prompt that forces a completely new question.
    let promptText =
      "Generate a multiple choice question (with 4 distinct options labeled A, B, C, and D) based on the PDF content. Return only a JSON object in the following format: { \"question\": \"Your question here\", \"options\": [\"A. Option text\", \"B. Option text\", \"C. Option text\", \"D. Option text\"] }.";
    if (questionData && questionData.question) {
      promptText += ` Ensure that this question is completely different from the previous question: "${questionData.question}".`;
    }
    formData.append("userInput", promptText);

    try {
      const res = await fetch("/api/generate-question", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        // Expect data to have { question: string, options: [string, string, string, string] }
        setQuestionData(data);
      } else {
        alert("Error: " + data.error);
      }
    } catch (error) {
      alert("Request failed: " + error.message);
    }
    setLoading(false);
  };

  // When the user selects an option.
  const handleSelectOption = async (option) => {
    setSelectedOption(option);
    // Send the selected answer along with apiKey for validation.
    try {
      const res = await fetch("/api/validate-answer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          question: questionData.question,
          selectedOption: option,
          apiKey: apiKey,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setValidationResult(data); // expecting { correct: boolean }
        setScoreRecords((prev) => [
          ...prev,
          { question: questionData.question, mark: data.correct ? 1 : 0 }
        ]);
      } else {
        alert("Error: " + data.error);
      }
    } catch (error) {
      alert("Request failed: " + error.message);
    }
  };

  const handleNextQuestion = async () => {
    await handleGenerateQuestion();
  };

  return (
    <div className="container">
      <header className="header">
        <h2>Test Mode</h2>
        <div className="header-actions">
          <button className="back-btn" onClick={() => router.push("/")}>
            Back
          </button>
          <div className="user-menu">
            <button className="user-icon">👤</button>
            <div className="dropdown">
              <div>Settings</div>
              <div
                onClick={() => {
                  localStorage.removeItem("user");
                  router.push("/login");
                }}
              >
                Logout
              </div>
            </div>
          </div>
        </div>
      </header>

      <main>
        <div className="upload-section">
          <div className="form-group">
            <label>PDF File:</label>
            <input type="file" accept="application/pdf" onChange={handleFileChange} ref={fileInputRef} />
          </div>
          <div className="form-group">
            <label>Groq API Key:</label>
            <input
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your Groq API key"
            />
          </div>
          <button className="generate-btn" onClick={handleGenerateQuestion} disabled={loading}>
            {loading ? "Generating Question..." : "Generate Question"}
          </button>
        </div>

        {questionData && (
          <div className="question-section">
            <h3>{questionData.question}</h3>
            <div className="options">
              {questionData.options.map((option, index) => (
                <button
                  key={index}
                  className={`option-btn ${selectedOption === option ? "selected" : ""}`}
                  onClick={() => handleSelectOption(option)}
                >
                  {option}
                </button>
              ))}
            </div>
            {validationResult && (
              <div className="result">
                {validationResult.correct ? "Correct!" : "Incorrect."}
              </div>
            )}
            <button className="next-btn" onClick={handleNextQuestion}>
              Next Question
            </button>
          </div>
        )}

        {scoreRecords.length > 0 && (
          <div className="score-table">
            <h3>Score Records</h3>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Question</th>
                  <th>Mark</th>
                </tr>
              </thead>
              <tbody>
                {scoreRecords.map((record, idx) => (
                  <tr key={idx}>
                    <td>{idx + 1}</td>
                    <td>{record.question}</td>
                    <td>{record.mark}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      <style jsx>{`
        .container {
          max-width: 900px;
          margin: 0 auto;
          padding: 20px;
          font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: #fff;
          padding: 15px 25px;
          border-radius: 10px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          margin-bottom: 30px;
        }
        .header-actions {
          display: flex;
          align-items: center;
          gap: 15px;
        }
        .back-btn {
          background: none;
          border: 1px solid #fff;
          color: #fff;
          padding: 5px 10px;
          border-radius: 5px;
          cursor: pointer;
        }
        .user-menu {
          position: relative;
        }
        .user-icon {
          background: none;
          border: none;
          font-size: 1.8rem;
          cursor: pointer;
          transition: transform 0.2s;
        }
        .user-icon:hover {
          transform: scale(1.1);
        }
        .dropdown {
          display: none;
          position: absolute;
          right: 0;
          background: #fff;
          border: 1px solid #ddd;
          border-radius: 5px;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          z-index: 10;
        }
        .user-menu:hover .dropdown {
          display: block;
        }
        .dropdown div {
          padding: 8px 12px;
          cursor: pointer;
          transition: background 0.2s;
          color: #333;
        }
        .dropdown div:hover {
          background: #f0f0f0;
        }
        @media (prefers-color-scheme: dark) {
          .dropdown {
            background: #333;
            border-color: #555;
            box-shadow: 0 2px 5px rgba(255, 255, 255, 0.1);
          }
          .dropdown div {
            color: #eee;
          }
          .dropdown div:hover {
            background: #444;
          }
        }
        main h3 {
          text-align: center;
          margin-bottom: 20px;
          font-size: 1.5rem;
        }
        .upload-section {
          border: 1px solid #ddd;
          padding: 20px;
          border-radius: 10px;
          margin-bottom: 30px;
          background: #f9f9f9;
        }
        .form-group {
          margin: 15px 0;
        }
        .form-group label {
          display: block;
          margin-bottom: 5px;
          font-weight: 600;
        }
        .form-group input[type="text"],
        .form-group input[type="file"] {
          width: 100%;
          padding: 10px;
          border: 1px solid #ccc;
          border-radius: 6px;
          font-size: 1rem;
          transition: border-color 0.2s;
        }
        .form-group input:focus {
          border-color: #667eea;
          outline: none;
        }
        .generate-btn {
          display: block;
          width: 100%;
          max-width: 250px;
          margin: 25px auto;
          padding: 12px;
          background: #28a745;
          color: #fff;
          border: none;
          border-radius: 6px;
          font-size: 1rem;
          cursor: pointer;
          transition: background 0.3s, transform 0.2s;
        }
        .generate-btn:hover {
          background: #218838;
          transform: translateY(-2px);
        }
        .question-section {
          background: #fff;
          border-radius: 10px;
          padding: 20px;
          box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
          margin-bottom: 30px;
          text-align: center;
        }
        .options {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 10px;
          margin-top: 20px;
        }
        .option-btn {
          padding: 10px 20px;
          font-size: 1rem;
          border: 1px solid #ccc;
          border-radius: 6px;
          cursor: pointer;
          transition: background 0.3s, transform 0.2s;
          min-width: 100px;
        }
        .option-btn:hover {
          background: #f0f0f0;
        }
        .option-btn.selected {
          background: #667eea;
          color: #fff;
          border-color: #667eea;
        }
        .result {
          margin-top: 20px;
          font-size: 1.2rem;
          font-weight: bold;
        }
        .next-btn {
          margin-top: 20px;
          padding: 10px 20px;
          background: #17a2b8;
          color: #fff;
          border: none;
          border-radius: 6px;
          font-size: 1rem;
          cursor: pointer;
          transition: background 0.3s, transform 0.2s;
        }
        .next-btn:hover {
          background: #138496;
        }
        .score-table {
          margin-top: 30px;
        }
        .score-table table {
          width: 100%;
          border-collapse: collapse;
        }
        .score-table th,
        .score-table td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: center;
        }
        .score-table th {
          background: #f0f0f0;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}
