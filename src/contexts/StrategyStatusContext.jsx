import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "./AuthContext";
import { supabase } from "../lib/supabase";
import { useStrategyStatusQuery, useApproveStrategy } from "../hooks/queries";

const StrategyStatusContext = createContext({});

const MODAL_BLACKLIST = [
  "/",
  "/strategy",
  "/settings",
  "/signin",
  "/signup",
  "/reset-password",
  "/forgot-password",
  "/admin",
];

export const useStrategyStatus = () => {
  const context = useContext(StrategyStatusContext);
  if (!context) {
    throw new Error(
      "useStrategyStatus must be used within a StrategyStatusProvider",
    );
  }
  return context;
};

export const StrategyStatusProvider = ({ children }) => {
  const { t } = useTranslation("common");
  const { user, organization } = useAuth();
  const location = useLocation();
  const [showStrategyModal, setShowStrategyModal] = useState(false);
  const realtimeChannelRef = useRef(null);

  const {
    data: strategyData,
    isLoading,
    refetch: refetchStatus,
  } = useStrategyStatusQuery({
    userId: user?.id,
    enabled: !!user?.id,
  });

  const approveStrategyMutation = useApproveStrategy();

  const userStatus = strategyData?.status ?? null;

  const isOnBlockedPage = useCallback(() => {
    return MODAL_BLACKLIST.some((path) => {
      if (path === "/") {
        return location.pathname === "/";
      }
      return (
        location.pathname === path || location.pathname.startsWith(path + "/")
      );
    });
  }, [location.pathname]);

  const checkAndShowModal = useCallback(
    (status) => {
      if (!user?.id) return;

      const skipped = localStorage.getItem(`strategy_modal_skipped_${user.id}`);
      if (skipped === "true") {
        return;
      }

      if (status === "Pending" && !isOnBlockedPage()) {
        setShowStrategyModal(true);
        setTimeout(() => {
          const event = new CustomEvent("strategy-modal-should-open", {
            detail: { reason: "status-pending" },
          });
          window.dispatchEvent(event);
        }, 100);
      }
    },
    [user?.id, isOnBlockedPage],
  );

  useEffect(() => {
    if (userStatus) {
      checkAndShowModal(userStatus);
    }
  }, [userStatus, checkAndShowModal]);

  const approveStrategy = async () => {
    if (!user?.id) return;

    try {
      await approveStrategyMutation.mutateAsync();
      setShowStrategyModal(false);
      if (user?.id) {
        localStorage.removeItem(`strategy_modal_skipped_${user.id}`);
      }
    } catch (error) {
      console.error("StrategyStatus: Approval error:", error);
      alert(t("alerts.error.strategyError"));
    }
  };

  const requestStrategyUpdate = () => {
    setShowStrategyModal(false);
    window.location.href = "/strategy";
  };

  const closeModal = () => {
    setShowStrategyModal(false);
  };

  useEffect(() => {
    if (!user?.id || !organization?.id) return;

    if (realtimeChannelRef.current) {
      supabase.removeChannel(realtimeChannelRef.current);
    }

    const orgUserId = organization.id;

    realtimeChannelRef.current = supabase
      .channel("user-status-changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "users",
          filter: `id=eq.${orgUserId}`,
        },
        (payload) => {
          const newStatus = payload.new?.status;

          if (newStatus) {
            refetchStatus();

            if (newStatus === "Pending" && !isOnBlockedPage()) {
              setShowStrategyModal(true);
            }
          }
        },
      )
      .subscribe();

    return () => {
      if (realtimeChannelRef.current) {
        supabase.removeChannel(realtimeChannelRef.current);
        realtimeChannelRef.current = null;
      }
    };
  }, [user?.id, organization?.id, isOnBlockedPage, refetchStatus]);

  useEffect(() => {
    if (isOnBlockedPage()) {
      setShowStrategyModal(false);
    }
  }, [location.pathname, isOnBlockedPage]);

  useEffect(() => {
    const handleForceOpen = () => {
      setShowStrategyModal(true);
    };

    window.addEventListener("force-strategy-modal-open", handleForceOpen);
    return () => {
      window.removeEventListener("force-strategy-modal-open", handleForceOpen);
    };
  }, []);

  const value = {
    showStrategyModal,
    userStatus,
    loading: isLoading || approveStrategyMutation.isPending,
    approveStrategy,
    requestStrategyUpdate,
    closeModal,
    refreshUserStatus: refetchStatus,
  };

  return (
    <StrategyStatusContext.Provider value={value}>
      {children}
    </StrategyStatusContext.Provider>
  );
};
