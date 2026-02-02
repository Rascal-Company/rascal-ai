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
  };
  return labels[feature] || feature;
};

export default function FeaturesTab({
  features = [],
  isSaving,
  onFeatureToggle,
  userId, // Käyttäjän/organisaation ID
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

  // Lataa käyttäjän kaikki tiedot
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

    // Tarkista WordPress-integraation tila
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

  // Tallenna onboarding_completed arvo
  const handleOnboardingToggle = async (newValue) => {
    if (!userId || onboardingSaving) return;

    setOnboardingSaving(true);
    setOnboardingMessage("");

    try {
      // Tarkista onko käyttäjä admin/moderator/owner
      // Tarkistetaan SEKÄ system role (users.role) ETTÄ organization role (org_members.role)
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
        // Käytä admin-data endpointia admin-käyttäjille (ohittaa RLS:n)
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
        // Normaali käyttäjä: käytä suoraa Supabase-kyselyä
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

  // Tallenna alustavalinnat
  const handlePlatformToggle = async (newPlatforms) => {
    if (!userId) return;

    console.log(
      "[FeaturesTab] handlePlatformToggle called with:",
      newPlatforms,
    );
    setOnboardingSaving(true);
    setSaveMessage("");

    try {
      // Varmista että newPlatforms on array
      const platformsToSave = Array.isArray(newPlatforms) ? newPlatforms : [];

      // Tarkista onko käyttäjä admin/moderator/owner
      // Tarkistetaan SEKÄ system role (users.role) ETTÄ organization role (org_members.role)
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
        // Käytä admin-data endpointia admin-käyttäjille (ohittaa RLS:n)
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

        // Päivitä state arrayina (ei stringinä)
        setUserData((prev) => ({
          ...prev,
          platforms: platformsToSave, // Pidä arrayina staten sisällä
        }));

        setSaveMessage("Alustat päivitetty!");
        setTimeout(() => setSaveMessage(""), 3000);
      } else {
        // Normaali käyttäjä: käytä suoraa Supabase-kyselyä
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

        // Päivitä state arrayina (ei stringinä)
        setUserData((prev) => ({
          ...prev,
          platforms: platformsToSave, // Pidä arrayina staten sisällä
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

  // Käsittele platforms-kenttä eri muodoista (sama logiikka kuin admin-sivulla)
  const getCurrentPlatforms = () => {
    const platformsData = userData?.platforms || [];

    // Jos on jo array, palauta sellaisenaan
    if (Array.isArray(platformsData)) {
      console.log(
        "[FeaturesTab] getCurrentPlatforms: already array:",
        platformsData,
      );
      return platformsData;
    }

    // Jos on string, käsittele sitä
    if (typeof platformsData === "string") {
      // Tyhjä string
      if (!platformsData.trim()) {
        console.log("[FeaturesTab] getCurrentPlatforms: empty string");
        return [];
      }

      // Yritä parsia JSON array stringinä
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
        // Ei JSON, käsittele pilkuilla eroteltuna
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

  // Varmista että features on aina array
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
    <div className="features-tab-container">
      {/* Onboarding-osio */}
      <div
        className="onboarding-section features-section-card"
      >
        <h3
          className="features-section-title"
        >
          Onboarding
        </h3>
        <p
          className="features-section-desc"
        >
          Onko käyttäjän onboarding suoritettu? Jos onboarding on valmis,
          onboarding-modaali ei näy käyttäjälle.
        </p>

        {onboardingMessage && (
          <div className={`features-message ${onboardingMessage.includes("Virhe") ? 'error' : 'success'}`}>
            {onboardingMessage}
          </div>
        )}

        {onboardingLoading ? (
          <div className="features-loading-text">Ladataan...</div>
        ) : (
          <div className="features-toggle-row">
            <label className={`features-toggle-label ${!onboardingCompleted ? 'active' : 'inactive'}`}>
              Ei valmis
            </label>

            <button
              type="button"
              onClick={() => handleOnboardingToggle(!onboardingCompleted)}
              disabled={onboardingSaving}
              className={`features-toggle-btn ${onboardingCompleted ? 'on' : 'off'}`}
            >
              <div className={`features-toggle-knob ${onboardingCompleted ? 'on' : 'off'}`} />
            </button>

            <label className={`features-toggle-label ${onboardingCompleted ? 'active' : 'inactive'}`}>
              Valmis
            </label>
          </div>
        )}
      </div>

      {/* Alustat-osio */}
      <div
        className="platforms-section features-section-card"
      >
        <h3
          className="features-section-title"
        >
          Alustat
        </h3>
        <p
          className="features-section-desc"
        >
          Valitse mitkä alustat ovat käytössä asiakkaalla.
        </p>

        {saveMessage && (
          <div className={`features-message ${saveMessage.includes("Virhe") ? 'error' : 'success'}`}>
            {saveMessage}
          </div>
        )}

        {onboardingLoading ? (
          <div className="features-loading-text">Ladataan...</div>
        ) : (
          <div className="features-platform-grid">
            {ALL_PLATFORMS.map((platform) => {
              const isSelected = currentPlatforms.includes(platform);

              return (
                <label
                  key={platform}
                  className={`features-platform-label ${isSelected ? 'selected' : 'unselected'}`}
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
                    className="features-platform-checkbox"
                  />
                  <span>{platform}</span>
                </label>
              );
            })}
          </div>
        )}

        <div className="features-summary-box">
          <strong>Valittuna:</strong> {currentPlatforms.length} /{" "}
          {ALL_PLATFORMS.length}
        </div>
      </div>

      {/* WordPress-plugin latausosio - näytetään vain jos WordPress on konfiguroitu */}
      {wordpressLoading ? (
        <div className="features-wordpress-loading">
          <div className="features-loading-text">
            Tarkistetaan WordPress-integraatiota...
          </div>
        </div>
      ) : (
        wordpressConfigured && (
          <div className="wordpress-plugin-section features-section-card">
            <h3 className="features-section-title">
              WordPress-plugin
            </h3>
            <p className="features-section-desc">
              WordPress-integraatio on konfiguroitu. Voit ladata Rascal AI
              WordPress-pluginin alla olevasta linkistä.
            </p>

            <a
              href="/plugins/rascal-ai.zip"
              download="rascal-ai.zip"
              className="features-download-btn"
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

            <div
              className="features-note"
            >
              Versio: 1.0 | Tiedoston koko: ~100KB
            </div>
          </div>
        )
      )}

      <div className="features-description">
        <p>
          Hallitse käyttäjän käytössä olevia ominaisuuksia. Ota ominaisuudet
          käyttöön tai poista ne käytöstä vaihtamalla kytkintä.
        </p>
      </div>

      <div className="features-list">
        {ALL_FEATURES.map((feature) => {
          const isEnabled = enabledFeatures.includes(feature);

          return (
            <div key={feature} className="feature-item">
              <div className="feature-info">
                <span className="feature-name">{getFeatureLabel(feature)}</span>
                <span className="feature-key">{feature}</span>
              </div>
              <label className="feature-switch">
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
                  aria-label={getFeatureLabel(feature)}
                />
                <span className="switch-slider" />
              </label>
            </div>
          );
        })}
      </div>

      {enabledFeatures.length === 0 && (
        <div className="no-features-message">
          <p>Käyttäjällä ei ole yhtään aktiivista ominaisuutta.</p>
        </div>
      )}

      <div className="features-summary">
        <div className="summary-item">
          <span className="summary-label">Aktiivisia ominaisuuksia:</span>
          <span className="summary-value">
            {enabledFeatures.length} / {ALL_FEATURES.length}
          </span>
        </div>
      </div>
    </div>
  );
}
