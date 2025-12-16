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

const TARGET_TOPIC = "eco"; 
const MODEL_NAME = "gemini-1.5-pro"; // Passage au modèle Pro pour la vision avancée
const EMBEDDING_MODEL = "text-embedding-004";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) throw new Error("GEMINI_API_KEY manquante.");

const client = new GoogleGenAI({ apiKey });
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
    return res?.embedding?.values || res?.embeddings?.[0]?.values || null;
  } catch (error) {
    console.error(`   ❌ Erreur embedding pour ${id}:`, error.message);
    return null;
  }
}

async function processDirectory() {
  const dirPath = path.join(pdfBaseDir, TARGET_TOPIC);
  const outputPath = path.join(vectorsDir, `${TARGET_TOPIC}.json`);
  
  console.log(`\n👁️  DÉMARRAGE MODE VISION (ECO) pour : ${TARGET_TOPIC}`);
  
  if (!await fs.pathExists(dirPath)) {
    console.error(`Dossier introuvable : ${dirPath}`);
    return;
  }

  const files = (await fs.readdir(dirPath)).filter((f) =>
    f.toLowerCase().endsWith(".pdf")
  );

  if (!files.length) {
    console.warn(`Aucun PDF trouvé dans ${TARGET_TOPIC}. Ajoutez vos fichiers ici !`);
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

      // 2. Analyser le PDF complet avec Gemini Vision
      console.log("   🧠 Analyse VISION intelligente...");
      
      const prompt = `
        Agis comme un expert en économie. Analyse ce document PDF.
        Ton but est de créer une base de connaissance parfaite.
        
        Pour CHAQUE PAGE ou section logique :
        1. Extrais TOUT le texte visible.
        2. DÉCRIS CHAQUE GRAPHIQUE, TABLEAU ou IMAGE en détail.
           - Si c'est un graphique : Donne le titre, les axes, les unités, et TOUTES les valeurs clés (pics, creux, tendances).
           - Si c'est un tableau : Transforme-le en texte structuré ou liste.
        3. Fusionne le texte et la description visuelle.
        
        Format de sortie : JSON pur.
        [
          { "page": 1, "content": "..." },
          ...
        ]
        Pas de markdown.
      `;

      // On utilise le modèle pour générer le contenu
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
        console.warn("   ⚠️ Erreur parsing JSON, fallback sur texte brut...");
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
            metadata: { page: page.page, type: "vision_analysis_eco" }
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
  console.log(`\n🎉 Index ECO (Vision) généré : ${index.length} chunks -> ${outputPath}`);
}

processDirectory().catch((err) => {
  console.error("Fatal Error:", err);
  process.exit(1);
});

