import React from "react";
import { Link } from "react-router-dom";
import Logo from "../components/Logo.jsx";

function HomePage() {
  return (
    <main style={styles.container}>
      <section style={styles.card}>
        <div style={styles.logoRow}>
          <Logo size={110} />
          <div>
            <p style={styles.badge}>Accès illimité</p>
            <h1 style={styles.title}>Geremi 0.3, votre tuteur IA</h1>
          </div>
        </div>
        <p style={styles.subtitle}>
          Payez une seule fois, débloquez l'accès au chatbot IA spécialisé et posez toutes vos questions
          en illimité.
        </p>
        <div style={styles.actions}>
          <Link to="/chat" style={styles.primary}>
            Accéder au chat (Gratuit)
          </Link>
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
    padding: "32px",
  },
  card: {
    maxWidth: "720px",
    width: "100%",
    background: "#ffffff",
    border: "1px solid #e6ddc4",
    borderRadius: "18px",
    padding: "32px",
    color: "#2b2115",
    boxShadow: "0 20px 60px rgba(0,0,0,0.08)",
  },
  logoRow: {
    display: "flex",
    gap: "16px",
    alignItems: "center",
  },
  badge: {
    display: "inline-block",
    padding: "6px 14px",
    borderRadius: "999px",
    background: "#f1e3bd",
    color: "#8a6a1c",
    fontSize: "13px",
    margin: "0 0 6px",
    fontWeight: 600,
  },
  title: {
    fontSize: "30px",
    margin: "0",
  },
  subtitle: {
    margin: "16px 0 28px",
    color: "#574834",
    lineHeight: 1.6,
  },
  actions: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
  },
  primary: {
    padding: "13px 18px",
    background: "linear-gradient(135deg, #e6c97f, #cfa945)",
    color: "#2b2115",
    borderRadius: "12px",
    textDecoration: "none",
    fontWeight: 700,
    border: "1px solid #cfa945",
    boxShadow: "0 10px 25px rgba(207,169,69,0.3)",
  },
  secondary: {
    padding: "13px 18px",
    background: "#f7f2e5",
    color: "#2b2115",
    borderRadius: "12px",
    textDecoration: "none",
    fontWeight: 700,
    border: "1px solid #e6ddc4",
  },
};

export default HomePage;

