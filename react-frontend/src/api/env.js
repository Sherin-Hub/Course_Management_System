
// Read Vite environment variables safely.
const envValues = {
  VITE_API_URL: import.meta.env.VITE_API_URL,
  VITE_SOCKET_URL: import.meta.env.VITE_SOCKET_URL,
  VITE_MOCK_API_URL: import.meta.env.VITE_MOCK_API_URL,
};

export function readEnv(name, localDefault) {
  const value = (envValues[name] || "")
    .trim()
    .replace(/\/+$/, "");

  if (value) return value;

  if (import.meta.env.DEV) return localDefault;

  console.error(
    `${name} is not set. Add it in Vercel Environment Variables and redeploy.`
  );

  return "";
}
