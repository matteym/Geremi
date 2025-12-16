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
const pdfBaseDir = path.join(projectRoot, "assets", "cours");
const vectorsDir = path.join(projectRoot, "vectors");

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
  try {
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
  } catch (error) {
    console.error(`Erreur embedding pour ${id}:`, error.message);
    // Retry logic simple could be added here, but throwing for now
    throw error;
  }
}

async function processDirectory(client, dirName) {
  const dirPath = path.join(pdfBaseDir, dirName);
  const outputPath = path.join(vectorsDir, `${dirName}.json`);
  
  console.log(`\n📂 Traitement du dossier : ${dirName}`);
  
  if (!await fs.pathExists(dirPath)) {
    console.warn(`Dossier introuvable : ${dirPath}`);
    return;
  }

  const files = (await fs.readdir(dirPath)).filter((f) =>
    f.toLowerCase().endsWith(".pdf")
  );

  if (!files.length) {
    console.warn(`Aucun PDF trouvé dans ${dirName}`);
    await fs.writeJson(outputPath, [], { spaces: 2 });
    return;
  }

  const index = [];

  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    console.log(`  → Lecture ${file}`);
    try {
      const buffer = await fs.readFile(fullPath);
      const parsed = await pdf(buffer);
      const rawText = parsed.text.replace(/\s+\n/g, "\n").replace(/\n{2,}/g, "\n");
      const chunks = chunkText(rawText);

      for (let i = 0; i < chunks.length; i++) {
        const chunkText = chunks[i].trim();
        if (!chunkText) continue;
        const id = `${path.parse(file).name}::${i}`;
        // console.log(`     Embedding chunk ${i + 1}/${chunks.length}`); // Moins verbeux
        process.stdout.write("."); // Indicateur de progression minimal
        const embedding = await embedChunk(client, chunkText, id);
        index.push({
          id,
          file,
          text: chunkText,
          embedding,
        });
      }
      console.log(""); // Nouvelle ligne après les points
    } catch (err) {
      console.error(`  ❌ Erreur lecture fichier ${file}:`, err.message);
    }
  }

  await fs.writeJson(outputPath, index, { spaces: 2 });
  console.log(`✅ Index généré pour ${dirName} : ${index.length} chunks -> ${outputPath}`);
}

async function build() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY manquante dans l'environnement.");
  }
  const client = new GoogleGenAI({ apiKey });

  await fs.ensureDir(vectorsDir);

  // Détecter les sous-dossiers dans assets/cours
  const entries = await fs.readdir(pdfBaseDir, { withFileTypes: true });
  const directories = entries.filter(dirent => dirent.isDirectory()).map(dirent => dirent.name);

  if (directories.length === 0) {
    console.warn("⚠️ Aucun sous-dossier trouvé dans assets/cours. Veuillez organiser les PDF par matière (ex: entrepreneurship/, geopo/).");
    // Fallback: Si des PDF sont à la racine, on pourrait les traiter comme 'default' ou 'entrepreneurship' par défaut ?
    // Pour l'instant, on suppose que l'utilisateur a suivi la consigne.
  }

  for (const dir of directories) {
    await processDirectory(client, dir);
  }
}

build().catch((err) => {
  console.error("Échec build_kb:", err);
  process.exit(1);
});
