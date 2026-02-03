import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";

const SELECTION_OPTIONS = [
  {
    id: "marketing",
    title: "Marketing",
    titleFi: "Markkinointi",
    icon: "/marketing-icon.png",
    path: "/posts",
    type: "navigate",
  },
  {
    id: "sales",
    title: "Sales",
    titleFi: "Myynti",
    icon: "/sales-icon.png",
    path: "/campaigns",
    type: "navigate",
  },
  {
    id: "pages",
    title: "Pages",
    titleFi: "Sivustot",
    icon: "/page-icon.png",
    type: "builder",
  },
];

function SelectionCard({ option, onClick, language }) {
  return (
    <button
      onClick={onClick}
      className="group flex flex-col items-center gap-3 transition-all duration-200 hover:scale-105 focus:outline-none"
    >
      {/* Icon - fills entire container */}
      <div className="w-20 h-20 bg-white rounded-2xl shadow-sm overflow-hidden transition-all duration-200 group-hover:shadow-md">
        <img
          src={option.icon}
          alt={language === "fi" ? option.titleFi : option.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.style.display = "none";
          }}
        />
      </div>

      {/* Label */}
      <span className="text-sm font-medium text-gray-700">
        {language === "fi" ? option.titleFi : option.title}
      </span>
    </button>
  );
}

export default function OnboardingSelectionPage() {
  const navigate = useNavigate();
  const { i18n, t } = useTranslation("common");
  const { user, organization } = useAuth();
  const currentLanguage = i18n.language;

  const handleOpenBuilder = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      alert(t("alerts.error.loginRequired"));
      return;
    }

    let builderUrl = "";

    if (import.meta.env.DEV) {
      builderUrl = "http://app.localhost:3000";
    } else {
      const rootDomain = import.meta.env.VITE_ROOT_DOMAIN || "rascalpages.fi";
      builderUrl = `https://app.${rootDomain}`;
    }

    const handoffUrl = `${builderUrl}/auth/handoff#access_token=${session.access_token}&refresh_token=${session.refresh_token}`;

    console.log("Redirecting to:", handoffUrl);
    window.open(handoffUrl, "_blank");
  };

  const handleSelection = (option) => {
    // Tallenna valittu kategoria localStorageen
    localStorage.setItem("selectedCategory", option.id);

    if (option.type === "builder") {
      handleOpenBuilder();
    } else if (option.type === "navigate" && option.path) {
      navigate(option.path);
    }
  };

  const setLanguage = (lang) => {
    if (lang !== "fi" && lang !== "en") return;
    document.cookie = `rascal.lang=${encodeURIComponent(lang)}; path=/; max-age=31536000`;
    i18n.changeLanguage(lang);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-purple-50 flex flex-col">
      {/* Header */}
      <header className="w-full px-8 py-6 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-purple-600">Rascal AI</h1>
        </div>

        {/* User info and language selector */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm font-medium text-gray-900">
              {organization?.data?.company_name || user?.email || "User"}
            </div>
            <div className="text-xs text-gray-500">
              {user?.email || "user@example.com"}
            </div>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 bg-white rounded-lg shadow-sm">
            <button
              onClick={() => setLanguage("fi")}
              className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                currentLanguage === "fi"
                  ? "bg-purple-100 text-purple-700"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              FI
            </button>
            <button
              onClick={() => setLanguage("en")}
              className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                currentLanguage === "en"
                  ? "bg-purple-100 text-purple-700"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              EN
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-8">
        <div className="max-w-4xl w-full text-center">
          {/* Title */}
          <h2 className="text-4xl font-bold text-gray-900 mb-3">
            {currentLanguage === "fi" ? "Tervetuloa" : "Welcome"}
          </h2>
          <p className="text-lg text-gray-600 mb-16">
            {currentLanguage === "fi"
              ? "Tehokkuus ja kasvu alkavat tästä"
              : "Efficiency and growth start here"}
          </p>

          {/* App grid */}
          <div className="flex flex-wrap justify-center gap-8">
            {SELECTION_OPTIONS.map((option) => (
              <SelectionCard
                key={option.id}
                option={option}
                onClick={() => handleSelection(option)}
                language={currentLanguage}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
