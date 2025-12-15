import express from "express";
import checkPaid from "../middleware/checkPaid.js";
import { generateResponse } from "../services/geminiService.js";

const router = express.Router();

router.post("/", checkPaid, async (req, res) => {
  const { message, history } = req.body ?? {};

  if (!message) {
    return res.status(400).json({ error: "Le champ message est requis." });
  }

  try {
    const { reply, history: updatedHistory } = await generateResponse(message, history);
    return res.json({ reply, history: updatedHistory });
  } catch (error) {
    console.error("Erreur génération Gemini:", error);
    return res.status(500).json({
      error: "Erreur lors de la génération de la réponse.",
      details: error.message,
    });
  }
});

export default router;


