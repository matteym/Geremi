import { askQuestion } from "../src/agent/agent.js";

// Fonction utilitaire pour gérer les headers CORS
function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*'); // Autorise tout le monde
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}

export default async function handler(req, res) {
  // 1. Appliquer les headers CORS à TOUTES les réponses
  setCorsHeaders(res);

  // 2. Gérer la requête "Preflight" (OPTIONS) immédiatement
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { url, method } = req;

  // Route /health
  if (url.includes("/health")) {
    return res.status(200).json({ status: "ok" });
  }

  // Route /ask
  if (url.includes("/ask") && method === "POST") {
    const { question, topic, history } = req.body || {};
    
    if (!question) {
      return res.status(400).json({ error: "Question manquante" });
    }

    try {
      // On passe le topic (entrepreneurship ou geopo) ET l'historique à l'agent
      // Si topic est undefined, l'agent utilisera la valeur par défaut
      const result = await askQuestion(question, topic, history);
      return res.json(result);
    } catch (error) {
      console.error("Erreur /ask:", error);
      return res.status(500).json({ error: "Échec génération", details: String(error) });
    }
  }

  // Route par défaut (404)
  return res.status(404).json({ error: "Not Found", path: url });
}
