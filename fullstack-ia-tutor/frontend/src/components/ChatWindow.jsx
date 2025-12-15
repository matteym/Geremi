import React, { useState } from "react";
import ragApi from "../utils/ragApi.js";
import MessageBubble from "./MessageBubble.jsx";
import Logo from "./Logo.jsx";

function ChatWindow() {
  const [messages, setMessages] = useState([
    { role: "ai", text: "Alright ! Pose-moi tes questions sur le cours, je suis ready !" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSend = async (e) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    setError(null);
    setLoading(true);
    setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
    setInput("");

    try {
      const { data } = await ragApi.post("/ask", {
        question: trimmed,
      });

      const replyText = data?.answer || "Pas de réponse disponible pour le moment.";
      setMessages((prev) => [...prev, { role: "ai", text: replyText }]);
    } catch (_err) {
      setError("Impossible de joindre le chatbot. Vérifiez le paiement ou réessayez.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section style={styles.wrapper}>
      <header style={styles.header}>
        <Logo size={90} />
        <div>
          <p style={styles.badge}>Accès validé</p>
          <h2 style={styles.title}>Geremi 0.3 · Chat IA</h2>
          <p style={styles.subtitle}>Boosté aux hormones par le cours et le B2B.</p>
        </div>
      </header>

      <div style={styles.messages}>
        {messages.map((msg, idx) => (
          <MessageBubble key={idx} role={msg.role} text={msg.text} />
        ))}
        {loading && <MessageBubble role="ai" text="Rédaction..." />}
      </div>

      <form onSubmit={handleSend} style={styles.footer}>
        <input
          style={styles.input}
          placeholder="Pose ta question..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button style={styles.button} type="submit" disabled={loading}>
          Envoyer
        </button>
      </form>

      {error && <p style={styles.error}>{error}</p>}
    </section>
  );
}

const styles = {
  wrapper: {
    maxWidth: "900px",
    margin: "0 auto",
    background: "#ffffff",
    border: "1px solid #e6ddc4",
    borderRadius: "16px",
    padding: "18px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.08)",
  },
  header: {
    padding: "12px 12px 10px",
    borderBottom: "1px solid #e6ddc4",
    marginBottom: "12px",
    display: "flex",
    gap: "12px",
    alignItems: "center",
  },
  badge: {
    display: "inline-block",
    padding: "4px 10px",
    borderRadius: "999px",
    background: "#f1e3bd",
    color: "#8a6a1c",
    fontWeight: 700,
    fontSize: "12px",
    marginBottom: "6px",
  },
  title: {
    margin: "0",
    color: "#2b2115",
  },
  subtitle: {
    margin: "4px 0 0",
    color: "#574834",
    fontSize: "14px",
  },
  messages: {
    minHeight: "380px",
    maxHeight: "500px",
    overflowY: "auto",
    padding: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  footer: {
    display: "flex",
    gap: "10px",
    marginTop: "12px",
  },
  input: {
    flex: 1,
    padding: "12px",
    borderRadius: "12px",
    border: "1px solid #e6ddc4",
    background: "#f8f5ec",
    color: "#2b2115",
  },
  button: {
    padding: "12px 16px",
    borderRadius: "12px",
    border: "1px solid #cfa945",
    background: "linear-gradient(135deg, #e6c97f, #cfa945)",
    color: "#2b2115",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 10px 25px rgba(207,169,69,0.3)",
  },
  error: {
    color: "#c0392b",
    marginTop: "10px",
  },
};

export default ChatWindow;

