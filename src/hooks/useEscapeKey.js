import { useEffect } from "react";

/**
 * Custom hook joka käsittelee ESC-näppäimen painalluksen
 * @param {Function} onEscape - Funktio joka kutsutaan kun ESC-näppäintä painetaan
 */
export function useEscapeKey(onEscape) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onEscape();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onEscape]);
}
