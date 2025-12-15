import app from './api/index.js';
import express from 'express';

// On enveloppe le handler Vercel dans un serveur Express standard pour le local
const server = express();

// Middleware pour parser le JSON (déjà fait dans api/index mais nécessaire ici pour le wrapper)
server.use(express.json({ limit: "25mb" }));

server.all('*', async (req, res) => {
  // On passe la main au handler de l'API
  await app(req, res);
});

const PORT = 4000;
server.listen(PORT, () => {
  console.log(`🚀 RAG Server local démarré sur http://localhost:${PORT}`);
  console.log(`👉 Test: http://localhost:${PORT}/api/health`);
});

