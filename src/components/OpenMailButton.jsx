import { useTranslation } from "react-i18next";
import { supabase } from "../lib/supabase";

export function OpenMailButton({ isCollapsed }) {
  const { t } = useTranslation("common");
  const handleOpenMail = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      alert(t("alerts.error.loginRequired"));
      return;
    }

    let mailUrl = "";

    if (import.meta.env.DEV) {
      mailUrl = "http://mail.localhost:3000";
    } else {
      mailUrl = "https://mail.rascalai.fi";
    }

    const handoffUrl = `${mailUrl}/auth/handoff#access_token=${session.access_token}&refresh_token=${session.refresh_token}`;

    window.open(handoffUrl, "_blank");
  };

  return (
    <li className="relative group list-none m-0 p-0">
      <button
        onClick={handleOpenMail}
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
            <rect
              x="2"
              y="4"
              width="20"
              height="16"
              rx="2"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M22 7L13.03 12.7C12.7213 12.8934 12.3643 12.9965 12 12.9965C11.6357 12.9965 11.2787 12.8934 10.97 12.7L2 7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        {!isCollapsed && (
          <span className="truncate text-sm">
            {t("sidebar.labels.rascalMail")}
          </span>
        )}
      </button>

      {isCollapsed && (
        <span className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-gray-800 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible pointer-events-none whitespace-nowrap z-50 transition-all duration-150 shadow-lg">
          {t("sidebar.labels.rascalMail")}
        </span>
      )}
    </li>
  );
}
