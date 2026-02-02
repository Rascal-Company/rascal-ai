import React, { useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";

export function ChatInput({
  input,
  onInputChange,
  onSend,
  onNewChat,
  loading,
}) {
  const { t } = useTranslation("common");
  const textareaRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        textareaRef.current.scrollHeight + "px";
    }
  }, [input]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      onSend();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!loading && input.trim()) {
      onSend();
    }
  };

  return (
    <div className="py-5 px-6 bg-white border-t border-gray-200">
      <form
        onSubmit={handleSubmit}
        className="max-w-[800px] mx-auto flex gap-3 items-end"
      >
        {/* New Chat Button */}
        <button
          type="button"
          onClick={onNewChat}
          className="w-12 h-12 rounded-xl flex items-center justify-center cursor-pointer shrink-0 text-2xl font-normal transition-all duration-300 border border-primary-500/30 bg-gradient-to-br from-primary-500/10 to-primary-600/10 text-primary-500 shadow-lg shadow-primary-500/20 hover:-translate-y-0.5 hover:from-primary-500/20 hover:to-primary-600/20 hover:shadow-xl hover:shadow-primary-500/30"
          title={t("chat.buttons.newChat")}
        >
          +
        </button>

        {/* Text Input */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t("assistant.inputPlaceholder")}
          disabled={loading}
          rows={1}
          className="flex-1 py-3.5 px-[1.125rem] rounded-3xl text-[15px] resize-none outline-none bg-white overflow-y-auto leading-normal min-h-12 max-h-[200px] transition-all duration-200 border-2 border-gray-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 disabled:cursor-not-allowed disabled:bg-gray-50"
        />

        {/* Send Button */}
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="w-12 h-12 rounded-xl text-white flex items-center justify-center cursor-pointer shrink-0 text-2xl font-normal transition-all duration-300 border border-primary-500/30 bg-gradient-to-br from-primary-500 to-primary-600 shadow-lg shadow-primary-500/30 hover:enabled:-translate-y-0.5 hover:enabled:shadow-xl hover:enabled:shadow-primary-500/40 disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gradient-to-br disabled:from-gray-400 disabled:to-gray-500 disabled:border-gray-600 disabled:shadow-none"
          title={t("assistant.send")}
        >
          {loading ? "..." : "→"}
        </button>
      </form>
      <p className="max-w-[800px] mx-auto mt-2 text-center text-xs text-gray-400">
        {t("assistant.hints.enterToSend")}
      </p>
    </div>
  );
}
