import express from "express";
import Stripe from "stripe";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

// Charge les variables d'environnement ici pour éviter le problème
// d'ordre de chargement des modules ESM (server.js importe dotenv après les routes).
dotenv.config();

const router = express.Router();

const stripeSecret = process.env.STRIPE_SECRET_KEY;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const JWT_SECRET = process.env.JWT_SECRET;
const PRICE_ID = process.env.PRICE_ID || process.env.STRIPE_PRICE_ID;

const stripe = stripeSecret ? new Stripe(stripeSecret) : null;

router.post("/checkout", async (_req, res) => {
  if (!stripe) {
    return res.status(500).json({ error: "Stripe n'est pas configuré côté serveur." });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price: PRICE_ID,
          quantity: 1,
        },
      ],
      success_url: `${FRONTEND_URL}/chat?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${FRONTEND_URL}/pay`,
    });

    return res.json({ url: session.url });
  } catch (error) {
    console.error("Erreur Stripe checkout:", error);
    return res
      .status(500)
      .json({ error: "Impossible de créer la session de paiement.", details: error.message });
  }
});

router.post("/check-payment", async (req, res) => {
  if (!stripe) {
    return res.status(500).json({ error: "Stripe n'est pas configuré côté serveur." });
  }

  const { session_id } = req.body ?? {};

  try {
    // Si pas de session_id, on tente de valider le cookie payé
    if (!session_id) {
      if (!JWT_SECRET) {
        return res.status(500).json({ error: "JWT_SECRET manquant côté serveur." });
      }
      const token = req.cookies?.paidToken;
      if (!token) {
        return res.status(401).json({ paid: false });
      }
      try {
        jwt.verify(token, JWT_SECRET);
        return res.json({ paid: true });
      } catch (_err) {
        return res.status(401).json({ paid: false });
      }
    }

    const session = await stripe.checkout.sessions.retrieve(session_id);
    const paid = session?.payment_status === "paid";

    if (!paid) {
      return res.json({ paid: false });
    }

    if (!JWT_SECRET) {
      return res.status(500).json({ error: "JWT_SECRET manquant côté serveur." });
    }

    const token = jwt.sign({ paid: true, sessionId: session_id }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.cookie("paidToken", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({ paid: true });
  } catch (error) {
    console.error("Erreur vérification paiement:", error);
    return res
      .status(500)
      .json({ error: "Échec de la vérification de paiement.", details: error.message });
  }
});

export default router;

