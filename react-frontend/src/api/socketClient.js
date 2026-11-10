import { io } from "socket.io-client";
import { TOKEN_KEY } from "./apiClient";
import { readEnv } from "./env";

// Backend origin, WITHOUT /api/v1 (Socket.IO is not part of the REST path).
// Set VITE_SOCKET_URL in production, e.g. https://your-backend.onrender.com
const SOCKET_URL = readEnv("VITE_SOCKET_URL", "http://localhost:5000");

// Creates a new, not-yet-connected socket. The JWT is read at creation time,
// so call this after the student has logged in.
export function createSocket() {
  return io(SOCKET_URL, {
    autoConnect: false,
    auth: {
      token: sessionStorage.getItem(TOKEN_KEY)
    }
  });
}
