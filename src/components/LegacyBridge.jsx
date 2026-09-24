import { useEffect } from "react";

/*
 * script.js (unmodified, in public/legacy/script.js) wires each page up
 * inside a single `DOMContentLoaded` listener, and decides what to do by
 * reading `location.pathname` — e.g. it only runs `initLoginPage()` when
 * the path ends in "login.html". That's why every route in App.jsx uses
 * the real .html filenames: it lets this untouched script keep working
 * exactly as it did as a static site.
 *
 * Because React Router navigates without a full page reload, the browser
 * only fires a real DOMContentLoaded once. This component loads the script
 * a single time (cached in `scriptPromise`), then re-dispatches
 * DOMContentLoaded + load on every page mount, so script.js re-runs its
 * page wiring exactly as if a fresh page had just loaded.
 */

let scriptPromise = null;

function loadLegacyScript() {
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "/legacy/script.js";
      script.async = false;
      script.onload = () => resolve();
      script.onerror = (err) => reject(err);
      document.body.appendChild(script);
    });
  }
  return scriptPromise;
}

export default function LegacyBridge() {
  useEffect(() => {
    let cancelled = false;

    loadLegacyScript()
      .then(() => {
        if (cancelled) return;
        document.dispatchEvent(new Event("DOMContentLoaded"));
        window.dispatchEvent(new Event("load"));
      })
      .catch((err) => {
        console.error("Unable to load legacy script.js:", err);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
