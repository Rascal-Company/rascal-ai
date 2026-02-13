import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export function usePageTracking() {
  const location = useLocation();

  useEffect(() => {
    if (typeof window.gtag === "function") {
      window.gtag("config", "G-B39D9SFM61", {
        page_path: location.pathname + location.search,
      });
    }
  }, [location]);
}
