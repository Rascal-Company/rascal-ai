import { useTranslation } from "react-i18next";
import { supabase } from "../lib/supabase";

export function OpenBuilderButton({ isCollapsed }) {
  const { t } = useTranslation("common");
  const handleOpenBuilder = async () => {
    // 1. Hae nykyinen sessio
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      alert(t("alerts.error.loginRequired"));
      return;
    }

    // 2. Määritä oikea Builder URL (KRIITTINEN MUUTOS)
    // Meidän pitää ohjata nimenomaan 'app' alidomainiin, jotta Middleware
    // ymmärtää ohjata liikenteen kirjautumislogiikkaan.

    let builderUrl = "";

    if (import.meta.env.DEV) {
      // Kehityksessä: Oletetaan että Next.js on portissa 3000
      // Käytetään app.localhost jotta middleware toimii
      builderUrl = "http://app.localhost:3000";
    } else {
      // Tuotannossa: Käytetään ympäristömuuttujaa TAI kovakoodattua fallbackia
      // Varmistetaan että url alkaa "https://app."
      const rootDomain = import.meta.env.VITE_ROOT_DOMAIN || "rascalpages.fi";
      builderUrl = `https://app.${rootDomain}`;
    }

    // 3. Rakenna "Handoff URL"
    // Lähetetään tokenit URL-fragmentissa (#), ei query parametreina (tietoturva)
    const handoffUrl = `${builderUrl}/auth/handoff#access_token=${session.access_token}&refresh_token=${session.refresh_token}`;

    // 4. Avaa uusi välilehti
    console.log("Redirecting to:", handoffUrl); // Debuggausta varten
    window.open(handoffUrl, "_blank");
  };

  return (
    <li className="relative group list-none m-0 p-0">
      <button
        onClick={handleOpenBuilder}
        type="button"
        className={`
          flex items-center w-full rounded-lg transition-all duration-150 outline-none cursor-pointer border-none
          !bg-transparent !text-gray-300 hover:!bg-gray-800/80 hover:!text-white
          ${isCollapsed ? "justify-center px-3 py-2.5" : "px-4 py-2.5 gap-3"}
        `}
      >
        <span className="flex-shrink-0">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 2L2 7L12 12L22 7L12 2Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M2 17L12 22L22 17"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M2 12L12 17L22 12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        {!isCollapsed && (
          <span className="truncate text-sm">
            {t("sidebar.labels.siteBuilder")}
          </span>
        )}
      </button>

      {/* Tooltip for collapsed state */}
      {isCollapsed && (
        <span className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-gray-800 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible pointer-events-none whitespace-nowrap z-50 transition-all duration-150 shadow-lg">
          {t("sidebar.labels.siteBuilder")}
        </span>
      )}
    </li>
  );
}
