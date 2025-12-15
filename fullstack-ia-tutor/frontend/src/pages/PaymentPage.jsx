import React, { useState } from "react";
import api from "../utils/api.js";
import Logo from "../components/Logo.jsx";

function PaymentPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCheckout = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post("/payments/checkout");
      if (data?.url) {
        window.location.href = data.url;
      } else {
        setError("URL de redirection Stripe manquante.");
      }
    } catch (err) {
      setError("Impossible de lancer le paiement. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={styles.container}>
      <section style={styles.card}>
        <div style={styles.logoRow}>
          <Logo size={100} />
          <div>
            <p style={styles.badge}>Paiement unique</p>
            <h2 style={styles.title}>3 € pour un accès illimité</h2>
          </div>
        </div>
        <p style={styles.subtitle}>Redirection sécurisée via Stripe Checkout.</p>
        <button style={styles.button} onClick={handleCheckout} disabled={loading}>
          {loading ? "Redirection..." : "Payer 3€"}
        </button>
        {error && <p style={styles.error}>{error}</p>}
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
    width: "100%",
    maxWidth: "480px",
    background: "#ffffff",
    border: "1px solid #e6ddc4",
    borderRadius: "18px",
    padding: "28px",
    color: "#2b2115",
    boxShadow: "0 20px 60px rgba(0,0,0,0.08)",
    textAlign: "center",
  },
  logoRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    justifyContent: "center",
    marginBottom: "8px",
  },
  badge: {
    display: "inline-block",
    padding: "6px 12px",
    borderRadius: "999px",
    background: "#f1e3bd",
    color: "#8a6a1c",
    fontSize: "12px",
    fontWeight: 700,
    margin: 0,
  },
  title: {
    margin: "6px 0 6px",
  },
  subtitle: {
    margin: "0 0 20px",
    color: "#574834",
  },
  button: {
    width: "100%",
    padding: "14px 16px",
    borderRadius: "12px",
    border: "1px solid #cfa945",
    background: "linear-gradient(135deg, #e6c97f, #cfa945)",
    color: "#2b2115",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 10px 25px rgba(207,169,69,0.3)",
  },
  error: {
    marginTop: "12px",
    color: "#c0392b",
  },
};

export default PaymentPage;

