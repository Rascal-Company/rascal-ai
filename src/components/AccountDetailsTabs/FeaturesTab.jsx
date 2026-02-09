import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";

const ALL_FEATURES = [
  "Campaigns",
  "CRM",
  "Phone Calls",
  "Social Media",
  "Marketing assistant",
  "Email marketing integration",
  "Dev",
  "Voicemail",
  "Leads",
  "UGC",
  "Media Monitoring",
  "sitebuilder",
  "Rascal Mail",
];

const ALL_PLATFORMS = [
  "Blog",
  "Newsletter",
  "Instagram Photo",
  "LinkedIn",
  "Instagram Carousel",
  "Instagram Reels",
];

const getFeatureLabel = (feature) => {
  const labels = {
    Voicemail: "Vastaaja",
    Leads: "Liidit",
    "Marketing assistant": "Markkinointiassistentti",
    "Email marketing integration": "Sähköpostimarkkinoinnin integraatio",
    "Phone Calls": "Puhelut",
    "Social Media": "Sosiaalinen media",
    Campaigns: "Kampanjat",
    CRM: "CRM",
    Dev: "Kehitys",
    UGC: "UGC",
    "Media Monitoring": "Mediaseuranta",
    sitebuilder: "Sivustorakentaja",
    "Rascal Mail": "Rascal Mail",
  };
  return labels[feature] || feature;
};

export default function FeaturesTab({
  features = [],
  isSaving,
  onFeatureToggle,
  userId,
}) {
  const { organization, user } = useAuth();
  const [userData, setUserData] = useState(null);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [onboardingLoading, setOnboardingLoading] = useState(true);
  const [onboardingSaving, setOnboardingSaving] = useState(false);
  const [onboardingMessage, setOnboardingMessage] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [localChanges, setLocalChanges] = useState({});
  const [wordpressConfigured, setWordpressConfigured] = useState(false);
  const [wordpressLoading, setWordpressLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setOnboardingLoading(false);
      setWordpressLoading(false);
      return;
    }

    const loadUserData = async () => {
      try {
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .eq("id", userId)
          .single();

        if (error) {
          console.error("[FeaturesTab] Error loading user data:", error);
        } else {
          console.log("[FeaturesTab] Loaded user data:", {
            id: data?.id,
            onboarding_completed: data?.onboarding_completed,
            platforms_type: typeof data?.platforms,
            platforms_value: data?.platforms,
            platforms_parsed: Array.isArray(data?.platforms)
              ? data.platforms
              : "not array",
          });
          setUserData(data || {});
          setOnboardingCompleted(data?.onboarding_completed || false);
        }
      } catch (error) {
        console.error("[FeaturesTab] Error in loadUserData:", error);
      } finally {
        setOnboardingLoading(false);
      }
    };

    const checkWordPressIntegration = async () => {
      try {
        const { data, error } = await supabase
          .from("user_secrets")
          .select("id")
          .eq("user_id", userId)
          .eq("secret_type", "wordpress_api_key")
          .eq("is_active", true)
          .maybeSingle();

        if (error) {
          console.error(
            "[FeaturesTab] Error checking WordPress integration:",
            error,
          );
        } else {
          setWordpressConfigured(!!data);
        }
      } catch (error) {
        console.error(
          "[FeaturesTab] Error in checkWordPressIntegration:",
          error,
        );
      } finally {
        setWordpressLoading(false);
      }
    };

    loadUserData();
    checkWordPressIntegration();
  }, [userId]);

  const handleOnboardingToggle = async (newValue) => {
    if (!userId || onboardingSaving) return;

    setOnboardingSaving(true);
    setOnboardingMessage("");

    try {
      const isSystemAdmin =
        user?.systemRole === "admin" ||
        user?.systemRole === "superadmin" ||
        user?.systemRole === "moderator";
      const isOrgAdmin =
        organization?.role === "admin" ||
        organization?.role === "owner" ||
        organization?.role === "moderator";
      const isAdmin = isSystemAdmin || isOrgAdmin;

      if (isAdmin) {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session?.access_token) {
          throw new Error("Session expired or invalid");
        }

        const response = await fetch("/api/admin/data", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            type: "update-onboarding",
            user_id: userId,
            onboarding_completed: newValue,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || "Failed to update onboarding status",
          );
        }

        setOnboardingCompleted(newValue);
        setOnboardingMessage("Onboarding-status päivitetty onnistuneesti!");
        setTimeout(() => setOnboardingMessage(""), 3000);
      } else {
        const { error } = await supabase
          .from("users")
          .update({
            onboarding_completed: newValue,
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId);

        if (error) {
          throw error;
        }

        setOnboardingCompleted(newValue);
        setOnboardingMessage("Onboarding-status päivitetty onnistuneesti!");
        setTimeout(() => setOnboardingMessage(""), 3000);
      }
    } catch (error) {
      console.error("Error saving onboarding status:", error);
      setOnboardingMessage(
        "Virhe onboarding-statusin tallennuksessa: " +
          (error.message || "Tuntematon virhe"),
      );
      setTimeout(() => setOnboardingMessage(""), 5000);
    } finally {
      setOnboardingSaving(false);
    }
  };

  const handlePlatformToggle = async (newPlatforms) => {
    if (!userId) return;

    console.log(
      "[FeaturesTab] handlePlatformToggle called with:",
      newPlatforms,
    );
    setOnboardingSaving(true);
    setSaveMessage("");

    try {
      const platformsToSave = Array.isArray(newPlatforms) ? newPlatforms : [];

      const isSystemAdmin =
        user?.systemRole === "admin" ||
        user?.systemRole === "superadmin" ||
        user?.systemRole === "moderator";
      const isOrgAdmin =
        organization?.role === "admin" ||
        organization?.role === "owner" ||
        organization?.role === "moderator";
      const isAdmin = isSystemAdmin || isOrgAdmin;

      if (isAdmin) {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session?.access_token) {
          throw new Error("Session expired or invalid");
        }

        const response = await fetch("/api/admin/data", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            type: "update-platforms",
            user_id: userId,
            platforms: platformsToSave,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to update platforms");
        }

        setUserData((prev) => ({
          ...prev,
          platforms: platformsToSave,
        }));

        setSaveMessage("Alustat päivitetty!");
        setTimeout(() => setSaveMessage(""), 3000);
      } else {
        const platformsToSaveString = JSON.stringify(platformsToSave);

        const { error } = await supabase
          .from("users")
          .update({
            platforms: platformsToSaveString,
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId);

        if (error) {
          throw error;
        }

        setUserData((prev) => ({
          ...prev,
          platforms: platformsToSave,
        }));

        setSaveMessage("Alustat päivitetty!");
        setTimeout(() => setSaveMessage(""), 3000);
      }
    } catch (error) {
      console.error("[FeaturesTab] Error saving platforms:", error);
      setSaveMessage(
        "Virhe alustojen tallennuksessa: " +
          (error.message || "Tuntematon virhe"),
      );
      setTimeout(() => setSaveMessage(""), 5000);
    } finally {
      setOnboardingSaving(false);
    }
  };

  const getCurrentPlatforms = () => {
    const platformsData = userData?.platforms || [];

    if (Array.isArray(platformsData)) {
      console.log(
        "[FeaturesTab] getCurrentPlatforms: already array:",
        platformsData,
      );
      return platformsData;
    }

    if (typeof platformsData === "string") {
      if (!platformsData.trim()) {
        console.log("[FeaturesTab] getCurrentPlatforms: empty string");
        return [];
      }

      try {
        const parsed = JSON.parse(platformsData);
        if (Array.isArray(parsed)) {
          console.log(
            "[FeaturesTab] getCurrentPlatforms: parsed from JSON string:",
            parsed,
          );
          return parsed;
        }
      } catch (e) {
        const result = platformsData
          .split(",")
          .map((p) => p.trim())
          .filter((p) => p);
        console.log(
          "[FeaturesTab] getCurrentPlatforms: split by comma:",
          result,
        );
        return result;
      }
    }

    console.log("[FeaturesTab] getCurrentPlatforms: returning empty array");
    return [];
  };

  const enabledFeatures = React.useMemo(() => {
    if (!features) return [];
    if (!Array.isArray(features)) {
      console.warn("Features is not an array:", features);
      return [];
    }
    return features;
  }, [features]);

  const currentPlatforms = getCurrentPlatforms();

  return (
    <div className="space-y-6">
      {/* Onboarding-osio */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <h3 className="text-base font-semibold text-gray-800 mb-1">
          Onboarding
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Onko käyttäjän onboarding suoritettu? Jos onboarding on valmis,
          onboarding-modaali ei näy käyttäjälle.
        </p>

        {onboardingMessage && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${onboardingMessage.includes("Virhe") ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
            {onboardingMessage}
          </div>
        )}

        {onboardingLoading ? (
          <div className="text-sm text-gray-500">Ladataan...</div>
        ) : (
          <div className="flex items-center gap-3">
            <span className={`text-sm px-3 py-1 rounded-full ${!onboardingCompleted ? 'bg-red-100 text-red-800 font-medium' : 'bg-gray-100 text-gray-500'}`}>
              Ei valmis
            </span>

            <button
              type="button"
              onClick={() => handleOnboardingToggle(!onboardingCompleted)}
              disabled={onboardingSaving}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 ${onboardingCompleted ? 'bg-green-500' : 'bg-red-500'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${onboardingCompleted ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>

            <span className={`text-sm px-3 py-1 rounded-full ${onboardingCompleted ? 'bg-green-100 text-green-800 font-medium' : 'bg-gray-100 text-gray-500'}`}>
              Valmis
            </span>
          </div>
        )}
      </div>

      {/* Alustat-osio */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <h3 className="text-base font-semibold text-gray-800 mb-1">
          Alustat
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Valitse mitkä alustat ovat käytössä asiakkaalla.
        </p>

        {saveMessage && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${saveMessage.includes("Virhe") ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
            {saveMessage}
          </div>
        )}

        {onboardingLoading ? (
          <div className="text-sm text-gray-500">Ladataan...</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
            {ALL_PLATFORMS.map((platform) => {
              const isSelected = currentPlatforms.includes(platform);

              return (
                <label
                  key={platform}
                  className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${isSelected ? 'bg-primary-50 border-primary-500 text-primary-700' : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'}`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => {
                      const platformsArray = getCurrentPlatforms();
                      let newPlatforms;
                      if (e.target.checked) {
                        newPlatforms = [...platformsArray, platform];
                      } else {
                        newPlatforms = platformsArray.filter(
                          (p) => p !== platform,
                        );
                      }
                      handlePlatformToggle(newPlatforms);
                    }}
                    disabled={onboardingSaving}
                    className="w-4 h-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm">{platform}</span>
                </label>
              );
            })}
          </div>
        )}

        <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
          <strong>Valittuna:</strong> {currentPlatforms.length} / {ALL_PLATFORMS.length}
        </div>
      </div>

      {/* WordPress-plugin latausosio */}
      {wordpressLoading ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="text-sm text-gray-500">
            Tarkistetaan WordPress-integraatiota...
          </div>
        </div>
      ) : (
        wordpressConfigured && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h3 className="text-base font-semibold text-gray-800 mb-1">
              WordPress-plugin
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              WordPress-integraatio on konfiguroitu. Voit ladata Rascal AI
              WordPress-pluginin alla olevasta linkistä.
            </p>

            <a
              href="/plugins/rascal-ai.zip"
              download="rascal-ai.zip"
              className="inline-flex items-center gap-2 py-2 px-4 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 15.5V8.5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M8.5 12L12 15.5L15.5 12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Lataa WordPress-plugin
            </a>

            <div className="mt-3 text-xs text-gray-500">
              Versio: 1.0 | Tiedoston koko: ~100KB
            </div>
          </div>
        )
      )}

      {/* Ominaisuudet */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <p className="text-sm text-gray-500 mb-4">
          Hallitse käyttäjän käytössä olevia ominaisuuksia. Ota ominaisuudet
          käyttöön tai poista ne käytöstä vaihtamalla kytkintä.
        </p>

        <div className="space-y-3">
          {ALL_FEATURES.map((feature) => {
            const isEnabled = enabledFeatures.includes(feature);

            return (
              <div key={feature} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <span className="text-sm font-medium text-gray-800">{getFeatureLabel(feature)}</span>
                  <span className="ml-2 text-xs text-gray-400">{feature}</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isEnabled}
                    onChange={(e) => {
                      const current = Array.isArray(features) ? features : [];
                      const next = e.target.checked
                        ? Array.from(new Set([...current, feature]))
                        : current.filter((x) => x !== feature);
                      if (onFeatureToggle) {
                        onFeatureToggle(next);
                      } else {
                        console.error(
                          "FeaturesTab - onFeatureToggle is not defined!",
                        );
                      }
                    }}
                    disabled={isSaving}
                    className="sr-only peer"
                    aria-label={getFeatureLabel(feature)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                </label>
              </div>
            );
          })}
        </div>

        {enabledFeatures.length === 0 && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg text-center text-gray-500 text-sm">
            Käyttäjällä ei ole yhtään aktiivista ominaisuutta.
          </div>
        )}

        <div className="mt-4 p-3 bg-gray-50 rounded-lg flex justify-between items-center">
          <span className="text-sm text-gray-600">Aktiivisia ominaisuuksia:</span>
          <span className="text-sm font-semibold text-gray-800">
            {enabledFeatures.length} / {ALL_FEATURES.length}
          </span>
        </div>
      </div>
    </div>
  );
}
