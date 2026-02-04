/**
 * Keyboard Shortcuts Hook
 * Provides keyboard shortcut functionality for common actions
 *
 * @example
 * useKeyboardShortcuts({
 *   'cmd+k': () => focusSearch(),
 *   'cmd+n': () => openNewModal(),
 *   'esc': () => closeModal(),
 * });
 */

import { useEffect } from "react";

/**
 * Check if modifier key matches
 * @param {KeyboardEvent} event
 * @param {string} modifier - 'cmd', 'ctrl', 'shift', 'alt'
 */
const hasModifier = (event, modifier) => {
  switch (modifier) {
    case "cmd":
    case "meta":
      return event.metaKey;
    case "ctrl":
      return event.ctrlKey;
    case "shift":
      return event.shiftKey;
    case "alt":
      return event.altKey;
    default:
      return false;
  }
};

/**
 * Parse shortcut string into parts
 * @param {string} shortcut - e.g., 'cmd+k', 'ctrl+shift+n'
 * @returns {{ modifiers: string[], key: string }}
 */
const parseShortcut = (shortcut) => {
  const parts = shortcut.toLowerCase().split("+");
  const key = parts[parts.length - 1];
  const modifiers = parts.slice(0, -1);
  return { modifiers, key };
};

/**
 * Check if keyboard event matches shortcut
 * @param {KeyboardEvent} event
 * @param {string} shortcut
 */
const matchesShortcut = (event, shortcut) => {
  const { modifiers, key } = parseShortcut(shortcut);

  // Check if key matches
  const eventKey = event.key.toLowerCase();
  if (eventKey !== key && event.code.toLowerCase() !== key.toLowerCase()) {
    return false;
  }

  // Check if all modifiers match
  const hasCmd = modifiers.includes("cmd") || modifiers.includes("meta");
  const hasCtrl = modifiers.includes("ctrl");
  const hasShift = modifiers.includes("shift");
  const hasAlt = modifiers.includes("alt");

  return (
    (hasCmd ? event.metaKey : !event.metaKey) &&
    (hasCtrl ? event.ctrlKey : !event.ctrlKey) &&
    (hasShift ? event.shiftKey : !event.shiftKey) &&
    (hasAlt ? event.altKey : !event.altKey)
  );
};

/**
 * Hook for keyboard shortcuts
 * @param {Object<string, Function>} shortcuts - Map of shortcuts to handlers
 * @param {boolean} enabled - Whether shortcuts are enabled (default: true)
 */
export const useKeyboardShortcuts = (shortcuts, enabled = true) => {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event) => {
      // Don't trigger shortcuts when typing in inputs
      const target = event.target;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      // Allow ESC to work even in inputs
      if (isInput && event.key !== "Escape") {
        return;
      }

      // Check each shortcut
      for (const [shortcut, handler] of Object.entries(shortcuts)) {
        if (matchesShortcut(event, shortcut)) {
          event.preventDefault();
          handler(event);
          break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts, enabled]);
};

/**
 * Format shortcut for display (e.g., "Cmd+K")
 * @param {string} shortcut
 * @returns {string}
 */
export const formatShortcut = (shortcut) => {
  const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;

  return shortcut
    .split("+")
    .map((part) => {
      part = part.toLowerCase();
      if (part === "cmd" || part === "meta") return isMac ? "⌘" : "Ctrl";
      if (part === "ctrl") return "Ctrl";
      if (part === "shift") return "⇧";
      if (part === "alt") return isMac ? "⌥" : "Alt";
      return part.toUpperCase();
    })
    .join(isMac ? "" : "+");
};
