import { useEffect } from "react";

const POLL_INTERVAL = 5 * 60 * 1000;
/* eslint-disable no-undef */
const BUILD_HASH = __BUILD_HASH__;
/* eslint-enable no-undef */

export function useVersionPolling() {
  useEffect(() => {
    if (BUILD_HASH === "dev") return;

    const checkVersion = async () => {
      try {
        const res = await fetch(`/version.json?t=${Date.now()}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.buildHash && data.buildHash !== BUILD_HASH) {
          window.location.reload();
        }
      } catch {
        // Ignore network errors
      }
    };

    const interval = setInterval(checkVersion, POLL_INTERVAL);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        checkVersion();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);
}
