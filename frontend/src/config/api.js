const BACKEND_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:3000";

const API_URL = `${BACKEND_URL}/api`;

function getUploadUrl(storageKey) {
  if (!storageKey) {
    return "";
  }

  return `${BACKEND_URL}/uploads/${storageKey}`;
}

export {
  BACKEND_URL,
  API_URL,
  getUploadUrl,
};