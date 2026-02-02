import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { supabase } from "../lib/supabase";
import { useConversation } from "@elevenlabs/react";
import { useOnboardingStatus } from "../hooks/queries";
import axios from "axios";
import VoiceOrb from "./VoiceOrb";

const OnboardingModal = () => {
  const { user } = useAuth();
  const toast = useToast();
  const location = useLocation();

  // Cached onboarding status from TanStack Query
  const {
    shouldShow: hookShouldShow,
    role,
    isLoading: statusLoading,
    refetch: refetchStatus,
  } = useOnboardingStatus(user?.id);

  const [shouldShow, setShouldShow] = useState(false);
  const [loading, setLoading] = useState(true);
  const [conversationId, setConversationId] = useState(null);
  const conversationIdRef = useRef(null);
  const [isMinimized, setIsMinimized] = useState(false);

  // ElevenLabs conversation hook
  const conversation = useConversation({
    onConnect: ({ conversationId }) => {
      console.log(
        "✅ ElevenLabs connected with conversationId:",
        conversationId,
      );
      setConversationId(conversationId);
      conversationIdRef.current = conversationId;
    },
    clientTools: {
      saveICPData: async (parameters) => {
        if (!user?.id) return "Error: No user logged in";

        try {
          // Rakenna ICP data + metadata
          const icpData = {
            ...parameters,
            conversation_id: conversationIdRef.current,
            completed_at: new Date().toISOString(),
          };

          // Hae käyttäjän session token Supabasesta
          const {
            data: { session },
          } = await supabase.auth.getSession();
          const headers = {
            "Content-Type": "application/json",
          };

          // Lisää Authorization header jos session token on saatavilla
          if (session?.access_token) {
            headers["Authorization"] = `Bearer ${session.access_token}`;
          }

          // Lähetä webhook N8N:ään (N8N hoitaa Supabase-päivityksen)
          const webhookResponse = await fetch(
            "/api/organization/onboarding-completed",
            {
              method: "POST",
              headers: headers,
              body: JSON.stringify({
                conversationId: conversationIdRef.current,
                userId: user.id,
                icpData: icpData,
              }),
            },
          );

          if (!webhookResponse.ok) {
            const errorText = await webhookResponse.text();
            console.error("❌ Webhook failed:", errorText);
            throw new Error("Failed to send webhook to N8N");
          }

          console.log(
            "✅ Webhook sent successfully - N8N will update onboarding_completed and icp_summary",
          );

          // Invalidate cached onboarding status
          refetchStatus();

          // Sulje modaali
          setShouldShow(false);

          return "ICP data saved successfully!";
        } catch (error) {
          console.error("❌ Error saving ICP data:", error);
          return "Error saving ICP data";
        }
      },
    },
  });

  // Tyhjennä localStorage kun käyttäjä kirjautuu ulos
  useEffect(() => {
    if (!user?.id) {
      // Käyttäjä ei ole kirjautunut sisään - tyhjennä localStorage ja piilota modaali
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("onboarding_skipped_")) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key));

      setIsMinimized(false);
      setShouldShow(false);
      setLoading(false);
    }
  }, [user]);

  // Tarkista pitääkö modaali näyttää (cached from TanStack Query)
  useEffect(() => {
    // Jos käyttäjä ei ole kirjautunut sisään, älä näytä modaalia
    if (!user?.id) {
      setShouldShow(false);
      setIsMinimized(false);
      setLoading(false);
      return;
    }

    // Estä näyttö tietyillä julkisilla/kriittisillä reiteillä
    const BLOCKED_ROUTES = [
      "/signin",
      "/signup",
      "/reset-password",
      "/forgot-password",
      "/auth/callback",
      "/terms",
      "/privacy",
      "/settings",
    ];

    const isBlocked = BLOCKED_ROUTES.some((path) =>
      location.pathname.includes(path),
    );
    if (isBlocked) {
      setShouldShow(false);
      setLoading(false);
      return;
    }

    // Wait for hook to finish loading
    if (statusLoading) {
      return;
    }

    // Tarkista onko modal minimoitu localStorageen
    const skipped = localStorage.getItem(`onboarding_skipped_${user.id}`);
    if (skipped === "true") {
      setIsMinimized(true);
      setShouldShow(false);
      setLoading(false);
      return;
    }

    // Use cached status from hook
    setShouldShow(hookShouldShow);
    setLoading(false);
  }, [user, location.pathname, statusLoading, hookShouldShow]);

  const handleStartConversation = async () => {
    try {
      // Hae Agent ID API:sta
      const response = await fetch("/api/integrations/elevenlabs/config");

      if (!response.ok) {
        throw new Error("Failed to fetch ElevenLabs configuration");
      }

      const config = await response.json();

      if (!config.agentId) {
        console.error("❌ Agent ID not found in API response");
        toast.error(t("errors.agentIdMissing"));
        return;
      }

      // Aloita keskustelu
      const convId = await conversation.startSession({
        agentId: config.agentId,
        connectionType: "websocket",
      });

      setConversationId(convId);
      conversationIdRef.current = convId;

      // Tallenna conversation ID Supabaseen (optionaalinen)
      if (user?.id && convId) {
        try {
          await supabase
            .from("users")
            .update({
              last_conversation_id: convId,
              updated_at: new Date().toISOString(),
            })
            .eq("auth_user_id", user.id);
        } catch (error) {
          console.error("⚠️ Failed to save conversation ID:", error);
        }
      }
    } catch (error) {
      console.error("❌ Error starting conversation:", error);
      toast.error(t("errors.chatStartFailed", { error: error.message }));
    }
  };

  const handleEndConversation = async () => {
    // Määritellään requestBody ulommalla tasolla jotta se on näkyvissä kaikissa catch-lohkoissa
    let requestBody = null;

    try {
      console.log("🛑 Ending conversation...", {
        conversationId: conversationId,
        userId: user?.id,
        conversationStatus: conversation.status,
      });

      // Lähetä webhook jos keskustelu keskeytetään manuaalisesti
      // Käytä conversationIdRef.current jos conversationId state on null
      const currentConversationId = conversationId || conversationIdRef.current;

      if (!currentConversationId) {
        console.warn("⚠️ Cannot send end webhook: conversationId is missing", {
          conversationId: conversationId,
          conversationIdRef: conversationIdRef.current,
          conversationStatus: conversation.status,
        });
      } else if (!user?.id) {
        console.warn("⚠️ Cannot send end webhook: userId is missing");
      } else {
        requestBody = {
          conversationId: currentConversationId,
          userId: user.id,
          icpData: null, // Ei ICP dataa, keskustelu keskeytettiin
        };

        try {
          console.log("📤 Sending end conversation webhook:", {
            conversationId: currentConversationId,
            userId: user.id,
            conversationIdFromState: conversationId,
            conversationIdFromRef: conversationIdRef.current,
          });

          console.log("📤 Request body:", JSON.stringify(requestBody, null, 2));

          // Hae käyttäjän session token Supabasesta
          const {
            data: { session },
          } = await supabase.auth.getSession();
          const headers = {
            "Content-Type": "application/json",
          };

          // Lisää Authorization header jos session token on saatavilla
          if (session?.access_token) {
            headers["Authorization"] = `Bearer ${session.access_token}`;
            console.log("🔑 Adding Authorization header to request");
          } else {
            console.warn(
              "⚠️ No session token available, request may fail due to RLS",
            );
          }

          const response = await axios.post(
            "/api/organization/onboarding-completed",
            requestBody,
            {
              headers: headers,
            },
          );

          console.log("✅ End conversation webhook sent:", response.data);
        } catch (error) {
          if (error.response) {
            // Server responded with error status
            console.error("❌ Failed to send end webhook:", {
              status: error.response.status,
              statusText: error.response.statusText,
              error: error.response.data,
              requestBody: requestBody,
            });
          } else if (error.request) {
            // Request was made but no response received
            console.error(
              "❌ Failed to send end webhook: No response received",
              {
                message: error.message,
                requestBody: requestBody,
              },
            );
          } else {
            // Error in request setup
            console.error("❌ Error sending end webhook:", error.message);
          }
        }
      }

      // Lopeta keskustelu
      try {
        await conversation.endSession();
        console.log("✅ Conversation ended");
      } catch (error) {
        console.error("❌ Error ending conversation:", error);
      }

      // Tyhjennä conversation ID:t
      setConversationId(null);
      conversationIdRef.current = null;

      // Sulje modaali
      setShouldShow(false);
    } catch (error) {
      console.error("❌ Error in handleEndConversation:", {
        error: error.message,
        stack: error.stack,
        requestBody: requestBody,
      });
      // Sulje modaali vaikka virhe tapahtui
      setShouldShow(false);
    }
  };

  const handleSkip = () => {
    // Minimoi modaali ja tallenna localStorageen
    if (user?.id) {
      localStorage.setItem(`onboarding_skipped_${user.id}`, "true");
    }
    setIsMinimized(true);
  };

  const handleRestore = () => {
    // Palauta modaali normaalikokoon
    setIsMinimized(false);
    setShouldShow(true); // Näytä modal normaalisti
    if (user?.id) {
      localStorage.removeItem(`onboarding_skipped_${user.id}`);
    }
  };

  // Jos minimoitu, näytä vain pieni nappi (vain jos käyttäjä on kirjautunut sisään)
  if (isMinimized && user?.id) {
    return (
      <div
        className="fixed bottom-4 right-4 z-[9999] bg-primary-500 text-white px-4 py-3 rounded-xl shadow-lg cursor-pointer hover:bg-primary-600 transition-all duration-200 hover:scale-105"
        onClick={handleRestore}
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">ICP-haastattelu</span>
          <button
            className="py-1 px-3 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-medium transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              handleRestore();
            }}
          >
            Palauta
          </button>
        </div>
      </div>
    );
  }

  // Älä näytä jos lataa, ei pitäisi näkyä, tai käyttäjä ei ole kirjautunut sisään
  if (loading || !shouldShow || !user?.id) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl border border-gray-200">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-primary-500 to-primary-600 text-white text-center">
          <h2 className="text-2xl font-bold mb-2">Tervetuloa!</h2>
          <p className="text-sm text-white/90">
            Aloitetaan luomalla yrityksellesi täydellinen ICP (Ideal Customer
            Profile)
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {conversation.status === "disconnected" ? (
            <>
              <div className="flex flex-col items-center text-center py-6">
                <div className="text-primary-500 mb-4">
                  <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <circle
                      cx="60"
                      cy="60"
                      r="35"
                      fill="currentColor"
                      opacity="0.1"
                    />
                    <path
                      d="M60 40 L60 80 M40 60 L80 60"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Aloita ICP-haastattelu
                </h3>
                <p className="text-sm text-gray-500 max-w-sm">
                  Keskustele AI-assistentin kanssa ja luo yrityksellesi ICP
                  muutamassa minuutissa.
                </p>
              </div>

              <button
                className="w-full py-3 px-6 bg-primary-500 text-white rounded-xl text-base font-semibold hover:bg-primary-600 transition-colors shadow-md hover:shadow-lg"
                onClick={handleStartConversation}
              >
                Aloita haastattelu
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-6 py-4">
              <VoiceOrb conversation={conversation} />

              <button
                className="py-2.5 px-5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                onClick={handleEndConversation}
              >
                Lopeta keskustelu
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 text-center">
          <button
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors font-medium"
            onClick={handleSkip}
          >
            Ohita toistaiseksi
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingModal;
