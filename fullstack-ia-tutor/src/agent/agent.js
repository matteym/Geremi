import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { loadIndex, semanticSearch } from "./rag.js";

dotenv.config();

const MODEL_NAME = process.env.GEMINI_MODEL || "models/gemini-1.5-flash";
const EMBED_MODEL = "models/text-embedding-004";
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error("GEMINI_API_KEY manquante.");
}

const client = new GoogleGenAI({ apiKey });

function buildPrompt(question, contexts) {
  const ctx = contexts
    .map(
      (c, idx) =>
        `--- Extrait ${idx + 1} (source: ${c.file}) ---\n${c.text.trim()}`
    )
    .join("\n\n");

  return `
SYSTEM:
Tu es un agent français expert en entrepreneuriat, très pédagogue.
Tu expliques clairement, avec des phrases simples.
Tu t’appuies STRICTEMENT sur les documents PDF fournis.
Tu n’inventes rien.

RÈGLES IMPORTANTES :
1. Si la question est très large (ex: "explique tout le cours", "résumé"), ne dis pas "je ne peux pas". À la place :
   - Liste les grands thèmes ou chapitres que tu identifies dans les extraits.
   - Propose à l'étudiant de choisir un point précis (ex: "On peut commencer par l'innovation, ou l'étude de cas X ?").
   - Adopte un ton encourageant ("On a du pain sur la planche, par quoi veux-tu attaquer ?").
2. Si une question sort du périmètre, dis-le et réoriente.
3. Style autorisé : "alright", "oh yeah", "let’s go" — mais discret.

USER:
Question: ${question}

Contexte :
${ctx}
`.trim();
}

async function embedQuery(text) {
  const res = await client.models.embedContent({
    model: EMBED_MODEL,
    contents: [text],
  });
  return (
    res?.embedding?.values ||
    res?.embeddings?.[0]?.values ||
    []
  );
}

export async function askQuestion(question) {
  if (!question || !question.trim()) {
    throw new Error("Question manquante");
  }

  const queryEmbedding = await embedQuery(question);
  // Augmenter le contexte pour avoir une vue plus large (couvrir tous les fichiers potentiels)
  const top = semanticSearch(queryEmbedding, 12);
  const prompt = buildPrompt(question, top);

  const result = await client.models.generateContent({
    model: MODEL_NAME,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });

  const answer =
    result?.text ??
    result?.candidates?.[0]?.content?.parts?.[0]?.text ??
    "Pas de réponse disponible.";

  return {
    answer: answer.trim(),
    context: top,
  };
}

