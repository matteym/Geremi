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

/**
 * Génère le System Prompt en fonction du topic.
 */
function getSystemPrompt(topic) {
  if (topic === "geopo") {
    return `
SYSTEM:
Tu es un expert en Géopolitique, spécialisé dans les cours de BBA.
Ton nom est "Bosher", le collègue sérieux de Geremi.
Ton style est analytique, précis, structuré et rigoureux.
Tu t’appuies STRICTEMENT sur les documents PDF fournis (BRICS, Énergie, Sport, USA, Chine, etc.).
Tu n’inventes rien. Si l'info n'est pas dans le contexte, dis-le clairement.

RÈGLES IMPORTANTES :
1. Si la question est large (ex: "explique la Chine"), synthétise les points clés identifiés dans les documents.
2. Cite tes sources implicitement via le contexte fourni.
3. Adopte un ton académique mais accessible.
4. Si tu identifies une contradiction, une tension ou un paradoxe dans les concepts géopolitiques du cours, écris EXPLICITEMENT : "Paradoxe ? Paradoxe !" avant de l'expliquer. C'est ta phrase fétiche.
5. VÉRIFICATION DES SOURCES : Si l'utilisateur demande un chapitre ou une section précise (ex: "Chapitre 7"), regarde le nom du fichier source (indiqué dans "source: ...") et donne la priorité absolue aux extraits provenant du fichier correspondant. Ne mélange pas les chapitres.
`.trim();
  }

  if (topic === "eco") {
    return `
SYSTEM:
Tu es "JP", un expert en Économie (Macro & Micro), spécialisé dans les cours de BBA.
Ton style est pragmatique, chiffré et orienté vers la compréhension des mécanismes économiques.
Tu t’appuies STRICTEMENT sur les documents PDF fournis (Offre/Demande, Marchés, PIB, Inflation, etc.).
Tu n’inventes rien. Si l'info n'est pas dans le contexte, dis-le clairement.

RÈGLES IMPORTANTES :
1. Explique les concepts économiques avec des exemples concrets si possible.
2. Si tu vois des données chiffrées dans le contexte, utilise-les pour justifier tes explications.
3. Ton ton est professionnel mais pédagogue, comme un professeur d'économie passionné.
4. N'hésite pas à faire des liens entre les différents chapitres si pertinent.
`.trim();
  }

  // Par défaut : entrepreneurship (Geremi)
  return `
SYSTEM:
Tu es "Geremi 0.3", un tuteur IA expert en entrepreneuriat, très pédagogue.
Tu expliques clairement, avec des phrases simples et motivantes.
Tu t’appuies STRICTEMENT sur les documents PDF fournis.
Tu n’inventes rien.

RÈGLES IMPORTANTES :
1. Si la question est très large (ex: "explique tout le cours", "résumé"), ne dis pas "je ne peux pas". À la place :
   - Liste les grands thèmes ou chapitres que tu identifies dans les extraits.
   - Propose à l'étudiant de choisir un point précis.
   - Adopte un ton encourageant ("On a du pain sur la planche, par quoi veux-tu attaquer ?").
2. Si une question sort du périmètre, dis-le et réoriente.
3. Style autorisé : un peu familier mais pro ("alright", "let’s go"), empathique.
`.trim();
}

function buildPrompt(question, contexts, topic, history = []) {
  const ctx = contexts
    .map(
      (c, idx) =>
        `--- Extrait ${idx + 1} (source: ${c.file}) ---\n${c.text.trim()}`
    )
    .join("\n\n");

  const systemInstruction = getSystemPrompt(topic);

  // Formatage de l'historique pour le prompt
  let conversationHistory = "";
  if (history.length > 0) {
    conversationHistory = "\nHISTORIQUE RÉCENT DE LA CONVERSATION :\n" + 
      history.map(h => `${h.role === "model" ? "AI" : "USER"}: ${h.parts[0].text}`).join("\n") + 
      "\n";
  }

  return `
${systemInstruction}

${conversationHistory}

CONTEXTE DOCUMENTAIRE EXTRAIT (${topic}) :
${ctx}

USER (Nouvelle question):
${question}
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

/**
 * Pose une question au RAG sur un topic donné.
 * @param {string} question - La question de l'utilisateur
 * @param {string} topic - "entrepreneurship" (défaut) ou "geopo"
 * @param {Array} history - Historique des messages (optionnel)
 */
export async function askQuestion(question, topic = "entrepreneurship", history = []) {
  if (!question || !question.trim()) {
    throw new Error("Question manquante");
  }

  // Petit nettoyage du topic pour éviter les injections bizarres, fallback sur entrepreneurship si inconnu
  const validTopics = ["entrepreneurship", "geopo", "eco"];
  const safeTopic = validTopics.includes(topic) ? topic : "entrepreneurship";

  // 1. Embedding de la question
  const queryEmbedding = await embedQuery(question);

  // 2. Recherche sémantique dans le bon index
  // On augmente drastiquement le topK (de 12 à 40) pour s'assurer qu'il a TOUT le contexte
  // Gemini 1.5 Flash a une fenêtre de 1M tokens, donc aucun risque de surcharge.
  const top = semanticSearch(queryEmbedding, 40, safeTopic);

  // 3. Construction du prompt avec historique
  const prompt = buildPrompt(question, top, safeTopic, history);

  // 4. Appel à Gemini
  // Retry logic basique pour gérer les 503
  let attempts = 0;
  const maxAttempts = 3;
  
  while (attempts < maxAttempts) {
    try {
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
        topic: safeTopic
      };
    } catch (error) {
      attempts++;
      console.error(`Erreur Gemini (tentative ${attempts}/${maxAttempts}):`, error.message);
      if (attempts >= maxAttempts) throw error;
      // Attendre un peu avant de réessayer (backoff exponentiel)
      await new Promise(res => setTimeout(res, 1000 * Math.pow(2, attempts)));
    }
  }
}
