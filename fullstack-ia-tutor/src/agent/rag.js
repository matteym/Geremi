import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..", "..");
const vectorsDir = path.join(projectRoot, "vectors");

// Cache pour stocker les index chargés en mémoire : { "entrepreneurship": [...], "geopo": [...] }
let cachedIndexes = {};

export function loadIndex(topic = "entrepreneurship") {
  // 1. Vérifier si déjà en cache
  if (cachedIndexes[topic]) return cachedIndexes[topic];

  // 2. Construire le chemin du fichier JSON
  const indexPath = path.join(vectorsDir, `${topic}.json`);

  // 3. Vérifier l'existence
  if (!fs.existsSync(indexPath)) {
    console.warn(`⚠️ Index introuvable pour le topic "${topic}" (${indexPath}).`);
    
    // Fallback : essayer "index.json" (ancien format) si on demande "entrepreneurship"
    if (topic === "entrepreneurship") {
       const fallbackPath = path.join(vectorsDir, "index.json");
       if (fs.existsSync(fallbackPath)) {
         console.log("→ Chargement du fallback vectors/index.json");
         cachedIndexes[topic] = fs.readJsonSync(fallbackPath);
         return cachedIndexes[topic];
       }
    }
    
    return []; // Retourne un tableau vide si rien n'est trouvé
  }

  // 4. Charger et mettre en cache
  try {
    cachedIndexes[topic] = fs.readJsonSync(indexPath);
    return cachedIndexes[topic];
  } catch (err) {
    console.error(`Erreur lecture index ${topic}:`, err);
    return [];
  }
}

function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export function semanticSearch(queryEmbedding, topK = 12, topic = "entrepreneurship") {
  const index = loadIndex(topic);
  if (!index || !index.length) return [];

  const scored = index.map((item) => ({
    ...item,
    score: cosineSimilarity(queryEmbedding, item.embedding),
  }));

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}
