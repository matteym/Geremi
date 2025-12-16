import axios from "axios";

const ragApi = axios.create({
  baseURL: import.meta.env.VITE_RAG_URL || "http://localhost:4000",
});

export default ragApi;




