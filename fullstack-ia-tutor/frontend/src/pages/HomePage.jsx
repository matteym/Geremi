import React, { useState } from "react";
import { Link } from "react-router-dom";
import Logo from "../components/Logo.jsx";

function HomePage() {
  const [clickCount, setClickCount] = useState(() => {
    return parseInt(localStorage.getItem("deguster_count") || "124", 10);
  });

  const handleDegusterClick = () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);
    localStorage.setItem("deguster_count", newCount.toString());
  };

  return (
    <main style={styles.container}>
      <section style={styles.card}>
        <div style={styles.contentColumn}>
          <Logo size={180} />
          
          <div style={styles.textCenter}>
            <h1 style={styles.title}>Geremi 0.3</h1>
            <p style={styles.subtitleSmall}>Votre tuteur IA</p>
            <p style={styles.description}>
              Spécialisé dans le cours de BBA2 Entrepreneurship
            </p>
          </div>

          <div style={styles.actions}>
            <Link 
              to="/chat" 
              state={{ topic: "entrepreneurship" }} 
              style={styles.primary} 
              onClick={handleDegusterClick}
            >
              Entrepreneuriat (Geremi)
            </Link>

            <Link 
              to="/chat" 
              state={{ topic: "geopo" }} 
              style={styles.secondary} 
              onClick={handleDegusterClick}
            >
              Géopolitique (Bosher)
            </Link>

            <Link 
              to="/chat" 
              state={{ topic: "eco" }} 
              style={styles.ecoButton} 
              onClick={handleDegusterClick}
            >
              Économie (JP)
            </Link>
          </div>
          
          <p style={styles.counterText}>
            Déjà {clickCount} disciples pré-incubés pour l'exam
          </p>
        </div>
      </section>
    </main>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #f8f5ec, #f3ebd8)",
    padding: "20px",
  },
  card: {
    maxWidth: "400px",
    width: "100%",
    background: "rgba(255, 255, 255, 0.9)",
    backdropFilter: "blur(10px)",
    border: "1px solid #e6ddc4",
    borderRadius: "24px",
    padding: "40px 24px",
    color: "#2b2115",
    boxShadow: "0 20px 60px rgba(0,0,0,0.08)",
  },
  contentColumn: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "24px",
    textAlign: "center",
  },
  textCenter: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  title: {
    fontSize: "32px",
    margin: "0",
    fontWeight: "800",
    color: "#2b2115",
  },
  subtitleSmall: {
    fontSize: "16px",
    color: "#8a6a1c",
    fontWeight: "600",
    margin: "0",
    textTransform: "uppercase",
    letterSpacing: "1px",
  },
  description: {
    margin: "8px 0 0",
    color: "#574834",
    fontSize: "15px",
    lineHeight: 1.5,
  },
  actions: {
    width: "100%",
    display: "flex",
    flexDirection: "column", // Stack buttons vertically
    gap: "12px", // Add space between buttons
    justifyContent: "center",
    marginTop: "10px",
  },
  primary: {
    display: "block",
    width: "100%",
    padding: "16px 24px",
    background: "linear-gradient(135deg, #e6c97f, #cfa945)",
    color: "#2b2115",
    borderRadius: "99px",
    textDecoration: "none",
    fontWeight: 800,
    fontSize: "18px",
    border: "1px solid #cfa945",
    boxShadow: "0 10px 25px rgba(207,169,69,0.3)",
    textAlign: "center",
    transition: "transform 0.2s",
  },
  secondary: {
    display: "block",
    width: "100%",
    padding: "16px 24px",
    background: "linear-gradient(135deg, #dbeafe, #bfdbfe)",
    color: "#1e3a8a",
    borderRadius: "99px",
    textDecoration: "none",
    fontWeight: 700,
    fontSize: "18px",
    border: "1px solid #93c5fd",
    boxShadow: "0 5px 15px rgba(59,130,246,0.15)",
    textAlign: "center",
    transition: "transform 0.2s",
  },
  ecoButton: {
    display: "block",
    width: "100%",
    padding: "16px 24px",
    background: "linear-gradient(135deg, #dcfce7, #86efac)",
    color: "#14532d",
    borderRadius: "99px",
    textDecoration: "none",
    fontWeight: 700,
    fontSize: "18px",
    border: "1px solid #86efac",
    boxShadow: "0 5px 15px rgba(34,197,94,0.15)",
    textAlign: "center",
    transition: "transform 0.2s",
  },
  counterText: {
    fontSize: "12px",
    color: "#9ca3af",
    margin: "0",
  },
};

export default HomePage;
