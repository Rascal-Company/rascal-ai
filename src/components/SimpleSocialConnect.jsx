import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../contexts/AuthContext";
import { useMixpostIntegration } from "./SocialMedia/hooks/useMixpostIntegration";

// Yksinkertainen somet-yhdistys komponentti
export default function SimpleSocialConnect() {
  const { t } = useTranslation("common");
  const { organization } = useAuth();
  const {
    connectSocialAccount,
    socialAccounts,
    savedSocialAccounts,
    fetchSavedSocialAccounts,
  } = useMixpostIntegration();
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState("");

  // Member-rooli näkee sometilit mutta ei voi yhdistää uusia
  const canConnect = organization?.role !== "member";

  // Käytä Mixpostista haettuja tilejä oletuksena, mutta näytä myös tallennetut tilit
  const connectedAccounts =
    socialAccounts.length > 0 ? socialAccounts : savedSocialAccounts;

  // Hook hakee tilit automaattisesti kun orgId on saatavilla
  // Ei tarvitse kutsua fetchSavedSocialAccounts erikseen

  // Apufunktio profiilikuvan URL:n luomiseen
  const getProfileImageUrl = (account) => {
    // Jos tilillä on suora profile_image_url, käytä sitä
    if (account.profile_image_url) {
      return account.profile_image_url;
    }

    // Jos tilillä on image-kenttä, käytä sitä
    if (account.image) {
      return account.image;
    }

    // Jos tilillä on picture-kenttä, käytä sitä
    if (account.picture) {
      return account.picture;
    }

    return null;
  };

  const handleConnectSocial = async () => {
    try {
      setConnecting(true);
      setError("");

      // Avaa mixpost.mak8r.fi modaalissa
      const mixpostUrl = "https://mixpost.mak8r.fi";
      const popup = window.open(
        mixpostUrl,
        "mixpost_oauth",
        "width=800,height=600,menubar=no,toolbar=no,location=yes,status=no,scrollbars=yes,resizable=yes",
      );

      if (!popup) {
        throw new Error("Popup estetty. Salli popup-ikkunat tälle sivustolle.");
      }

      // Odota että popup suljetaan
      await pollPopup(popup);

      // Päivitä tilit kun popup suljetaan
      await fetchSavedSocialAccounts();
    } catch (err) {
      console.error("Virhe somet-yhdistämisessä:", err);
      setError(err.message);
    } finally {
      setConnecting(false);
    }
  };

  // Pollaa popup-ikkunaa kunnes se suljetaan
  const pollPopup = (popup) => {
    return new Promise((resolve, reject) => {
      let elapsed = 0;
      const intervalMs = 1000;
      const maxWaitMs = 10 * 60 * 1000; // 10 minuuttia
      const timer = setInterval(() => {
        try {
          if (popup.closed) {
            clearInterval(timer);
            console.log("Mixpost popup suljettu, päivitetään tilejä...");
            return resolve();
          }
          elapsed += intervalMs;
          if (elapsed >= maxWaitMs) {
            clearInterval(timer);
            if (!popup.closed) popup.close();
            return reject(
              new Error(
                "Mixpost-yhdistys aikakatkaistiin 10 minuutin jälkeen.",
              ),
            );
          }
        } catch (_) {
          // cross-origin; jatka pollingia
        }
      }, intervalMs);
    });
  };

  return (
    <div>
      <h2
        style={{
          margin: "0 0 16px 0",
          fontSize: 16,
          fontWeight: 600,
          color: "#1f2937",
        }}
      >
        {t("settings.social.title")}
      </h2>

      {/* Yhdistetyt tilit */}
      {connectedAccounts.length > 0 && (
        <div style={{ marginBottom: "16px" }}>
          <h3
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "#374151",
              margin: "0 0 8px 0",
            }}
          >
            {t("settings.social.connectedAccounts")} ({connectedAccounts.length}
            )
          </h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
            {connectedAccounts.map((account, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 12px",
                  backgroundColor: "#f3f4f6",
                  borderRadius: "20px",
                  fontSize: "12px",
                  color: "#374151",
                  border: "1px solid #e5e7eb",
                }}
              >
                {/* Profiilikuva */}
                <div
                  style={{
                    position: "relative",
                    width: "24px",
                    height: "24px",
                    borderRadius: "50%",
                    overflow: "hidden",
                    backgroundColor: "#d1d5db",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {getProfileImageUrl(account) ? (
                    <img
                      src={getProfileImageUrl(account)}
                      alt={account.name || account.username}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                      onError={(e) => {
                        e.target.style.display = "none";
                        e.target.nextSibling.style.display = "flex";
                      }}
                    />
                  ) : null}
                  <div
                    style={{
                      display: getProfileImageUrl(account) ? "none" : "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "100%",
                      height: "100%",
                      fontSize: "10px",
                      fontWeight: "600",
                      color: "#6b7280",
                    }}
                  >
                    {(account.name || account.username || "?")
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                  {/* Platform-ikoni profiilikuvan alaosassa */}
                  <div
                    style={{
                      position: "absolute",
                      bottom: "-3px",
                      right: "-3px",
                      width: "16px",
                      height: "16px",
                      borderRadius: "50%",
                      backgroundColor: "#ffffff",
                      border: "2px solid #e5e7eb",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "10px",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    }}
                  >
                    {account.provider === "instagram" ? (
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#E4405F"
                        strokeWidth="2"
                      >
                        <rect
                          x="2"
                          y="2"
                          width="20"
                          height="20"
                          rx="5"
                          ry="5"
                        />
                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                      </svg>
                    ) : account.provider === "facebook" ? (
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="#1877F2"
                      >
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                    ) : (
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#0077B5"
                        strokeWidth="2"
                      >
                        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                        <rect x="2" y="9" width="4" height="12" />
                        <circle cx="4" cy="4" r="2" />
                      </svg>
                    )}
                  </div>
                </div>

                {/* Tilin tiedot */}
                <div>
                  <div style={{ fontWeight: "600", lineHeight: "1.2" }}>
                    {account.name || account.username}
                  </div>
                  <div style={{ fontSize: "10px", color: "#6b7280" }}>
                    @{account.username}
                  </div>
                  {/* Provider-nimi */}
                  <div
                    style={{
                      fontSize: "9px",
                      color: "#9ca3af",
                      textTransform: "capitalize",
                      marginTop: "2px",
                    }}
                  >
                    {account.provider === "instagram"
                      ? "Instagram"
                      : account.provider === "facebook"
                        ? "Facebook"
                        : account.provider === "linkedin"
                          ? "LinkedIn"
                          : account.provider}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Yhdistä nappi - vain owner/admin */}
      {canConnect ? (
        <button
          onClick={handleConnectSocial}
          disabled={connecting}
          className={`${styles.btn} ${styles.btnPrimary}`}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            fontSize: "14px",
            fontWeight: "600",
          }}
        >
          {connecting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              {t("settings.social.connecting")}
            </>
          ) : (
            <>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
              {t("settings.social.connectButton")}
            </>
          )}
        </button>
      ) : (
        <div
          style={{
            padding: "12px",
            backgroundColor: "#f0f9ff",
            border: "1px solid #bae6fd",
            borderRadius: "8px",
            fontSize: "13px",
            color: "#0369a1",
            textAlign: "center",
          }}
        >
          {t("settings.social.memberRestriction")}
        </div>
      )}

      {/* Virheviesti */}
      {error && (
        <div
          style={{
            marginTop: "8px",
            padding: "8px 12px",
            backgroundColor: "#fef2f2",
            color: "#dc2626",
            borderRadius: "6px",
            fontSize: "12px",
            border: "1px solid #fecaca",
          }}
        >
          {error}
        </div>
      )}

      {/* Ohjeteksti */}
      <div
        style={{
          marginTop: "12px",
          fontSize: "11px",
          color: "#6b7280",
          lineHeight: "1.4",
        }}
      >
        <p>
          <strong>{t("settings.social.howItWorks")}</strong>
        </p>
        <p style={{ margin: "4px 0" }}>
          <a
            href="https://rascalcompany.notion.site/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "#2563eb",
              textDecoration: "underline",
              cursor: "pointer",
            }}
          >
            {t("settings.social.instructionsLink")}
          </a>
        </p>
      </div>
    </div>
  );
}
