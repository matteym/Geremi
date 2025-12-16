import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import ragApi from "../utils/ragApi.js";
import MessageBubble from "./MessageBubble.jsx";
import Logo from "./Logo.jsx";

function ChatWindow() {
  const location = useLocation();
  const topic = location.state?.topic || "entrepreneurship";
  
  const isGeopo = topic === "geopo";
  const isEco = topic === "eco";

  // Configuration dynamique selon l'agent
  let agentName = "Geremi 0.3";
  let agentSubtitle = "Votre tuteur IA";
  let initialMessage = "Alright ! Pose-moi tes questions sur le cours, je suis ready !";
  let logoSrc = undefined; // Par défaut Geremi (géré dans Logo.jsx)
  let badgeColor = { bg: "#f1e3bd", text: "#8a6a1c" };
  let themeColor = {
    buttonBg: "linear-gradient(135deg, #e6c97f, #cfa945)",
    buttonBorder: "#cfa945",
    inputPlaceholder: "Pose ta question..."
  };

  if (isGeopo) {
    agentName = "Bosher";
    agentSubtitle = "Expert en Géopolitique";
    initialMessage = "Bonjour. Je suis Bosher. Prêt à analyser les enjeux géopolitiques (BRICS, Énergie, etc.). Posez votre question.";
    logoSrc = "/Bosher.png";
    badgeColor = { bg: "#dbeafe", text: "#1e40af" }; // Bleu
    themeColor = {
      buttonBg: "linear-gradient(135deg, #a8d0e6, #5d9cec)",
      buttonBorder: "#5d9cec",
      inputPlaceholder: "Posez une question de géopolitique..."
    };
  } else if (isEco) {
    agentName = "JP";
    agentSubtitle = "Expert en Économie";
    initialMessage = "Bonjour, ici JP. Offre, demande, inflation... Quel concept économique souhaitez-vous approfondir ?";
    logoSrc = "/JP.webp";
    badgeColor = { bg: "#dcfce7", text: "#166534" }; // Vert
    themeColor = {
      buttonBg: "linear-gradient(135deg, #86efac, #22c55e)",
      buttonBorder: "#22c55e",
      inputPlaceholder: "Une question sur l'économie ?"
    };
  }

  const storageKey = `chat_history_${topic}`;

  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch (e) { console.warn("Erreur lecture historique", e); }
    return [{ role: "ai", text: initialMessage }];
  });

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const [loadingText, setLoadingText] = useState("");

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => { scrollToBottom(); }, [messages, loading]);

  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(messages)); } 
    catch (e) { console.warn("Erreur sauvegarde historique", e); }
  }, [messages, storageKey]);

  useEffect(() => {
    let interval;
    if (loading) {
      if (isGeopo) {
        setLoadingText("Bosher est en train d'écrire...");
        interval = setInterval(() => {
          setLoadingText((prev) => 
            prev === "Bosher est en train d'écrire..." 
              ? "suit la trame du cours, pas de paradoxes..." 
              : "Bosher est en train d'écrire..."
          );
        }, 3000);
      } else if (isEco) {
        setLoadingText("JP analyse les marchés...");
        interval = setInterval(() => {
          setLoadingText((prev) => 
            prev === "JP analyse les marchés..." 
              ? "calcule le PIB..." 
              : "JP analyse les marchés..."
          );
        }, 3000);
      } else {
        setLoadingText("Geremi pré-incube une réponse...");
      }
    } else {
      setLoadingText("");
    }
    return () => clearInterval(interval);
  }, [loading, isGeopo, isEco]);

  const handleSend = async (e) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    setError(null);
    setLoading(true);
    setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
    setInput("");

    try {
      const historyToSend = messages.slice(-10).map(m => ({
        role: m.role === "ai" ? "model" : "user",
        parts: [{ text: m.text }]
      }));

      const { data } = await ragApi.post("/ask", {
        question: trimmed,
        topic: topic,
        history: historyToSend
      });

      const replyText = data?.answer || "Pas de réponse disponible pour le moment.";
      setMessages((prev) => [...prev, { role: "ai", text: replyText }]);
    } catch (_err) {
      setError("Impossible de joindre le chatbot. Vérifiez le paiement ou réessayez.");
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = () => {
    if (window.confirm("Effacer l'historique de cette conversation ?")) {
      const resetMsg = [{ role: "ai", text: initialMessage }];
      setMessages(resetMsg);
      localStorage.setItem(storageKey, JSON.stringify(resetMsg));
    }
  };

  return (
    <section className="chat-window-container" style={styles.wrapper}>
      {/* Sidebar Gauche (Desktop) / Header (Mobile) */}
      <div className="chat-sidebar" style={styles.sidebar}>
        <div style={styles.sidebarContent}>
          <Logo size={120} imageSrc={logoSrc} />
          <div style={styles.agentInfo}>
            <p style={{...styles.badge, background: badgeColor.bg, color: badgeColor.text }}>
              Accès validé
            </p>
            <h2 style={styles.title}>{agentName}</h2>
            <p style={styles.subtitle}>{agentSubtitle}</p>
          </div>
        </div>
        
        <button 
          onClick={clearHistory}
          style={styles.clearButton}
          title="Effacer l'historique"
        >
          🗑️ Effacer historique
        </button>
      </div>

      {/* Zone principale Droite (Desktop) / Bas (Mobile) */}
      <div className="chat-main-area" style={styles.mainArea}>
        <div style={styles.messages}>
          {messages.map((msg, idx) => (
            <MessageBubble key={idx} role={msg.role} text={msg.text} />
          ))}
          {loading && (
            <MessageBubble 
              role="ai" 
              text={<span className="typing-text">{loadingText}<span className="typing-dots"></span></span>} 
            />
          )}
          <div ref={messagesEndRef} style={{ height: "20px" }} />
        </div>

        <form onSubmit={handleSend} style={styles.footer}>
          <input
            style={styles.input}
            placeholder={themeColor.inputPlaceholder}
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button 
            style={{...styles.button, background: themeColor.buttonBg, borderColor: themeColor.buttonBorder}}
            type="submit" 
            disabled={loading}
            aria-label="Envoyer"
          >
            {loading ? "..." : "➤"}
          </button>
        </form>
        {error && <p style={styles.error}>{error}</p>}
      </div>
    </section>
  );
}

const styles = {
  wrapper: {
    maxWidth: "1200px",
    margin: "0 auto",
    background: "#ffffff",
    borderRadius: "16px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.08)",
    height: "85vh",
    maxHeight: "900px",
    overflow: "hidden",
    display: "flex",
    flexDirection: "row",
  },
  sidebar: {
    width: "300px",
    background: "#fdfbf7",
    borderRight: "1px solid #e6ddc4",
    padding: "30px 20px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    alignItems: "center",
    textAlign: "center",
  },
  sidebarContent: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "20px",
  },
  agentInfo: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  mainArea: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    background: "#fff",
    position: "relative",
  },
  badge: {
    display: "inline-block",
    padding: "6px 12px",
    borderRadius: "999px",
    fontWeight: 700,
    fontSize: "12px",
    marginBottom: "10px",
  },
  title: {
    margin: "0",
    color: "#2b2115",
    fontSize: "24px",
    fontWeight: "800",
  },
  subtitle: {
    margin: "6px 0 0",
    color: "#574834",
    fontSize: "14px",
  },
  messages: {
    flex: 1,
    overflowY: "auto",
    minHeight: 0,
    padding: "20px 30px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  footer: {
    display: "flex",
    gap: "12px",
    padding: "20px 30px",
    borderTop: "1px solid #f0f0f0",
    alignItems: "center",
    background: "#fff",
  },
  input: {
    flex: 1,
    padding: "16px 20px",
    borderRadius: "99px",
    border: "1px solid #e6ddc4",
    background: "#f8f5ec",
    color: "#2b2115",
    fontSize: "16px",
    outline: "none",
  },
  button: {
    padding: "0",
    width: "54px",
    height: "54px",
    borderRadius: "50%",
    border: "1px solid #cfa945",
    color: "#2b2115",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 4px 15px rgba(207,169,69,0.3)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
    transition: "transform 0.2s",
  },
  clearButton: {
    background: "transparent",
    border: "1px solid #e6ddc4",
    borderRadius: "8px",
    padding: "8px 16px",
    fontSize: "13px",
    color: "#888",
    cursor: "pointer",
    marginTop: "20px",
  },
  error: {
    color: "#c0392b",
    marginTop: "10px",
    textAlign: "center",
    fontSize: "14px",
  },
};

export default ChatWindow;
