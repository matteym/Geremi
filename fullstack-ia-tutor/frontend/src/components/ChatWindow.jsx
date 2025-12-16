import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import ragApi from "../utils/ragApi.js";
import MessageBubble from "./MessageBubble.jsx";
import Logo from "./Logo.jsx";

function ChatWindow() {
  const location = useLocation();
  const topic = location.state?.topic || "entrepreneurship";
  const isGeopo = topic === "geopo";

  const agentName = isGeopo ? "Bosher" : "Geremi 0.3";
  const agentSubtitle = isGeopo ? "Expert en Géopolitique" : "Votre tuteur IA";
  const initialMessage = isGeopo 
    ? "Bonjour. Je suis Bosher. Prêt à analyser les enjeux géopolitiques (BRICS, Énergie, etc.). Posez votre question."
    : "Alright ! Pose-moi tes questions sur le cours, je suis ready !";

  // Clé unique pour le localStorage (ex: chat_history_geopo ou chat_history_entrepreneurship)
  const storageKey = `chat_history_${topic}`;

  const [messages, setMessages] = useState(() => {
    // Tenter de récupérer l'historique depuis localStorage
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn("Erreur lecture historique", e);
    }
    return [{ role: "ai", text: initialMessage }];
  });

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null); // Ref pour le scroll auto

  // État pour le texte de chargement dynamique
  const [loadingText, setLoadingText] = useState("");

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]); // Scroll à chaque nouveau message ou loading

  // Sauvegarder l'historique à chaque changement
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(messages));
    } catch (e) {
      console.warn("Erreur sauvegarde historique", e);
    }
  }, [messages, storageKey]);

  // Gestion de l'animation du texte de chargement
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
        }, 3000); // Change toutes les 3 secondes
      } else {
        setLoadingText("Geremi pré-incube une réponse...");
      }
    } else {
      setLoadingText("");
    }
    return () => clearInterval(interval);
  }, [loading, isGeopo]);

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
        topic: topic, // Envoi du topic au backend
      });

      const replyText = data?.answer || "Pas de réponse disponible pour le moment.";
      setMessages((prev) => [...prev, { role: "ai", text: replyText }]);
    } catch (_err) {
      setError("Impossible de joindre le chatbot. Vérifiez le paiement ou réessayez.");
    } finally {
      setLoading(false);
    }
  };

  // Optionnel : un bouton pour effacer l'historique si ça devient trop long
  const clearHistory = () => {
    if (window.confirm("Effacer l'historique de cette conversation ?")) {
      const resetMsg = [{ role: "ai", text: initialMessage }];
      setMessages(resetMsg);
      localStorage.setItem(storageKey, JSON.stringify(resetMsg));
    }
  };

  return (
    <section style={styles.wrapper} className="chat-wrapper">
      <header style={styles.header}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Logo size={90} imageSrc={isGeopo ? "/Bosher.jpg" : undefined} />
          <div>
            <p style={{...styles.badge, background: isGeopo ? "#dbeafe" : "#f1e3bd", color: isGeopo ? "#1e40af" : "#8a6a1c" }}>
              Accès validé
            </p>
            <h2 style={styles.title}>{agentName}</h2>
            <p style={styles.subtitle}>{agentSubtitle}</p>
          </div>
        </div>
        
        {/* Petit bouton poubelle discret pour reset */}
        <button 
          onClick={clearHistory}
          style={{ 
            background: 'none', 
            border: 'none', 
            cursor: 'pointer', 
            fontSize: '18px', 
            opacity: 0.5,
            marginLeft: 'auto' // Pousse le bouton à droite
          }}
          title="Effacer l'historique"
        >
          🗑️
        </button>
      </header>

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
        {/* Élément invisible pour scroller en bas + Espace pour ne pas être caché par le footer */}
        <div ref={messagesEndRef} style={{ height: "20px" }} />
      </div>

      <form onSubmit={handleSend} style={styles.footer}>
        <input
          style={styles.input}
          placeholder={isGeopo ? "Posez une question de géopolitique..." : "Pose ta question..."}
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button 
          style={{...styles.button, background: isGeopo ? "linear-gradient(135deg, #a8d0e6, #5d9cec)" : "linear-gradient(135deg, #e6c97f, #cfa945)", borderColor: isGeopo ? "#5d9cec" : "#cfa945"}}
          type="submit" 
          disabled={loading}
          aria-label="Envoyer"
        >
          {loading ? "..." : "➤"}
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
    display: "flex",
    flexDirection: "column",
    height: "80vh", // Hauteur fixe sur desktop pour permettre le scroll interne
    maxHeight: "800px", // Limite max confortable
    overflow: "hidden", // Empêche le wrapper de grandir au-delà de sa hauteur définie
    position: "relative", // Pour le positionnement absolu si besoin
  },
  header: {
    padding: "12px 12px 10px",
    borderBottom: "1px solid #e6ddc4",
    marginBottom: "12px",
    display: "flex",
    gap: "12px",
    alignItems: "center",
    justifyContent: "space-between", // Pour placer le bouton delete à droite
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
    fontSize: "20px",
  },
  subtitle: {
    margin: "4px 0 0",
    color: "#574834",
    fontSize: "14px",
  },
  messages: {
    flex: 1, // Prend tout l'espace disponible
    overflowY: "auto",
    minHeight: 0, // CRUCIAL : permet au flex item de rétrécir et de scroller
    padding: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  footer: {
    display: "flex",
    gap: "10px",
    marginTop: "12px",
    alignItems: "center",
  },
  input: {
    flex: 1,
    padding: "12px 16px",
    borderRadius: "24px",
    border: "1px solid #e6ddc4",
    background: "#f8f5ec",
    color: "#2b2115",
    fontSize: "16px", // Bloque le zoom iOS
  },
  button: {
    padding: "12px",
    width: "48px",
    height: "48px",
    borderRadius: "50%", // Rond
    border: "1px solid #cfa945",
    background: "linear-gradient(135deg, #e6c97f, #cfa945)",
    color: "#2b2115",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 10px 25px rgba(207,169,69,0.3)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
  },
  error: {
    color: "#c0392b",
    marginTop: "10px",
  },
};

export default ChatWindow;
