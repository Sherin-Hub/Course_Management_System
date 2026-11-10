// Reads a Vite environment variable (VITE_*). These are baked in at BUILD time,
// so after changing one on Vercel you must redeploy.
//
// Development: falls back to the local default so `npm run dev` just works.
// Production: there is NO silent fallback to localhost. A missing value is
// reported in the browser console so a misconfigured deploy is easy to spot.
export function readEnv(name, localDefault) {
  const value = (import.meta.env[name] || "").trim().replace(/\/+$/, "");

  if (value) return value;

  if (import.meta.env.DEV) return localDefault;

  console.error(
    `${name} is not set. Add it in your hosting dashboard (Vercel -> Settings -> Environment Variables) and redeploy.`
  );
  return "";
}
