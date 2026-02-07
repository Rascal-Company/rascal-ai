import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { supabase } from "../lib/supabase";
import { getUserOrgId } from "../lib/getUserOrgId";
import { X, CheckCircle2 } from "lucide-react";

const SNOOZE_DAYS = 3;
const SURVEY_INTERVAL_DAYS = 30;

const getCategory = (score) => {
  if (score >= 9) return "promoter";
  if (score >= 7) return "passive";
  return "detractor";
};

const getFeedbackPrompt = (score) => {
  if (score <= 6) {
    return "Pahoittelut! Mikä on suurin syy tyytymättömyyteen?";
  }
  return "Mitä voisimme tehdä paremmin ansaitaksemme kympin?";
};

const MonthlyNpsModal = () => {
  const { user, organization } = useAuth();
  const toast = useToast();

  const [isVisible, setIsVisible] = useState(false);
  const [step, setStep] = useState("rating"); // 'rating' | 'feedback' | 'thankyou'
  const [selectedScore, setSelectedScore] = useState(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orgUserId, setOrgUserId] = useState(null);

  // Get organization user ID
  useEffect(() => {
    if (!user?.id) return;

    const fetchOrgUserId = async () => {
      let userId = null;
      if (organization?.id) {
        userId = organization.id;
      } else {
        userId = await getUserOrgId(user.id);
      }
      setOrgUserId(userId);
    };

    fetchOrgUserId();
  }, [user?.id, organization?.id]);

  // Check if we should show the modal
  useEffect(() => {
    if (!user?.id || !orgUserId) return;

    const checkShouldShow = async () => {
      // Check localStorage for snooze
      const snoozeKey = `nps_snooze_${user.id}`;
      const snoozeUntil = localStorage.getItem(snoozeKey);

      if (snoozeUntil) {
        const snoozeDate = new Date(snoozeUntil);
        if (snoozeDate > new Date()) {
          // Still snoozed
          return;
        }
        // Snooze expired, remove it
        localStorage.removeItem(snoozeKey);
      }

      // Query latest NPS response
      try {
        const { data, error } = await supabase
          .from("nps_responses")
          .select("created_at")
          .eq("user_id", orgUserId)
          .order("created_at", { ascending: false })
          .limit(1);

        if (error) {
          console.error("Error fetching NPS responses:", error);
          return;
        }

        // If no previous response, show modal
        if (!data || data.length === 0) {
          setIsVisible(true);
          return;
        }

        // Check if last response was > 30 days ago
        const lastResponseDate = new Date(data[0].created_at);
        const daysSinceLastResponse = Math.floor(
          (new Date() - lastResponseDate) / (1000 * 60 * 60 * 24),
        );

        if (daysSinceLastResponse >= SURVEY_INTERVAL_DAYS) {
          setIsVisible(true);
        }
      } catch (err) {
        console.error("Error checking NPS status:", err);
      }
    };

    checkShouldShow();
  }, [user?.id, orgUserId]);

  const handleSnooze = () => {
    if (!user?.id) return;

    const snoozeKey = `nps_snooze_${user.id}`;
    const snoozeUntil = new Date();
    snoozeUntil.setDate(snoozeUntil.getDate() + SNOOZE_DAYS);
    localStorage.setItem(snoozeKey, snoozeUntil.toISOString());

    setIsVisible(false);
  };

  const saveResponse = async (score, feedback = null) => {
    if (!orgUserId) return;

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("nps_responses").insert({
        user_id: orgUserId,
        score: score,
        feedback: feedback,
        category: getCategory(score),
      });

      if (error) {
        console.error("Error saving NPS response:", error);
        toast.error("Virhe tallennettaessa vastausta");
        return false;
      }

      return true;
    } catch (err) {
      console.error("Error saving NPS response:", err);
      toast.error("Virhe tallennettaessa vastausta");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleScoreClick = async (score) => {
    setSelectedScore(score);

    // If promoter (9-10), save immediately and show thank you
    if (score >= 9) {
      const success = await saveResponse(score);
      if (success) {
        setStep("thankyou");
        // Auto-close after 2 seconds
        setTimeout(() => {
          setIsVisible(false);
        }, 2000);
      }
    } else {
      // Go to feedback step for passive/detractor
      setStep("feedback");
    }
  };

  const handleSubmitFeedback = async () => {
    const success = await saveResponse(selectedScore, feedbackText || null);
    if (success) {
      setStep("thankyou");
      // Auto-close after 2 seconds
      setTimeout(() => {
        setIsVisible(false);
      }, 2000);
    }
  };

  const handleSkipFeedback = async () => {
    const success = await saveResponse(selectedScore, null);
    if (success) {
      setStep("thankyou");
      // Auto-close after 2 seconds
      setTimeout(() => {
        setIsVisible(false);
      }, 2000);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 bg-white rounded-lg shadow-2xl border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          {step === "rating" && "Kuinka todennäköisesti suosittelisit meitä?"}
          {step === "feedback" && "Kerro lisää"}
          {step === "thankyou" && "Kiitos!"}
        </h3>
        {step !== "thankyou" && (
          <button
            onClick={handleSnooze}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Sulje"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {step === "rating" && (
          <div>
            <p className="text-sm text-gray-600 mb-4">Arvio asteikolla 0-10</p>
            <div className="grid grid-cols-11 gap-1">
              {[...Array(11)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => handleScoreClick(i)}
                  disabled={isSubmitting}
                  className="aspect-square flex items-center justify-center text-sm font-medium rounded border border-gray-300 hover:bg-blue-50 hover:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {i}
                </button>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span>Epätodennäköinen</span>
              <span>Erittäin todennäköinen</span>
            </div>
          </div>
        )}

        {step === "feedback" && (
          <div>
            <p className="text-sm text-gray-700 mb-3">
              {getFeedbackPrompt(selectedScore)}
            </p>
            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Kirjoita vastauksesi tähän..."
              className="w-full h-24 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              disabled={isSubmitting}
            />
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleSubmitFeedback}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Lähetetään..." : "Lähetä"}
              </button>
              <button
                onClick={handleSkipFeedback}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Ohita
              </button>
            </div>
          </div>
        )}

        {step === "thankyou" && (
          <div className="text-center py-4">
            <div className="flex justify-center mb-3">
              <CheckCircle2 className="text-green-500" size={48} />
            </div>
            <p className="text-lg font-medium text-gray-900">
              Kiitos palautteestasi!
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Arvostamme mielipidettäsi
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MonthlyNpsModal;
