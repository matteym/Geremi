import axios from "axios";

const api = axios.create({
  // API historique (paiement / check-payment / chat protégé)
  baseURL: import.meta.env.VITE_BACKEND_URL || "http://localhost:3000",
  withCredentials: true,
});

export default api;

