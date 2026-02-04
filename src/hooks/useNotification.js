/**
 * Yhtenäinen notification handling
 * Korvaa errorMessage/successMessage state + console.error sekamelska
 * Käyttää ToastContext:ia pohjana
 */

import { useCallback } from "react";
import { useToast } from "../contexts/ToastContext";

/**
 * Notification hook
 * @returns {{
 *   success: (message: string) => void,
 *   error: (message: string) => void,
 *   info: (message: string) => void,
 *   warning: (message: string) => void
 * }}
 */
export const useNotification = () => {
  const toast = useToast();

  const success = useCallback(
    (message) => {
      toast.success(message);
    },
    [toast],
  );

  const error = useCallback(
    (message) => {
      toast.error(message);
      // Log myös consoleen debuggausta varten
      console.error(`[Error] ${message}`);
    },
    [toast],
  );

  const info = useCallback(
    (message) => {
      // ToastContext ei välttämättä tue info-tasoa, käytetään success
      toast.success(message);
    },
    [toast],
  );

  const warning = useCallback(
    (message) => {
      // ToastContext ei välttämättä tue warning-tasoa, käytetään error
      toast.error(message);
      console.warn(`[Warning] ${message}`);
    },
    [toast],
  );

  return {
    success,
    error,
    info,
    warning,
  };
};
