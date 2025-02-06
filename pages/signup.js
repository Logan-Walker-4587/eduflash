// pages/signup.js
import { useState, useEffect } from "react";
import { useRouter } from "next/router";

export default function Signup() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      router.push("/");
    }
  }, [router]);

  const handleSignup = (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    const users = JSON.parse(localStorage.getItem("users") || "{}");
    if (users[username]) {
      setError("Username already exists");
      return;
    }
    users[username] = password;
    localStorage.setItem("users", JSON.stringify(users));
    localStorage.setItem("user", username);
    router.push("/");
  };

  return (
    <div className="signup-page">
      <div className="card">
        <h2>Create an Account</h2>
        {error && <p className="error">{error}</p>}
        <form onSubmit={handleSignup}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <button type="submit">Sign Up</button>
        </form>
        <p>
          Already have an account? <a href="/login">Login</a>
        </p>
      </div>

      <style jsx>{`
        .signup-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #667eea, #764ba2);
          padding: 20px;
        }
        .card {
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
          padding: 40px 30px;
          max-width: 400px;
          width: 100%;
          text-align: center;
          animation: fadeIn 0.8s ease;
        }
        h2 {
          margin-bottom: 20px;
          color: #333;
        }
        form {
          display: flex;
          flex-direction: column;
        }
        input {
          padding: 12px;
          margin-bottom: 15px;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 1rem;
          transition: border-color 0.3s ease;
        }
        input:focus {
          outline: none;
          border-color: #667eea;
        }
        button {
          padding: 12px;
          background: #667eea;
          color: #fff;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          cursor: pointer;
          transition: background 0.3s ease, transform 0.2s ease;
        }
        button:hover {
          background: #556cd6;
          transform: translateY(-2px);
        }
        .error {
          color: #ff4d4f;
          margin-bottom: 10px;
        }
        p {
          margin-top: 20px;
          font-size: 0.9rem;
          color: #555;
        }
        a {
          color: #667eea;
          text-decoration: none;
          font-weight: bold;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
