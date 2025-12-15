import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const SYSTEM_INSTRUCTION = `
Tu es un tuteur IA pédagogue. Réponds clairement, en français, en t'appuyant uniquement sur le contexte de cours fourni. Si une question sort du périmètre, mentionne-le et propose de revenir au contenu du cours. Donne des exemples courts et actionnables.
`;

const knowledgeBase = `
=== CONTEXTE COURS (simulé) ===
- Module 1 : Introduction à l'IA générative, prompts, limites, éthique.
- Module 2 : Flux RAG : collecte, chunking, embeddings, recherche sémantique.
- Module 3 : Construire une API Node/Express sécurisée avec middleware et JWT.
- Module 4 : Intégrer Stripe Checkout pour un paiement unique.
- Module 5 : Créer un frontend React (Vite) avec gestion d'état et appels API.
- Module 6 : Bonnes pratiques : validation d'entrée, gestion d'erreurs, UX loading.
(6 PDFs sont supposés détailler ces points. Utilise-les comme base unique.)
=== FIN CONTEXTE ===
`;

const apiKey = process.env.GEMINI_API_KEY;
const modelName = process.env.GEMINI_MODEL || "models/gemini-2.5-flash";
const client = apiKey ? new GoogleGenAI({ apiKey }) : null;

function normalizeHistory(history = []) {
  if (!Array.isArray(history)) return [];
  return history
    .map((item) => {
      if (!item?.role || !item?.parts) return null;
      return {
        role: item.role,
        parts: item.parts.map((p) => ({ text: p.text ?? "" })),
      };
    })
    .filter(Boolean);
}

export async function generateResponse(message, history = []) {
  if (!apiKey || !client) {
    throw new Error("Clé GEMINI_API_KEY manquante ou client non initialisé.");
  }

  const safeHistory = normalizeHistory(history);

  const userPrompt = `
${SYSTEM_INSTRUCTION}
${knowledgeBase}

Question utilisateur :
${message}
`;

  const contents = [
    ...safeHistory,
    { role: "user", parts: [{ text: userPrompt }] },
  ];

  const result = await client.models.generateContent({
    model: modelName,
    contents,
  });

  const responseText =
    result?.text ??
    result?.output_text ??
    result?.candidates?.[0]?.content?.parts?.[0]?.text ??
    "Pas de réponse disponible pour le moment.";

  const updatedHistory = [
    ...safeHistory,
    { role: "user", parts: [{ text: message }] },
    { role: "model", parts: [{ text: responseText }] },
  ];

  return { reply: responseText, history: updatedHistory };
}

