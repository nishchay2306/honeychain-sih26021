import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";

export const api = axios.create({ baseURL: API_BASE });

// Automatically attach the stored JWT (if any) to every request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("honeychain_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export async function getRoles() {
  const { data } = await api.get("/auth/roles");
  return data.roles;
}

export async function registerAccount(payload) {
  const { data } = await api.post("/auth/register", payload);
  return data;
}

export async function login(payload) {
  const { data } = await api.post("/auth/login", payload);
  return data;
}

export async function uploadLabReport(file) {
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post("/uploads/lab-report", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function attachLabReport(batchId, labReportHash) {
  const { data } = await api.post(`/batches/${batchId}/lab-report`, { labReportHash });
  return data;
}

export async function getBatch(id) {
  const { data } = await api.get(`/batches/${id}`);
  return data;
}

export async function getBatchHistory(id) {
  const { data } = await api.get(`/batches/${id}/history`);
  return data;
}

export async function listBatches() {
  const { data } = await api.get(`/batches`);
  return data;
}

export async function registerBatch(payload) {
  const { data } = await api.post(`/batches`, payload);
  return data;
}

export async function advanceStage(id, newStage, updatedBy) {
  const { data } = await api.post(`/batches/${id}/advance`, { newStage, updatedBy });
  return data;
}

export function qrImageUrl(id) {
  return `${API_BASE}/qr/${id}`;
}
