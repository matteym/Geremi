import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..", "..");
const indexPath = path.join(projectRoot, "vectors", "index.json");

let cachedIndex = null;

export function loadIndex() {
  if (cachedIndex) return cachedIndex;
  if (!fs.existsSync(indexPath)) {
    throw new Error("Index introuvable. Lancez npm run build-kb.");
  }
  cachedIndex = fs.readJsonSync(indexPath);
  return cachedIndex;
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

export function semanticSearch(queryEmbedding, topK = 4) {
  const index = loadIndex();
  if (!index.length) return [];

  const scored = index.map((item) => ({
    ...item,
    score: cosineSimilarity(queryEmbedding, item.embedding),
  }));

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}


