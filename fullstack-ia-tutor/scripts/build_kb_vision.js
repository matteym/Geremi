import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { GoogleAIFileManager } from "@google/generative-ai/server";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const pdfBaseDir = path.join(projectRoot, "assets", "cours");
const vectorsDir = path.join(projectRoot, "vectors");

// Configuration
const TARGET_TOPIC = "geopo"; // On ne fait ça que pour la Géopo pour l'instant
const MODEL_NAME = "gemini-1.5-pro"; // Modèle Pro, supporté universellement
const EMBEDDING_MODEL = "text-embedding-004";

// Initialisation API
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) throw new Error("GEMINI_API_KEY manquante.");

// Utilisation de la nouvelle librairie @google/genai pour le client génératif
const client = new GoogleGenAI({ apiKey });

// Pour le FileManager, on garde l'ancienne lib car @google/genai ne l'expose pas encore aussi clairement ou nécessite Node 18+ strict
// Si ça plante, on avisera. Pour l'instant on tente de mixer.
const fileManager = new GoogleAIFileManager(apiKey);

async function uploadToGemini(filePath, mimeType) {
  const uploadResult = await fileManager.uploadFile(filePath, {
    mimeType,
    displayName: path.basename(filePath),
  });
  const file = uploadResult.file;
  console.log(`   Uploaded file ${file.displayName} as: ${file.uri}`);
  return file;
}

async function waitForActive(file) {
  console.log("   Waiting for file processing...");
  let currentState = file.state;
  while (currentState === "PROCESSING") {
    process.stdout.write(".");
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const currentFile = await fileManager.getFile(file.name);
    currentState = currentFile.state;
  }
  console.log("\n   File is ready.");
  if (currentState !== "ACTIVE") {
    throw new Error(`File ${file.name} failed to process`);
  }
}

async function embedText(text, id) {
  try {
    const res = await client.models.embedContent({
        model: EMBEDDING_MODEL,
        contents: [text],
    });
    const embedding = res?.embedding?.values || res?.embeddings?.[0]?.values || null;
    return embedding;
  } catch (error) {
    console.error(`   ❌ Erreur embedding pour ${id}:`, error.message);
    return null;
  }
}

// Fonction pour découper le texte généré si trop long (fallback)
function chunkTextSimple(text) {
  const MAX_CHARS = 2000;
  if (text.length < MAX_CHARS) return [text];
  const chunks = [];
  let i = 0;
  while (i < text.length) {
    chunks.push(text.slice(i, i + MAX_CHARS));
    i += MAX_CHARS;
  }
  return chunks;
}

async function processDirectory() {
  const dirPath = path.join(pdfBaseDir, TARGET_TOPIC);
  const outputPath = path.join(vectorsDir, `${TARGET_TOPIC}.json`); 
  
  console.log(`\n👁️  DÉMARRAGE MODE VISION pour : ${TARGET_TOPIC}`);
  
  if (!await fs.pathExists(dirPath)) {
    console.error(`Dossier introuvable : ${dirPath}`);
    return;
  }

  const files = (await fs.readdir(dirPath)).filter((f) =>
    f.toLowerCase().endsWith(".pdf")
  );

  if (!files.length) {
    console.warn(`Aucun PDF trouvé dans ${TARGET_TOPIC}`);
    return;
  }

  const index = [];

  for (const fileName of files) {
    const fullPath = path.join(dirPath, fileName);
    console.log(`\n📄 Traitement ${fileName}`);
    
    try {
      // 1. Upload PDF
      const uploadResponse = await uploadToGemini(fullPath, "application/pdf");
      await waitForActive(uploadResponse);

      // 2. Analyser le PDF complet avec Gemini
      console.log("   🧠 Analyse intelligente par Gemini Vision...");
      
      const prompt = `
        Tu es un expert en prise de notes de cours.
        Analyse ce document PDF page par page.
        Pour chaque page (ou slide), génère une note complète qui :
        1. Reprend tout le texte écrit.
        2. DÉCRIT PRÉCISÉMENT les éléments visuels (cartes, graphiques, schémas).
           - Pour une carte : Décris les zones géographiques, les légendes, les flèches, les chiffres sur la carte.
           - Pour un graphique : Donne les chiffres clés, les tendances, les axes.
        3. Fusionne le texte et la description visuelle en un paragraphe cohérent et dense.
        
        Format de sortie attendu : Une liste JSON valide.
        [
          { "page": 1, "content": "Contenu détaillé de la page 1..." },
          { "page": 2, "content": "Contenu détaillé de la page 2..." }
        ]
        Ne mets pas de markdown autour du JSON. Juste le JSON brut.
      `;

      // Utilisation du nouveau client @google/genai pour generateContent
      const result = await client.models.generateContent({
        model: MODEL_NAME,
        contents: [
            { role: 'user', parts: [
                { fileData: { mimeType: uploadResponse.mimeType, fileUri: uploadResponse.uri } },
                { text: prompt }
            ]}
        ]
      });

      const responseText = result.response.text();
      
      const cleanJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
      
      let pagesData;
      try {
        pagesData = JSON.parse(cleanJson);
      } catch (e) {
        console.warn("   ⚠️ Erreur parsing JSON, tentative de récupération brute...");
        pagesData = [{ page: "all", content: responseText }];
      }

      console.log(`   ✅ Analyse terminée. ${pagesData.length} sections extraites.`);

      // 3. Embedding des résultats
      for (const page of pagesData) {
        const textToEmbed = page.content;
        if (!textToEmbed || textToEmbed.length < 50) continue; 

        const id = `${fileName}::page-${page.page}`;
        process.stdout.write("E"); 
        
        const embedding = await embedText(textToEmbed, id);
        
        if (embedding) {
          index.push({
            id,
            file: fileName,
            text: textToEmbed,
            embedding,
            metadata: { page: page.page, type: "vision_analysis" }
          });
        }
        
        await new Promise(r => setTimeout(r, 500));
      }
      
      await fileManager.deleteFile(uploadResponse.name);
      console.log("\n   🗑️  Fichier temporaire supprimé.");

    } catch (err) {
      console.error(`\n   ❌ Erreur traitement ${fileName}:`, err.message);
    }
  }

  await fs.writeJson(outputPath, index, { spaces: 2 });
  console.log(`\n🎉 Index Vision généré : ${index.length} chunks -> ${outputPath}`);
}

processDirectory().catch((err) => {
  console.error("Fatal Error:", err);
  process.exit(1);
});

