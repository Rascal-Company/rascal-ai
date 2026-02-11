import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../contexts/AuthContext";
import { useFeatures } from "../hooks/useFeatures";
import { supabase } from "../lib/supabase";

export default function MobileNavigation() {
  const { t } = useTranslation("common");
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { has: hasFeature } = useFeatures();

  const isAdmin = user?.systemRole === "superadmin";
  const isModerator = user?.systemRole === "moderator" || isAdmin;

  const menuItems = [
    { label: t("sidebar.labels.dashboard"), path: "/dashboard", feature: null },
    {
      label: t("sidebar.labels.campaigns"),
      path: "/campaigns",
      feature: "Campaigns",
    },
    {
      label: t("sidebar.labels.posts"),
      path: "/posts",
      feature: "Social Media",
    },
    {
      label: t("sidebar.labels.blogNewsletter"),
      path: "/blog-newsletter",
      feature: "Social Media",
    },
    {
      label: t("sidebar.labels.strategy"),
      path: "/strategy",
      feature: "Social Media",
    },
    {
      label: t("sidebar.labels.monitoring"),
      path: "/monitoring",
      feature: "Media Monitoring",
    },
    {
      label: t("sidebar.labels.calls"),
      path: "/calls",
      feature: "Phone Calls",
    },
    {
      label: t("sidebar.labels.assistentti"),
      path: "/ai-chat",
      feature: "Marketing assistant",
    },
    { label: "Dev", path: "/dev", feature: null, adminOnly: true },
    {
      label: t("sidebar.labels.admin"),
      path: "/admin",
      feature: null,
      adminOnly: true,
    },
    {
      label: t("sidebar.labels.adminBlog"),
      path: "/admin-blog",
      feature: null,
      moderatorOnly: true,
    },
  ];

  const bottomItems = [
    { label: t("sidebar.settings"), path: "/settings" },
    { label: t("sidebar.helpCenter"), path: "/help" },
  ];

  const handleLogout = async () => {
    try {
      await signOut();
      setIsOpen(false);
    } catch (error) {
      console.error("signOut error:", error);
    }
  };

  const handleNavigation = (path) => {
    navigate(path);
    setIsOpen(false);
  };

  const handleOpenMail = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      alert(t("alerts.error.loginRequired"));
      return;
    }
    let mailUrl = "";
    if (import.meta.env.DEV) {
      mailUrl = "http://mail.localhost:3000";
    } else {
      mailUrl = "https://mail.rascalai.fi";
    }
    const handoffUrl = `${mailUrl}/auth/handoff#access_token=${session.access_token}&refresh_token=${session.refresh_token}`;
    window.open(handoffUrl, "_blank");
    setIsOpen(false);
  };

  const handleOpenAdmin = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      alert(t("alerts.error.loginRequired"));
      return;
    }
    let adminUrl = "";
    if (import.meta.env.DEV) {
      adminUrl = "http://localhost:5173";
    } else {
      adminUrl = import.meta.env.VITE_ADMIN_URL || "https://internal.rascal.ai";
    }
    const handoffUrl = `${adminUrl}/auth/handoff#access_token=${session.access_token}&refresh_token=${session.refresh_token}`;
    window.open(handoffUrl, "_blank");
    setIsOpen(false);
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  // Estä vieritys kun valikko on auki
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  return (
    <div className="mobile-navigation">
      {/* Hamburger-nappi */}
      <button
        className={`mobile-hamburger ${isOpen ? "active" : ""}`}
        onClick={toggleMenu}
        aria-label={t("a11y.toggleMobileMenu")}
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* Mobiili-valikko overlay */}
      {isOpen && (
        <div className="mobile-nav-overlay" onClick={() => setIsOpen(false)}>
          <div className="mobile-nav-menu" onClick={(e) => e.stopPropagation()}>
            {/* Profiili-osio */}
            <div className="mobile-profile-section">
              <img
                src={user?.avatar || "/favicon.png"}
                alt={user?.name || ""}
                className="mobile-profile-avatar"
              />
              <span className="mobile-profile-name">{user?.name || ""}</span>
            </div>

            {/* Navigaatiovalikko */}
            <nav className="mobile-nav-list">
              {menuItems.map((item) => {
                // Oikeuksien tarkistus
                if (item.adminOnly && !isAdmin) return null;
                if (item.moderatorOnly && !isModerator) return null;

                // Feature-gating mobiilissa
                if (item.feature && !hasFeature(item.feature)) return null;
                if (item.path === "/dev" && !hasFeature("Dev")) return null;

                const active = location.pathname.startsWith(item.path);

                return (
                  <button
                    key={item.path}
                    className={`mobile-nav-item ${active ? "active" : ""}`}
                    onClick={() => handleNavigation(item.path)}
                  >
                    {item.label}
                  </button>
                );
              })}

              {hasFeature("Rascal Mail") && (
                <button className="mobile-nav-item" onClick={handleOpenMail}>
                  {t("sidebar.labels.rascalMail")}
                </button>
              )}

              {isModerator && (
                <button className="mobile-nav-item" onClick={handleOpenAdmin}>
                  {t("sidebar.labels.rascalAdmin")}
                </button>
              )}
            </nav>

            {/* Asetukset ja uloskirjautuminen */}
            <div className="mobile-bottom-section">
              {bottomItems.map((item) => (
                <button
                  key={item.path}
                  className="mobile-nav-item"
                  onClick={() => handleNavigation(item.path)}
                >
                  {item.label}
                </button>
              ))}
              <button className="mobile-logout-btn" onClick={handleLogout}>
                {t("sidebar.logout")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
