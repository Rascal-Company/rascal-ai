import React, { useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";

export function ChatMessages({ messages, loading }) {
  const { t } = useTranslation("common");
  const messagesEndRef = useRef(null);

  // Debug log
  console.log("[ChatMessages] Rendering with messages:", messages.length);
  console.log("[ChatMessages] Loading:", loading);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  return (
    <div className="flex-1 overflow-y-auto scroll-smooth">
      <div className="max-w-[800px] mx-auto py-8 px-6 flex flex-col gap-6">
        {messages.length === 0 ? (
          <WelcomeScreen />
        ) : (
          <>
            {messages.map((message, index) => {
              console.log(
                `[ChatMessages] Rendering message ${index}:`,
                message.role,
                message.content?.substring(0, 50),
              );
              return (
                <MessageBubble
                  key={`${message.role}-${index}-${message.content?.substring(0, 50)}`}
                  message={message}
                />
              );
            })}
            {loading && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
    </div>
  );
}

function WelcomeScreen() {
  const { t } = useTranslation("common");

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center gap-4">
      <div className="text-7xl mb-2 font-bold bg-gradient-to-br from-primary-500 to-primary-600 bg-clip-text text-transparent">
        AI
      </div>
      <h2 className="text-[28px] font-bold m-0 text-gray-800">
        {t("assistant.welcome.title")}
      </h2>
      <p className="text-base text-gray-500 m-0">
        {t("assistant.welcome.description")}
      </p>
    </div>
  );
}

function MessageBubble({ message }) {
  const { t } = useTranslation("common");
  const isUser = message.role === "user";
  const isProcessing = message.isProcessing;

  return (
    <div
      className={`flex gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300 ${
        isUser ? "flex-row-reverse" : ""
      }`}
    >
      {/* Avatar */}
      <div
        className={`w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
          isUser ? "text-white bg-primary-500" : "text-gray-500 bg-gray-100"
        }`}
      >
        {isUser ? t("assistant.labels.me") : t("assistant.labels.ai")}
      </div>

      {/* Content */}
      <div
        className={`flex-1 py-3 px-4 rounded-2xl leading-relaxed ${
          isUser
            ? "text-white bg-primary-500 rounded-br-sm"
            : isProcessing
              ? "text-gray-500 italic bg-gray-100"
              : "text-gray-700 bg-gray-50 rounded-bl-sm"
        }`}
      >
        {isProcessing ? (
          <div className="flex items-center gap-2">
            <TypingDots />
            <span>{message.content}</span>
          </div>
        ) : isUser ? (
          <p className="m-0">{message.content}</p>
        ) : (
          <div className="prose prose-sm prose-gray max-w-none [&_p]:m-0 [&_p+p]:mt-3 [&_h1]:my-4 [&_h1]:mb-2 [&_h1]:text-2xl [&_h2]:my-4 [&_h2]:mb-2 [&_h2]:text-xl [&_h3]:my-4 [&_h3]:mb-2 [&_h3]:text-lg [&_ul]:my-2 [&_ul]:pl-6 [&_ol]:my-2 [&_ol]:pl-6 [&_li]:my-1 [&_code]:py-0.5 [&_code]:px-1.5 [&_code]:rounded [&_code]:bg-black/5 [&_code]:text-[0.9em] [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:my-3 [&_pre]:bg-gray-800 [&_pre]:text-gray-50 [&_pre_code]:bg-transparent [&_pre_code]:p-0">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}

function TypingIndicator() {
  const { t } = useTranslation("common");

  return (
    <div className="flex gap-4">
      <div className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 text-gray-500 bg-gray-100">
        AI
      </div>
      <div className="flex-1 py-3 px-4 rounded-2xl rounded-bl-sm bg-gray-50">
        <TypingDots />
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex gap-1 py-1">
      <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:0ms]" />
      <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:150ms]" />
      <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:300ms]" />
    </div>
  );
}
