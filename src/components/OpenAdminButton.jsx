import { useTranslation } from "react-i18next";
import { supabase } from "../lib/supabase";

export function OpenAdminButton({ isCollapsed }) {
  const { t } = useTranslation("common");
  const handleOpenAdmin = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      alert(t("alerts.error.loginRequired"));
      return;
    }

    let adminUrl = "";

    if (import.meta.env.DEV) {
      adminUrl = "http://localhost:5173";
    } else {
      adminUrl = import.meta.env.VITE_ADMIN_URL || "https://internal.rascal.ai";
    }

    const handoffUrl = `${adminUrl}/auth/handoff#access_token=${session.access_token}&refresh_token=${session.refresh_token}`;

    window.open(handoffUrl, "_blank");
  };

  return (
    <li className="relative group list-none m-0 p-0">
      <button
        onClick={handleOpenAdmin}
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
              d="M17 20H22V18C22 16.3431 20.6569 15 19 15C18.0444 15 17.1931 15.4468 16.6438 16.1429M17 20H7M17 20V18C17 15.2386 14.7614 13 12 13C9.23858 13 7 15.2386 7 18V20M7 20H2V18C2 16.3431 3.34315 15 5 15C5.95561 15 6.80686 15.4468 7.35625 16.1429M15 7C15 9.20914 13.2091 11 11 11C8.79086 11 7 9.20914 7 7C7 4.79086 8.79086 3 11 3C13.2091 3 15 4.79086 15 7Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        {!isCollapsed && (
          <span className="truncate text-sm">
            {t("sidebar.labels.rascalAdmin")}
          </span>
        )}
      </button>

      {isCollapsed && (
        <span className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-gray-800 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible pointer-events-none whitespace-nowrap z-50 transition-all duration-150 shadow-lg">
          {t("sidebar.labels.rascalAdmin")}
        </span>
      )}
    </li>
  );
}
