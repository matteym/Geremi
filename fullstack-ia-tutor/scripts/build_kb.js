import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";
import pdf from "pdf-parse";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const pdfDir = path.join(projectRoot, "assets", "cours");
const vectorsDir = path.join(projectRoot, "vectors");
const indexPath = path.join(vectorsDir, "index.json");

const EMBEDDING_MODEL = "models/text-embedding-004";
const MIN_TOKENS = 400;
const MAX_TOKENS = 800;
const TARGET_TOKENS = 650;

function chunkText(text) {
  const words = text.split(/\s+/).filter(Boolean);
  const chunks = [];
  const target = TARGET_TOKENS;
  let i = 0;
  while (i < words.length) {
    const slice = words.slice(i, i + target);
    if (!slice.length) break;
    chunks.push(slice.join(" "));
    i += target;
  }
  // Merge too-small last chunk with previous if needed
  if (chunks.length > 1) {
    const last = chunks[chunks.length - 1].split(/\s+/).length;
    if (last < MIN_TOKENS) {
      const prev = chunks[chunks.length - 2];
      chunks[chunks.length - 2] = `${prev} ${chunks[chunks.length - 1]}`.trim();
      chunks.pop();
    }
  }
  return chunks;
}

async function embedChunk(client, text, id) {
  const res = await client.models.embedContent({
    model: EMBEDDING_MODEL,
    contents: [text],
  });
  const embedding =
    res?.embedding?.values ||
    res?.embeddings?.[0]?.values ||
    null;
  if (!embedding) {
    throw new Error(`Embedding manquant pour ${id}`);
  }
  return embedding;
}

async function build() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY manquante dans l'environnement.");
  }
  const client = new GoogleGenAI({ apiKey });

  await fs.ensureDir(vectorsDir);

  const files = (await fs.readdir(pdfDir)).filter((f) =>
    f.toLowerCase().endsWith(".pdf")
  );
  if (!files.length) {
    console.warn("Aucun PDF trouvé dans", pdfDir);
    await fs.writeJson(indexPath, [], { spaces: 2 });
    return;
  }

  const index = [];

  for (const file of files) {
    const fullPath = path.join(pdfDir, file);
    console.log(`→ Lecture ${file}`);
    const buffer = await fs.readFile(fullPath);
    const parsed = await pdf(buffer);
    const rawText = parsed.text.replace(/\s+\n/g, "\n").replace(/\n{2,}/g, "\n");
    const chunks = chunkText(rawText);

    for (let i = 0; i < chunks.length; i++) {
      const chunkText = chunks[i].trim();
      if (!chunkText) continue;
      const id = `${path.parse(file).name}::${i}`;
      console.log(`   Embedding chunk ${i + 1}/${chunks.length}`);
      const embedding = await embedChunk(client, chunkText, id);
      index.push({
        id,
        file,
        text: chunkText,
        embedding,
      });
    }
  }

  await fs.writeJson(indexPath, index, { spaces: 2 });
  console.log(`Index généré : ${index.length} chunks -> ${indexPath}`);
}

build().catch((err) => {
  console.error("Échec build_kb:", err);
  process.exit(1);
});

