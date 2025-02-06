// pages/index.js
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/router";
import ReactMarkdown from "react-markdown";

export default function Home() {
  const [pdfFile, setPdfFile] = useState(null);
  const [apiKey, setApiKey] = useState("");
  const [userInput, setUserInput] = useState("");
  const [flashcard, setFlashcard] = useState(null); // { front, back }
  const [answerVisible, setAnswerVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  const router = useRouter();

  // Redirect if not logged in.
  useEffect(() => {
    const user = localStorage.getItem("user");
    if (!user) {
      router.push("/login");
    }
  }, [router]);

  const handleFileChange = (e) => {
    setPdfFile(e.target.files[0]);
  };

  // Helper: Parse flashcard markdown text.
  const parseFlashcard = (text) => {
    let front = "";
    let back = "";
    if (text.includes("**Answer:**")) {
      const parts = text.split("**Answer:**");
      front = parts[0].trim();
      back = parts[1] ? parts[1].trim() : "";
    } else if (text.includes("**Back:**")) {
      const parts = text.split("**Back:**");
      if (parts[0].includes("**Front:**")) {
        front = parts[0].replace("**Front:**", "").trim();
      } else {
        front = parts[0].trim();
      }
      back = parts[1] ? parts[1].trim() : "";
    } else {
      front = text.trim();
      back = "";
    }
    return { front, back };
  };

  // Standard flashcard generation.
  const handleGenerate = async () => {
    if (!pdfFile || !apiKey || !userInput) {
      alert("Please provide a PDF file, API key, and a question/topic.");
      return;
    }
    setLoading(true);
    setAnswerVisible(false);

    const formData = new FormData();
    formData.append("pdfFile", pdfFile);
    formData.append("userInput", userInput);
    formData.append("apiKey", apiKey);

    try {
      const res = await fetch("/api/generate-flashcard", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        const content = data.flashcard;
        const parsed = parseFlashcard(content);
        setFlashcard(parsed);
      } else {
        alert("Error: " + data.error);
      }
    } catch (error) {
      alert("Request failed: " + error.message);
    }
    setLoading(false);
  };

  // Simplify only the answer part.
  const handleSimplify = async () => {
    if (!pdfFile || !apiKey || !flashcard) {
      alert("Flashcard not available or missing PDF/API key.");
      return;
    }
    setLoading(true);
    setAnswerVisible(false);

    const formData = new FormData();
    formData.append("pdfFile", pdfFile);
    const simplifyPrompt = `Please simplify the answer portion of the following flashcard, keeping the question unchanged.
**Question:** ${flashcard.front}
**Answer:** ${flashcard.back}`;
    formData.append("userInput", simplifyPrompt);
    formData.append("apiKey", apiKey);

    try {
      const res = await fetch("/api/generate-flashcard", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        const content = data.flashcard;
        const parsed = parseFlashcard(content);
        // If the question remains unchanged, update only the answer.
        if (parsed.front === "" || parsed.front === flashcard.front) {
          setFlashcard({ front: flashcard.front, back: parsed.back });
        } else {
          setFlashcard(parsed);
        }
      } else {
        alert("Error: " + data.error);
      }
    } catch (error) {
      alert("Request failed: " + error.message);
    }
    setLoading(false);
  };

  const handleReveal = () => {
    setAnswerVisible(true);
  };

  // "Next" generates a new flashcard.
  const handleNext = async () => {
    await handleGenerate();
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    router.push("/login");
  };

  return (
    <div className="container">
      <header className="header">
        <h2>Flashcard Generator</h2>
        <div className="header-actions">
          <button className="test-btn" onClick={() => router.push("/test")}>
            Test
          </button>
          <div className="user-menu">
            <button className="user-icon">👤</button>
            <div className="dropdown">
              <div>Settings</div>
              <div onClick={handleLogout}>Logout</div>
            </div>
          </div>
        </div>
      </header>

      <main>
        <h3>Upload a PDF and Generate Flashcards</h3>
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
        <div className="form-group">
          <label>Question or Topic:</label>
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Enter a topic or question"
          />
        </div>
        <button className="generate-btn" onClick={handleGenerate} disabled={loading}>
          {loading ? "Generating..." : "Generate Flashcard"}
        </button>

        {flashcard && (
          <div className="flashcard">
            <div className="front">
              <ReactMarkdown>{flashcard.front}</ReactMarkdown>
            </div>
            <div className={`back ${answerVisible ? "visible" : ""}`}>
              <ReactMarkdown>{flashcard.back}</ReactMarkdown>
            </div>
            <div className="button-group">
              {!answerVisible && flashcard.back && (
                <button className="action-btn reveal-btn" onClick={handleReveal}>
                  Reveal Answer
                </button>
              )}
              <button className="action-btn next-btn" onClick={handleNext}>
                Next
              </button>
              <button className="action-btn simplify-btn" onClick={handleSimplify}>
                Didn't Understand
              </button>
            </div>
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
        .test-btn {
          padding: 8px 12px;
          background: #ffc107;
          color: #fff;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          transition: background 0.3s;
        }
        .test-btn:hover {
          background: #e0a800;
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
        .flashcard {
          background: #fff;
          border-radius: 10px;
          padding: 25px;
          box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
          margin-top: 30px;
          animation: fadeIn 0.5s ease-out;
          overflow-wrap: break-word;
        }
        .flashcard .front {
          font-size: 1.3rem;
          margin-bottom: 20px;
        }
        .flashcard .back {
          font-size: 1.2rem;
          margin-bottom: 20px;
          opacity: 0;
          max-height: 0;
          overflow: hidden;
          transition: opacity 0.5s ease, max-height 0.5s ease;
        }
        .flashcard .back.visible {
          opacity: 1;
          max-height: 500px;
        }
        .button-group {
          display: flex;
          justify-content: center;
          gap: 20px;
          margin-top: 20px;
        }
        .button-group button {
          padding: 10px 20px;
          font-size: 1rem;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          transition: background 0.3s, transform 0.2s;
        }
        .reveal-btn {
          background: #ffc107;
          color: #fff;
        }
        .reveal-btn:hover {
          background: #e0a800;
        }
        .next-btn {
          background: #17a2b8;
          color: #fff;
        }
        .next-btn:hover {
          background: #138496;
        }
        .simplify-btn {
          background: #d63384;
          color: #fff;
        }
        .simplify-btn:hover {
          background: #c32b76;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @media (max-width: 600px) {
          .header,
          .generate-btn {
            padding: 12px 15px;
          }
          .flashcard {
            padding: 20px;
          }
        }
      `}</style>
    </div>
  );
}
