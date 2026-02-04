import { useContext } from "react";
import { AutoLogoutContext } from "../contexts/AutoLogoutContext";

/**
 * Custom hook auto-logout -ominaisuuksien hallintaan
 *
 * @returns {Object} Auto-logout context arvot ja metodit
 * @example
 * const {
 *   showWarning,
 *   countdown,
 *   extendSession,
 *   setActivityState
 * } = useAutoLogout()
 */
export const useAutoLogout = () => {
  const context = useContext(AutoLogoutContext);

  if (!context) {
    throw new Error("useAutoLogout must be used within an AutoLogoutProvider");
  }

  return context;
};

/**
 * Hook aktiviteetin tunnistamiseen komponentissa
 *
 * @param {boolean} enabled - Onko aktiviteetin tunnistus käytössä
 * @returns {Object} Aktiviteetin hallinta
 * @example
 * const { isActive, setActivityState } = useActivityDetection(true)
 */
export const useActivityDetection = (enabled = true) => {
  const { isActive, setActivityState } = useAutoLogout();

  return {
    isActive,
    setActivityState: enabled ? setActivityState : () => {},
  };
};

/**
 * Hook timeout-asetusten hallintaan
 *
 * @returns {Object} Timeout-asetusten hallinta
 * @example
 * const { currentTimeout, showTimeoutInfo } = useTimeoutSettings()
 */
export const useTimeoutSettings = () => {
  const { currentTimeout } = useAutoLogout();

  const showTimeoutInfo = () => {
    // Tämä voidaan laajentaa näyttämään timeout-tietoja käyttäjälle
    console.log(`Current timeout: ${currentTimeout} minutes`);
  };

  return {
    currentTimeout,
    showTimeoutInfo,
  };
};
