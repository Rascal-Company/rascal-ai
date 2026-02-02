import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../contexts/AuthContext";
import { useFeatures } from "../hooks/useFeatures";
import { supabase } from "../lib/supabase";
import axios from "axios";
import { getUserOrgId } from "../lib/getUserOrgId";
import { useSearchParams } from "react-router-dom";

// WordPress Logo SVG Component (WordPress "W" logo)
const WordPressLogo = ({ size = 40 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M21.469 6.825c.84 1.537 1.314 3.3 1.314 5.175 0 3.979-2.156 7.456-5.363 9.325l3.295-9.527c.615-1.54.82-2.771.82-3.864 0-.405-.026-.78-.07-1.11m-7.981.105c.647-.03 1.232-.105 1.232-.105.582-.075.514-.93-.067-.899 0 0-1.755.135-2.88.135l.091-.405c.57-1.89 1.538-3.18 2.691-3.18.825 0 1.353.439 1.688.975.615-1.845.961-2.773 1.688-4.137C16.705 2.05 15.57 1.5 14.1 1.5c-3.005 0-4.89 2.22-6.195 5.88L4.32 4.5c-.09-.015-.18-.015-.27-.015-1.305 0-2.565.24-3.75.72C.99 6.225 2.19 8.34 3.63 10.725c.03.045.075.09.12.135-.3-.69-.54-1.425-.675-2.205-.135-.96-.045-1.89.24-2.685.015-.03.03-.045.045-.075L.645 7.92c-.225.84-.225 1.755.135 2.7.495 1.305 1.5 2.535 2.865 3.45l-1.05 3.045C1.05 18.135 0 16.56 0 14.85c0-.105 0-.225.015-.33L3.795 21.03c.12.03.24.045.36.06.09.015.18.03.27.03.135 0 .255-.015.39-.03l2.025-5.685c.15.015.285.03.42.03.27 0 .51-.015.75-.045l-.855 2.4c-.27.78-.54 1.575-.78 2.355-.165.765-.27 1.485-.315 2.13 0 .03-.015.045-.015.075 1.14.405 2.37.645 3.645.645 1.23 0 2.415-.21 3.525-.615a12.25 12.25 0 0 1-1.2-3.48l-.225-.63c-.405-1.125-1.17-1.38-1.875-1.425l1.32-3.84c.075-.225.12-.405.15-.54 1.305-3.84 2.775-5.7 4.44-5.7.96 0 1.56.615 1.785 1.62.105.435.135.93.105 1.38l-.135.975z"
      fill="#21759B"
    />
    <path
      d="M13.155 10.275c-.18.48-.345.915-.48 1.305l-1.26 3.63c-.075.225-.15.435-.21.615-.72 2.115-1.095 3.63-1.095 4.545 0 .495.075.885.195 1.155.345.705 1.17.99 2.325.99.99 0 2.055-.495 3.15-1.485l-.96-2.745c-.48.27-1.035.405-1.62.405-1.89 0-3.225-1.245-3.225-3.24 0-.81.18-1.68.51-2.58l1.17-3.045zm-9.975 4.05c-.435-.405-.705-.96-.705-1.575 0-1.155.96-2.19 2.19-2.19.54 0 1.035.195 1.44.54l-.54 1.53c-.165.45-.27.825-.315 1.125-.165.795-.09 1.395.165 1.875l-2.235-1.305z"
      fill="#21759B"
    />
  </svg>
);

// Google Ads Logo SVG Component
const GoogleAdsLogo = ({ size = 40 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M3.2 15.6L9.6 4.8c.8-1.4 2.6-1.9 4-1.1 1.4.8 1.9 2.6 1.1 4L8.3 18.5c-.8 1.4-2.6 1.9-4 1.1-1.4-.8-1.9-2.6-1.1-4z"
      fill="#FBBC04"
    />
    <path
      d="M20.8 15.6l-6.4-10.8c-.8-1.4-.3-3.2 1.1-4 1.4-.8 3.2-.3 4 1.1l6.4 10.8c.8 1.4.3 3.2-1.1 4-1.4.8-3.2.3-4-1.1z"
      fill="#4285F4"
    />
    <circle cx="6" cy="18" r="3" fill="#34A853" />
  </svg>
);

// Meta Ads Logo SVG Component
const MetaAdsLogo = ({ size = 40 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z"
      fill="#1877F2"
    />
  </svg>
);

// Google Analytics Logo SVG Component
const GoogleAnalyticsLogo = ({ size = 40 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

const AVAILABLE_INTEGRATIONS = [
  {
    id: "wordpress",
    name: "WordPress",
    descriptionKey: "integrations.wordpress.description",
    icon: <WordPressLogo size={40} />,
    secretType: "wordpress_api_key",
    secretName: "WordPress REST API Key",
    fields: [
      {
        id: "username",
        label: "Username",
        type: "text",
        placeholderKey: "integrations.wordpress.username",
        required: true,
        helpTextKey: "integrations.wordpress.usernameHelp",
      },
      {
        id: "password",
        label: "Password",
        type: "password",
        placeholderKey: "integrations.wordpress.password",
        required: true,
        helpTextKey: "integrations.wordpress.passwordHelp",
      },
      {
        id: "url",
        label: "URL",
        type: "url",
        placeholder: "https://example.com",
        required: true,
        helpTextKey: "integrations.wordpress.urlHelp",
      },
    ],
  },
  {
    id: "google_analytics",
    name: "Google Analytics",
    descriptionKey: "integrations.googleAnalytics.description",
    icon: <GoogleAnalyticsLogo size={40} />,
    secretType: "google_analytics_credentials",
    secretName: "Google Analytics Refresh Token",
    useOAuth: true,
    fields: [],
  },
  {
    id: "google_ads",
    name: "Google Ads",
    descriptionKey: "integrations.googleAds.description",
    icon: <GoogleAdsLogo size={40} />,
    secretType: "nango_connection",
    secretName: "Google Ads Connection",
    useNango: true,
    nangoIntegrationId: "google-ads",
    feature: "nango",
    fields: [],
  },
  {
    id: "meta_ads",
    name: "Meta Ads",
    descriptionKey: "integrations.metaAds.description",
    icon: <MetaAdsLogo size={40} />,
    secretType: "nango_connection",
    secretName: "Meta Ads Connection",
    useNango: true,
    nangoIntegrationId: "facebook-ads",
    feature: "nango",
    fields: [],
  },
];

export default function SettingsIntegrationsTab() {
  const { t } = useTranslation("common");
  const { user, organization } = useAuth();
  const { has: hasFeature } = useFeatures();
  const [searchParams, setSearchParams] = useSearchParams();
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [expandedCard, setExpandedCard] = useState(null);
  const [oauthConnecting, setOauthConnecting] = useState(false);
  const [nangoConnecting, setNangoConnecting] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [wordpressPluginDownloaded, setWordpressPluginDownloaded] =
    useState(false);

  // AI-mallin valinta
  const [aiModel, setAiModel] = useState("gemini");
  const [aiModelLoading, setAiModelLoading] = useState(true);
  const [aiModelSaving, setAiModelSaving] = useState(false);
  const [aiModelMessage, setAiModelMessage] = useState("");

  const trackPluginDownload = async (source) => {
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      if (!token) {
        console.warn("No access token found for plugin download tracking");
        return;
      }

      const timestamp = new Date().toISOString();
      await axios.post(
        "/api/users/secrets",
        {
          secret_type: "wordpress_plugin_download",
          secret_name: "WordPress Plugin Download",
          plaintext_value: timestamp,
          metadata: {
            source,
            downloaded_at: timestamp,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      setWordpressPluginDownloaded(true);
    } catch (error) {
      console.error("Error tracking plugin download:", error);
    }
  };

  // Lataa AI-mallin valinta
  const loadAiModel = useCallback(async () => {
    if (!user?.id) return;

    setAiModelLoading(true);
    try {
      // Hae organisaation ID
      let orgUserId = null;
      if (organization?.id) {
        orgUserId = organization.id;
      } else {
        orgUserId = await getUserOrgId(user.id);
      }

      if (!orgUserId) {
        console.error("Organisaation ID puuttuu");
        setAiModelLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("users")
        .select("preferred_ai_model")
        .eq("id", orgUserId)
        .single();

      if (error) {
        console.error("Error loading AI model:", error);
      } else {
        setAiModel(data?.preferred_ai_model || "gemini");
      }
    } catch (error) {
      console.error("Error loading AI model:", error);
    } finally {
      setAiModelLoading(false);
    }
  }, [user?.id, organization?.id]);

  // Tallenna AI-mallin valinta
  const handleAiModelChange = async (newModel) => {
    if (!user?.id || aiModelSaving) return;

    setAiModelSaving(true);
    setAiModelMessage("");

    try {
      // Hae organisaation ID
      let orgUserId = null;
      if (organization?.id) {
        orgUserId = organization.id;
      } else {
        orgUserId = await getUserOrgId(user.id);
      }

      if (!orgUserId) {
        throw new Error("Organisaation ID puuttuu");
      }

      const { error } = await supabase
        .from("users")
        .update({
          preferred_ai_model: newModel,
          updated_at: new Date().toISOString(),
        })
        .eq("id", orgUserId);

      if (error) {
        throw error;
      }

      setAiModel(newModel);
      setAiModelMessage(t("integrations.messages.aiModelUpdated"));
      setTimeout(() => setAiModelMessage(""), 3000);
    } catch (error) {
      console.error("Error saving AI model:", error);
      setAiModelMessage(t("integrations.aiModel.saveError"));
      setTimeout(() => setAiModelMessage(""), 5000);
    } finally {
      setAiModelSaving(false);
    }
  };

  // Lataa AI-malli kun komponentti latautuu
  useEffect(() => {
    if (user?.id) {
      loadAiModel();
    }
  }, [user?.id, loadAiModel]);

  // Lataa integraatiot ja niiden asetukset
  const loadIntegrations = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      // Hae salaisuudet API:sta (metadata, ei purettuja arvoja)
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      if (!token) {
        console.error("No access token found");
        return;
      }

      const response = await axios.get("/api/users/secrets", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const secrets = response.data.secrets || [];

      // Tarkista onko WordPress-plugin ladattu
      const pluginDownloadSecret = secrets.find(
        (s) => s.secret_type === "wordpress_plugin_download",
      );
      setWordpressPluginDownloaded(Boolean(pluginDownloadSecret));

      // Filtteröi integraatiot feature flagien mukaan ja yhdistä tallennettujen kanssa
      const availableIntegrations = AVAILABLE_INTEGRATIONS.filter(
        (integration) =>
          !integration.feature || hasFeature(integration.feature),
      );

      const mergedIntegrations = availableIntegrations.map((integration) => {
        // Etsi tämän integraation salaisuus
        const secret = secrets.find(
          (s) =>
            s.secret_type === integration.secretType &&
            s.secret_name === integration.secretName,
        );

        // Lataa metadata
        const metadata = secret?.metadata || {};
        const isConfigured = Boolean(secret);

        // Täytä formData integraatiokohtaisesti
        let formData = {};
        if (integration.id === "wordpress") {
          formData = {
            username: metadata.username || "",
            password: "", // Ei näytetä, koska se on salattu
            url: metadata.url || "",
          };
        } else if (integration.id === "google_analytics") {
          // Google Analytics: Client ID ja Client Secret metadataan JSON-muodossa
          formData = {
            client_id: metadata.client_id || "",
            client_secret: "", // Ei näytetä, koska se on salattu
          };
        } else {
          formData = {
            api_key: "",
            endpoint: metadata.endpoint || "",
          };
        }

        return {
          ...integration,
          isConfigured,
          secretId: secret?.id,
          formData,
          isActive: secret?.is_active || false,
        };
      });

      setIntegrations(mergedIntegrations);
    } catch (error) {
      console.error("Error loading integrations:", error);
      setMessage({
        type: "error",
        text: t("integrations.loadError"),
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id, hasFeature]);

  useEffect(() => {
    if (user?.id) {
      loadIntegrations();
    }
  }, [user?.id, loadIntegrations]);

  // Helper-funktio URL-parametrien sanitointiin (defense in depth)
  // React escapaa automaattisesti, mutta sanitoidaan silti turvallisuussyistä
  const sanitizeUrlParam = (param) => {
    if (!param) return "";
    try {
      const decoded = decodeURIComponent(param);
      // Poista mahdolliset script-tagit ja haitalliset attribuutit
      return decoded
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        .replace(/javascript:/gi, "")
        .replace(/on\w+\s*=/gi, "") // Poista onclick, onerror, jne.
        .trim()
        .substring(0, 500); // Rajoita pituus
    } catch {
      // Jos dekoodaus epäonnistuu, palauta tyhjä
      return "";
    }
  };

  // Käsittele URL-parametrit (success/error OAuth-callbackista)
  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");
    const tab = searchParams.get("tab");

    if (success) {
      setMessage({
        type: "success",
        text: sanitizeUrlParam(success),
      });
      // Poista success-parametri URL:sta
      searchParams.delete("success");
      setSearchParams(searchParams, { replace: true });
      // Lataa integraatiot uudelleen
      if (user?.id) {
        setTimeout(() => {
          loadIntegrations();
        }, 1000);
      }
    }

    if (error) {
      setMessage({
        type: "error",
        text: sanitizeUrlParam(error),
      });
      // Poista error-parametri URL:sta
      searchParams.delete("error");
      setSearchParams(searchParams, { replace: true });
    }

    // Avaa features-tab jos tab-parametri on asetettu
    if (tab === "features") {
      // Tämä on SettingsPage:n vastuulla, mutta voimme varmistaa että kortti on auki
    }
  }, [searchParams, setSearchParams, user?.id, loadIntegrations]);

  // Tallenna integraation asetukset
  const handleSave = async (integration) => {
    if (!user?.id) return;

    setSaving(true);
    setMessage({ type: "", text: "" });

    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      if (!token) {
        throw new Error("No access token found");
      }

      const formData = integration.formData;

      // Validoi pakolliset kentät integraatiokohtaisesti
      if (integration.id === "wordpress") {
        if (!formData.username || !formData.password || !formData.url) {
          setMessage({
            type: "error",
            text: "Täytä kaikki pakolliset kentät",
          });
          setSaving(false);
          return;
        }
      } else if (integration.id === "google_analytics") {
        if (!formData.client_id || !formData.client_secret) {
          setMessage({
            type: "error",
            text: "Täytä kaikki pakolliset kentät",
          });
          setSaving(false);
          return;
        }
      }

      // Valmistele tallennusdata integraatiokohtaisesti
      let requestData = {};

      if (integration.id === "wordpress") {
        // WordPress: tallenna salasana plaintext_value-kenttään ja username sekä url metadataan
        requestData = {
          secret_type: integration.secretType,
          secret_name: integration.secretName,
          plaintext_value: formData.password,
          metadata: {
            username: formData.username,
            url: formData.url,
            description: `${integration.name} integraatio`,
          },
        };
      } else if (integration.id === "google_analytics") {
        // Google Analytics: tallenna Client Secret plaintext_value-kenttään ja Client ID metadataan
        requestData = {
          secret_type: integration.secretType,
          secret_name: integration.secretName,
          plaintext_value: formData.client_secret,
          metadata: {
            client_id: formData.client_id,
            description: `${integration.name} integraatio`,
          },
        };
      } else {
        // Oletus: WordPress-tyyppinen tallennus
        requestData = {
          secret_type: integration.secretType,
          secret_name: integration.secretName,
          plaintext_value: formData.api_key || "",
          metadata: {
            endpoint: formData.endpoint || "",
            description: `${integration.name} integraatio`,
          },
        };
      }

      // Tallenna salaisuus API:sta
      await axios.post("/api/users/secrets", requestData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      setMessage({
        type: "success",
        text: t("integrations.messages.integrationSaved"),
      });

      // Päivitä integraatio
      setIntegrations((prev) =>
        prev.map((integ) =>
          integ.id === integration.id
            ? { ...integ, isConfigured: true, isActive: true }
            : integ,
        ),
      );

      // Sulje kortti hetkeksi ja avaa uudelleen
      setExpandedCard(null);
      setTimeout(() => {
        setExpandedCard(integration.id);
      }, 500);

      // Lataa integraatiot uudelleen
      setTimeout(() => {
        loadIntegrations();
      }, 1000);
    } catch (error) {
      console.error("Error saving integration:", error);
      const errorMessage =
        error.response?.data?.error || t("integrations.saveError");
      const errorDetails = error.response?.data?.details;
      setMessage({
        type: "error",
        text: errorDetails ? `${errorMessage}: ${errorDetails}` : errorMessage,
      });
    } finally {
      setSaving(false);
    }
  };

  // Poista integraatio
  const handleDelete = async (integration) => {
    if (!user?.id) return;
    if (!confirm("Haluatko varmasti poistaa tämän integraation?")) return;

    setSaving(true);
    setMessage({ type: "", text: "" });

    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      if (!token) {
        throw new Error("No access token found");
      }

      const response = await fetch(
        `/api/users/secrets?secret_type=${integration.secretType}&secret_name=${encodeURIComponent(integration.secretName)}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || t("integrations.deleteError"));
      }

      setMessage({
        type: "success",
        text: t("integrations.messages.integrationDeleted"),
      });

      // Päivitä integraatio
      setIntegrations((prev) =>
        prev.map((integ) =>
          integ.id === integration.id
            ? {
                ...integ,
                isConfigured: false,
                isActive: false,
                formData: {
                  api_key: "",
                  endpoint: "",
                },
              }
            : integ,
        ),
      );

      setExpandedCard(null);
    } catch (error) {
      console.error("Error deleting integration:", error);
      setMessage({
        type: "error",
        text: error.message || t("integrations.deleteError"),
      });
    } finally {
      setSaving(false);
    }
  };

  // Päivitä lomaketietoja
  const handleFormChange = (integrationId, fieldId, value) => {
    setIntegrations((prev) =>
      prev.map((integ) =>
        integ.id === integrationId
          ? {
              ...integ,
              formData: {
                ...integ.formData,
                [fieldId]: value,
              },
            }
          : integ,
      ),
    );
  };

  // Kuuntele popupin postMessage-viestejä
  useEffect(() => {
    const handleMessage = (event) => {
      // Varmista tarvittaessa origin tietoturvasyistä
      // if (event.origin !== window.location.origin) return;

      if (event.data && event.data.type === "GOOGLE_AUTH_RESULT") {
        setOauthConnecting(false);

        if (event.data.status === "success") {
          setMessage({ type: "success", text: event.data.message });
          setTimeout(() => {
            loadIntegrations();
          }, 1000);
        } else {
          setMessage({ type: "error", text: event.data.message });
        }
      }

      if (event.data && event.data.type === "NANGO_AUTH_RESULT") {
        setNangoConnecting(false);

        if (event.data.status === "success") {
          setMessage({ type: "success", text: event.data.message });
          setTimeout(() => {
            loadIntegrations();
          }, 1000);
        } else {
          setMessage({ type: "error", text: event.data.message });
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [loadIntegrations]);

  // Testaa WordPress-yhteyttä
  // eslint-disable-next-line no-unused-vars
  const handleTestWordPressConnection = async (integration) => {
    if (!user?.id || testingConnection) return;

    setTestingConnection(true);
    setMessage({ type: "", text: "" });

    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      if (!token) {
        throw new Error("No access token found");
      }

      // Hae organisaation ID
      let orgUserId = null;
      if (organization?.id) {
        orgUserId = organization.id;
      } else {
        orgUserId = await getUserOrgId(user.id);
      }

      if (!orgUserId) {
        throw new Error("Organisaation ID puuttuu");
      }

      // Testaa yhteyttä blog/publish-endpointilla
      // Käytetään kiinteää test-post_id:tä jota N8N tunnistaa
      const testData = {
        post_id: "f6787bf5-d025-49df-a077-0153f4f396f8",
        auth_user_id: user.id,
        user_id: orgUserId,
        content: "WordPress-yhteyden testaus Rascal AI:sta",
        media_urls: [],
        segments: [],
        post_type: "post",
        action: "test",
      };

      console.log("Testing WordPress connection with:", {
        endpoint: "/api/content/blog/publish",
        userId: orgUserId,
        authUserId: user.id,
      });

      const response = await axios.post("/api/content/blog/publish", testData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("WordPress test response:", response.data);

      if (response.status === 200 && response.data?.success) {
        setMessage({
          type: "success",
          text: t("integrations.testConnection.success"),
        });
      } else {
        // Jos vastaus ei ole success, heitä virhe
        const errorMsg =
          response.data?.error ||
          response.data?.details ||
          t("integrations.testFailed");
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error("Error testing WordPress connection:", error);
      console.error("Error response:", error.response?.data);

      // Käsittele axios-virheet erikseen
      let errorMessage = t("integrations.testConnection.failed");

      if (error.response) {
        // Serveri vastasi virhekoodilla
        const status = error.response.status;
        const data = error.response.data;

        // Näytä backendin palauttama virheviesti
        if (data?.error) {
          // Tarkista onko kyseessä "Ei yhdistettyjä sometilejä" -virhe
          if (
            data.error === "Ei yhdistettyjä sometilejä" ||
            data.error.toLowerCase().includes("no connected social")
          ) {
            errorMessage = t("integrations.testConnection.noSocialAccounts");
          } else {
            errorMessage = data.error;
          }

          if (data?.details) {
            errorMessage += `\n\n${data.details}`;
          }
          if (data?.hint) {
            errorMessage += `\n\n💡 ${data.hint}`;
          }
        } else if (data?.message) {
          errorMessage = data.message;
        } else {
          errorMessage = `HTTP ${status}: ${error.response.statusText || t("integrations.testConnection.unknownError")}`;
        }
      } else if (error.request) {
        // Pyyntö lähetettiin mutta vastausta ei saatu
        errorMessage = t("integrations.testConnection.noResponse");
      } else {
        // Jokin muu virhe
        errorMessage =
          error.message || t("integrations.testConnection.unknownError");
      }

      setMessage({
        type: "error",
        text: errorMessage,
      });
    } finally {
      setTestingConnection(false);
    }
  };

  // Käynnistä Google Analytics OAuth -virta
  const handleGoogleAnalyticsOAuth = async () => {
    if (!user?.id || oauthConnecting) return;

    setOauthConnecting(true);
    setMessage({ type: "", text: "" });

    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      if (!token) {
        throw new Error("No access token found");
      }

      // Kutsu backend-endpointia joka luo OAuth-URL:n
      const response = await axios.get("/api/auth/google/start", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const { authUrl } = response.data;

      if (!authUrl) {
        throw new Error("OAuth URL ei saatu");
      }

      // Avaa popup keskelle ruutua
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const popup = window.open(
        authUrl,
        "google_analytics_oauth",
        `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=yes,status=no`,
      );

      if (!popup) {
        setOauthConnecting(false);
        setMessage({
          type: "error",
          text: "Popup estetty. Salli popup-ikkunat tälle sivustolle.",
        });
        return;
      }

      // Fallback: jos postMessage ei toimi tai ikkuna suljetaan manuaalisesti ilman viestiä
      const checkPopup = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkPopup);
          // Jos tila on yhä "connecting", käyttäjä todennäköisesti sulki ikkunan manuaalisesti
          setOauthConnecting((prev) => {
            if (prev) {
              // Voimme yrittää ladata integraatiot varmuuden vuoksi, jos viesti jäi saamatta
              loadIntegrations();
              return false;
            }
            return false;
          });
        }
      }, 1000);

      // Timeout 5 minuutin jälkeen
      setTimeout(
        () => {
          if (!popup.closed) {
            popup.close();
            clearInterval(checkPopup);
            setOauthConnecting(false);
            setMessage({
              type: "error",
              text: "OAuth-yhdistys aikakatkaistiin. Yritä uudelleen.",
            });
          }
        },
        5 * 60 * 1000,
      );
    } catch (error) {
      console.error("Error starting Google Analytics OAuth:", error);
      setOauthConnecting(false);
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        t("integrations.oauthError");
      const errorDetails = error.response?.data?.details;
      const errorHint = error.response?.data?.hint;

      // Muodosta virheilmoitus
      let fullErrorMessage = errorMessage;
      if (errorDetails) {
        fullErrorMessage += `: ${errorDetails}`;
      }
      if (errorHint) {
        fullErrorMessage += `\n\nVihje: ${errorHint}`;
      }

      setMessage({
        type: "error",
        text: fullErrorMessage,
      });
    }
  };

  // Käynnistä Nango OAuth -virta (Google Ads, Meta Ads jne.)
  const handleNangoConnect = async (integration) => {
    if (!user?.id || nangoConnecting) return;

    setNangoConnecting(true);
    setMessage({ type: "", text: "" });

    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      if (!token) {
        throw new Error("No access token found");
      }

      const response = await axios.post(
        "/api/integrations/nango/connect",
        {
          integration_id: integration.nangoIntegrationId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      const { connect_link } = response.data;

      if (!connect_link) {
        throw new Error("Connect link ei saatu backendistä");
      }

      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const popup = window.open(
        connect_link,
        "nango_connect",
        `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=yes,status=no`,
      );

      if (!popup) {
        setNangoConnecting(false);
        setMessage({
          type: "error",
          text: "Popup estetty. Salli popup-ikkunat tälle sivustolle.",
        });
        return;
      }

      const checkPopup = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkPopup);
          setNangoConnecting((prev) => {
            if (prev) {
              loadIntegrations();
              return false;
            }
            return false;
          });
        }
      }, 1000);

      setTimeout(
        () => {
          if (!popup.closed) {
            popup.close();
            clearInterval(checkPopup);
            setNangoConnecting(false);
            setMessage({
              type: "error",
              text: "Nango-yhdistys aikakatkaistiin. Yritä uudelleen.",
            });
          }
        },
        5 * 60 * 1000,
      );
    } catch (error) {
      console.error("Error connecting with Nango:", error);

      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.details ||
        error.message ||
        t("integrations.nango.connectError");

      setMessage({
        type: "error",
        text: errorMessage,
      });
      setNangoConnecting(false);
    }
  };

  // Poista Nango-yhteys
  const handleNangoDisconnect = async (integration) => {
    if (!user?.id || saving) return;
    if (
      !confirm(
        t("integrations.nango.confirmDisconnect", { name: integration.name }),
      )
    )
      return;

    setSaving(true);
    setMessage({ type: "", text: "" });

    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      await axios.delete(
        `/api/integrations/nango/disconnect?provider=${integration.nangoIntegrationId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setMessage({
        type: "success",
        text: t("integrations.nango.disconnectSuccess", {
          name: integration.name,
        }),
      });

      // Päivitä integraatioiden tila
      setTimeout(() => {
        loadIntegrations();
      }, 1000);
    } catch (error) {
      console.error("Error disconnecting Nango:", error);
      setMessage({
        type: "error",
        text:
          error.response?.data?.error ||
          t("integrations.nango.disconnectError"),
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="settings-integrations-container">
        <div className="integrations-loading">
          <div>{t("integrations.loading")}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-integrations-container">
      {/* AI-mallin valinta */}
      <div
        className="ai-model-selector"
        style={{
          marginBottom: "24px",
          padding: "20px",
          backgroundColor: "#fff",
          borderRadius: "12px",
          border: "1px solid #e5e7eb",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
        }}
      >
        <h3
          style={{
            margin: "0 0 12px 0",
            fontSize: "16px",
            fontWeight: 600,
            color: "#1f2937",
          }}
        >
          {t("integrations.aiModel.title")}
        </h3>
        <p
          style={{
            margin: "0 0 16px 0",
            fontSize: "14px",
            color: "#6b7280",
          }}
        >
          {t("integrations.aiModel.description")}
        </p>

        {aiModelMessage && (
          <div
            style={{
              padding: "8px 12px",
              marginBottom: "16px",
              borderRadius: "6px",
              fontSize: "14px",
              backgroundColor:
                aiModelMessage.includes("Virhe") ||
                aiModelMessage.includes("Error")
                  ? "#fef2f2"
                  : "#f0fdf4",
              color:
                aiModelMessage.includes("Virhe") ||
                aiModelMessage.includes("Error")
                  ? "#dc2626"
                  : "#16a34a",
              border: `1px solid ${aiModelMessage.includes("Virhe") || aiModelMessage.includes("Error") ? "#fecaca" : "#bbf7d0"}`,
            }}
          >
            {aiModelMessage}
          </div>
        )}

        {aiModelLoading ? (
          <div style={{ color: "#6b7280", fontSize: "14px" }}>
            {t("integrations.aiModel.loading")}
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <label
              style={{
                fontSize: "14px",
                fontWeight: 500,
                color: aiModel === "gemini" ? "#1f2937" : "#9ca3af",
                cursor: "pointer",
                transition: "color 0.2s",
              }}
            >
              Gemini 3
            </label>

            {/* Liukukytkin */}
            <button
              type="button"
              onClick={() =>
                handleAiModelChange(aiModel === "gemini" ? "mistral" : "gemini")
              }
              disabled={aiModelSaving}
              style={{
                position: "relative",
                width: "52px",
                height: "28px",
                borderRadius: "14px",
                border: "none",
                cursor: aiModelSaving ? "not-allowed" : "pointer",
                backgroundColor: aiModel === "gemini" ? "#10b981" : "#6b7280",
                transition: "background-color 0.3s",
                outline: "none",
                padding: "2px",
              }}
              onMouseEnter={(e) => {
                if (!aiModelSaving) {
                  e.target.style.opacity = "0.9";
                }
              }}
              onMouseLeave={(e) => {
                e.target.style.opacity = "1";
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: "2px",
                  left: aiModel === "gemini" ? "2px" : "26px",
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  backgroundColor: "#fff",
                  transition: "left 0.3s",
                  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
                }}
              />
            </button>

            <label
              style={{
                fontSize: "14px",
                fontWeight: 500,
                color: aiModel === "mistral" ? "#1f2937" : "#9ca3af",
                cursor: "pointer",
                transition: "color 0.2s",
              }}
            >
              Mistral
            </label>
          </div>
        )}
      </div>

      <div className="integrations-description">
        <p>{t("integrations.description")}</p>
        <div style={{ marginTop: "8px" }}>
          <a
            href="https://rascalcompany.notion.site/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: "14px",
              color: "#3b82f6",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
            }}
            onMouseEnter={(e) => {
              e.target.style.textDecoration = "underline";
            }}
            onMouseLeave={(e) => {
              e.target.style.textDecoration = "none";
            }}
          >
            Katso tarkemmat ohjeet →
          </a>
        </div>
      </div>

      {message.text && (
        <div
          className={`integrations-message ${message.type === "error" ? "integrations-message-error" : "integrations-message-success"}`}
        >
          {message.text}
        </div>
      )}

      <div className="integrations-grid">
        {integrations.map((integration) => (
          <div
            key={integration.id}
            className={`integration-card ${integration.isConfigured ? "integration-card-configured" : ""} ${expandedCard === integration.id ? "integration-card-expanded" : ""}`}
          >
            {(integration.id === "wordpress" ||
              integration.id === "google_analytics" ||
              integration.id === "google_ads" ||
              integration.id === "meta_ads") && (
              <span className="beta-tag">Beta</span>
            )}
            <div
              className="integration-card-header"
              onClick={() =>
                setExpandedCard(
                  expandedCard === integration.id ? null : integration.id,
                )
              }
            >
              <div className="integration-card-title">
                <div className="integration-card-icon">
                  {typeof integration.icon === "string" ? (
                    <span>{integration.icon}</span>
                  ) : (
                    integration.icon
                  )}
                </div>
                <div>
                  <h3>{integration.name}</h3>
                  <p>{t(integration.descriptionKey)}</p>
                </div>
              </div>
              <div className="integration-card-status">
                {integration.isConfigured ? (
                  <span className="status-badge status-badge-active">
                    {t("integrations.configured")}
                  </span>
                ) : (
                  <span className="status-badge status-badge-inactive">
                    {t("integrations.notConfigured")}
                  </span>
                )}
                <span className="expand-icon">
                  {expandedCard === integration.id ? "▲" : "▼"}
                </span>
              </div>
            </div>
            {integration.id === "wordpress" &&
              integration.isConfigured &&
              expandedCard !== integration.id && (
                <div className="integration-plugin-download-row">
                  {wordpressPluginDownloaded ? (
                    <span className="plugin-downloaded-badge">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M20 6L9 17L4 12"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      {t("integrations.wordpress.pluginDownloaded")}
                    </span>
                  ) : (
                    <a
                      href="/plugins/rascal-ai.zip"
                      download="rascal-ai.zip"
                      className="integration-download-link"
                      onClick={(event) => {
                        event.stopPropagation();
                        trackPluginDownload("card-header");
                      }}
                    >
                      {t("integrations.wordpress.downloadPluginShort")}
                    </a>
                  )}
                </div>
              )}

            {expandedCard === integration.id && (
              <div className="integration-card-content">
                {integration.useNango ? (
                  // Nango-pohjainen integraatio (Google Ads, Meta Ads jne.)
                  <div>
                    {integration.isConfigured ? (
                      <div style={{ marginBottom: "20px" }}>
                        <div
                          style={{
                            padding: "12px",
                            backgroundColor: "#f0fdf4",
                            border: "1px solid #bbf7d0",
                            borderRadius: "6px",
                            color: "#16a34a",
                            fontSize: "14px",
                            marginBottom: "16px",
                          }}
                        >
                          ✅{" "}
                          {t("integrations.nango.connectedSuccess", {
                            name: integration.name,
                          })}
                        </div>
                        <p
                          style={{
                            fontSize: "14px",
                            color: "#6b7280",
                            marginBottom: "16px",
                          }}
                        >
                          {t("integrations.nango.reconnectHint")}
                        </p>
                      </div>
                    ) : (
                      <div style={{ marginBottom: "20px" }}>
                        <p
                          style={{
                            fontSize: "14px",
                            color: "#6b7280",
                            marginBottom: "16px",
                          }}
                        >
                          {t("integrations.nango.connectDescription", {
                            name: integration.name,
                          })}
                        </p>
                      </div>
                    )}
                    <div className="integration-card-actions">
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => handleNangoConnect(integration)}
                        disabled={nangoConnecting || saving}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        {nangoConnecting ? (
                          <span>{t("integrations.nango.connecting")}</span>
                        ) : integration.isConfigured ? (
                          t("integrations.nango.reconnect")
                        ) : (
                          t("integrations.nango.connect")
                        )}
                      </button>
                      {integration.isConfigured && (
                        <button
                          type="button"
                          className="btn-danger"
                          onClick={() => handleNangoDisconnect(integration)}
                          disabled={saving || nangoConnecting}
                        >
                          {t("integrations.delete")}
                        </button>
                      )}
                    </div>
                  </div>
                ) : integration.useOAuth ? (
                  // OAuth-pohjainen integraatio (Google Analytics)
                  <div>
                    {integration.isConfigured ? (
                      <div style={{ marginBottom: "20px" }}>
                        <div
                          style={{
                            padding: "12px",
                            backgroundColor: "#f0fdf4",
                            border: "1px solid #bbf7d0",
                            borderRadius: "6px",
                            color: "#16a34a",
                            fontSize: "14px",
                            marginBottom: "16px",
                          }}
                        >
                          ✅{" "}
                          {t("integrations.googleAnalytics.connectedSuccess")}
                        </div>
                        <p
                          style={{
                            fontSize: "14px",
                            color: "#6b7280",
                            marginBottom: "16px",
                          }}
                        >
                          {t("integrations.googleAnalytics.reconnectHint")}
                        </p>
                      </div>
                    ) : (
                      <div style={{ marginBottom: "20px" }}>
                        <p
                          style={{
                            fontSize: "14px",
                            color: "#6b7280",
                            marginBottom: "16px",
                          }}
                        >
                          {t("integrations.googleAnalytics.connectDescription")}
                        </p>
                      </div>
                    )}
                    <div className="integration-card-actions">
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={handleGoogleAnalyticsOAuth}
                        disabled={oauthConnecting || saving}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        {oauthConnecting ? (
                          <>
                            <span>
                              {t("integrations.googleAnalytics.connecting")}
                            </span>
                          </>
                        ) : integration.isConfigured ? (
                          t("integrations.googleAnalytics.reconnect")
                        ) : (
                          t("integrations.googleAnalytics.connect")
                        )}
                      </button>
                      {integration.isConfigured && (
                        <button
                          type="button"
                          className="btn-danger"
                          onClick={() => handleDelete(integration)}
                          disabled={saving || oauthConnecting}
                        >
                          {t("integrations.delete")}
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  // Lomake-pohjainen integraatio (WordPress jne.)
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSave(integration);
                    }}
                  >
                    {integration.fields.map((field) => (
                      <div key={field.id} className="form-field">
                        <label htmlFor={`${integration.id}-${field.id}`}>
                          {field.label}
                          {field.required && (
                            <span className="required">*</span>
                          )}
                        </label>
                        <input
                          id={`${integration.id}-${field.id}`}
                          type={field.type}
                          value={integration.formData[field.id] || ""}
                          onChange={(e) =>
                            handleFormChange(
                              integration.id,
                              field.id,
                              e.target.value,
                            )
                          }
                          placeholder={
                            field.placeholderKey
                              ? t(field.placeholderKey)
                              : field.placeholder
                          }
                          required={field.required}
                          disabled={saving}
                        />
                        {(field.helpTextKey || field.helpText) && (
                          <span className="form-field-help">
                            {field.helpTextKey
                              ? t(field.helpTextKey)
                              : field.helpText}
                          </span>
                        )}
                      </div>
                    ))}

                    {integration.isConfigured && (
                      <div className="integration-link-actions">
                        {integration.id === "wordpress" && (
                          <>
                            <button
                              type="button"
                              className="btn-link"
                              onClick={() =>
                                handleTestWordPressConnection(integration)
                              }
                              disabled={saving || testingConnection}
                            >
                              {testingConnection
                                ? t("integrations.testConnection.testing")
                                : t("integrations.testConnection.button")}
                            </button>
                            <a
                              href="/plugins/rascal-ai.zip"
                              download="rascal-ai.zip"
                              className="btn-link"
                              onClick={() =>
                                trackPluginDownload("card-content")
                              }
                            >
                              {t("integrations.wordpress.downloadPlugin")}
                            </a>
                          </>
                        )}
                        <button
                          type="button"
                          className="btn-link btn-link-danger"
                          onClick={() => handleDelete(integration)}
                          disabled={saving || testingConnection}
                        >
                          {t("integrations.deleteIntegration")}
                        </button>
                      </div>
                    )}
                    <div className="integration-card-actions">
                      <button
                        type="submit"
                        className="btn-primary"
                        disabled={saving}
                      >
                        {saving
                          ? t("ui.buttons.saving")
                          : integration.isConfigured
                            ? t("ui.buttons.update")
                            : t("ui.buttons.save")}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {integrations.length === 0 && (
        <div className="no-integrations-message">
          <p>Ei saatavilla olevia integraatioita tällä hetkellä.</p>
        </div>
      )}
    </div>
  );
}
