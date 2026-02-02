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
      <h2 className="m-0 mb-4 text-base font-semibold text-gray-800">
        {t("settings.social.title")}
      </h2>

      {/* Yhdistetyt tilit */}
      {connectedAccounts.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-700 m-0 mb-2">
            {t("settings.social.connectedAccounts")} ({connectedAccounts.length}
            )
          </h3>
          <div className="flex flex-wrap gap-3">
            {connectedAccounts.map((account, index) => (
              <div
                key={index}
                className="flex items-center gap-2 py-2 px-3 bg-gray-100 rounded-[20px] text-xs text-gray-700 border border-gray-200"
              >
                {/* Profiilikuva */}
                <div className="relative w-6 h-6 rounded-full overflow-hidden bg-gray-300 flex items-center justify-center">
                  {getProfileImageUrl(account) ? (
                    <img
                      src={getProfileImageUrl(account)}
                      alt={account.name || account.username}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = "none";
                        e.target.nextSibling.style.display = "flex";
                      }}
                    />
                  ) : null}
                  <div
                    className={`${getProfileImageUrl(account) ? "hidden" : "flex"} items-center justify-center w-full h-full text-[10px] font-semibold text-gray-500`}
                  >
                    {(account.name || account.username || "?")
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                  {/* Platform-ikoni profiilikuvan alaosassa */}
                  <div className="absolute -bottom-[3px] -right-[3px] w-4 h-4 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center text-[10px] shadow-sm">
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
                  <div className="font-semibold leading-tight">
                    {account.name || account.username}
                  </div>
                  <div className="text-[10px] text-gray-500">
                    @{account.username}
                  </div>
                  {/* Provider-nimi */}
                  <div className="text-[9px] text-gray-400 capitalize mt-0.5">
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
          className="btn btn-primary w-full flex items-center justify-center gap-2 text-sm font-semibold"
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
        <div className="p-3 bg-sky-50 border border-sky-200 rounded-lg text-[13px] text-sky-700 text-center">
          {t("settings.social.memberRestriction")}
        </div>
      )}

      {/* Virheviesti */}
      {error && (
        <div className="mt-2 py-2 px-3 bg-red-50 text-red-600 rounded-md text-xs border border-red-200">
          {error}
        </div>
      )}

      {/* Ohjeteksti */}
      <div className="mt-3 text-[11px] text-gray-500 leading-snug">
        <p>
          <strong>{t("settings.social.howItWorks")}</strong>
        </p>
        <p className="my-1">
          <a
            href="https://rascalcompany.notion.site/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline cursor-pointer"
          >
            {t("settings.social.instructionsLink")}
          </a>
        </p>
      </div>
    </div>
  );
}
