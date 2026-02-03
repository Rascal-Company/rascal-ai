import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../contexts/AuthContext";
import NotificationBell from "./NotificationBell";
import TicketButton from "./TicketButton";

const DEFAULT_LOGO_URL =
  "https://enrploxjigoyqajoqgkj.supabase.co/storage/v1/object/public/user-logos/1b60ac47-ac9a-4b0e-ba08-610a38380f3d/logo.png";

// Icons
const DashboardIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path
      d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M9 22V12H15V22"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const SocialIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path
      d="M17 2H7C5.89543 2 5 2.89543 5 4V20C5 21.1046 5.89543 22 7 22H17C18.1046 22 19 21.1046 19 20V4C19 2.89543 18.1046 2 17 2Z"
      stroke="currentColor"
      strokeWidth="2"
    />
    <path
      d="M12 18H12.01M8 6H16M8 10H16M8 14H16"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const ContentIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path
      d="M4 19.5C4 18.1193 5.11929 17 6.5 17H20M6.5 2H20V22H6.5C5.11929 22 4 20.8807 4 19.5V2.5C4 1.11929 5.11929 0 6.5 0Z"
      stroke="currentColor"
      strokeWidth="2"
    />
    <path
      d="M10 9H16M10 13H16M10 17H16"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const StrategyIcon = () => (
  <svg width="20" height="20" viewBox="0 0 256 256" fill="currentColor">
    <path d="M48,64a8,8,0,0,1,8-8H72V40a8,8,0,0,1,16,0V56h16a8,8,0,0,1,0,16H88V88a8,8,0,0,1-16,0V72H56A8,8,0,0,1,48,64ZM184,192h-8v-8a8,8,0,0,0-16,0v8h-8a8,8,0,0,0,0,16h8v8a8,8,0,0,0,16,0v-8h8a8,8,0,0,0,0-16Zm56-48H224V128a8,8,0,0,0-16,0v16H192a8,8,0,0,0,0,16h16v16a8,8,0,0,0,16,0V160h16a8,8,0,0,0,0-16ZM219.31,80,80,219.31a16,16,0,0,1-22.62,0L36.68,198.63a16,16,0,0,1,0-22.63L176,36.69a16,16,0,0,1,22.63,0l20.68,20.68A16,16,0,0,1,219.31,80Zm-54.63,32L144,91.31l-96,96L68.68,208ZM208,68.69,187.31,48l-32,32L176,100.69Z" />
  </svg>
);

const CampaignIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path
      d="M3 3h18v4H3V3zM3 10h18v11H3V10z"
      stroke="currentColor"
      strokeWidth="2"
    />
    <path
      d="M7 14h6M7 18h10"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const CallsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 256 256" fill="currentColor">
    <path d="M200,48H136V16a8,8,0,0,0-16,0V48H56A32,32,0,0,0,24,80V192a32,32,0,0,0,32,32H200a32,32,0,0,0,32-32V80A32,32,0,0,0,200,48Zm16,144a16,16,0,0,1-16,16H56a16,16,0,0,1-16-16V80A16,16,0,0,1,56,64H200a16,16,0,0,1,16,16Zm-52-56H92a28,28,0,0,0,0,56h72a28,28,0,0,0,0-56Zm-28,16v24H120V152ZM80,164a12,12,0,0,1,12-12h12v24H92A12,12,0,0,1,80,164Zm84,12H152V152h12a12,12,0,0,1,0,24ZM72,108a12,12,0,1,1,12,12A12,12,0,0,1,72,108Zm88,0a12,12,0,1,1,12,12A12,12,0,0,1,160,108Z" />
  </svg>
);

const LeadsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path
      d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"
      stroke="currentColor"
      strokeWidth="2"
    />
    <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2" />
  </svg>
);

const CustomerServiceIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path
      d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
      stroke="currentColor"
      strokeWidth="2"
    />
  </svg>
);

const EmailIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path
      d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
      stroke="currentColor"
      strokeWidth="2"
    />
    <path d="M22 6l-10 7L2 6" stroke="currentColor" strokeWidth="2" />
  </svg>
);

const PagesIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path
      d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"
      stroke="currentColor"
      strokeWidth="2"
    />
    <path d="M13 2v7h7" stroke="currentColor" strokeWidth="2" />
  </svg>
);

const AdsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
    <path
      d="M12 6v6l4 2"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const ToolsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path
      d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"
      stroke="currentColor"
      strokeWidth="2"
    />
  </svg>
);

const AdminIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
    <path
      d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"
      stroke="currentColor"
      strokeWidth="2"
    />
  </svg>
);

const HelpIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
    <path
      d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"
      stroke="currentColor"
      strokeWidth="2"
    />
    <line
      x1="12"
      y1="17"
      x2="12.01"
      y2="17"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const LogoutIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path
      d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"
      stroke="currentColor"
      strokeWidth="2"
    />
  </svg>
);

const ChevronIcon = ({ isOpen }) => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
  >
    <path
      d="M6 9l6 6 6-6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const PlaceholderIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <rect
      x="3"
      y="3"
      width="18"
      height="18"
      rx="2"
      stroke="currentColor"
      strokeWidth="2"
    />
    <path
      d="M9 9h6M9 12h6M9 15h4"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

// Menu structure with all items as placeholders
const getMenuStructure = () => ({
  dashboard: {
    label: "📊 Etusivu",
    path: "/dashboard",
    icon: DashboardIcon,
  },
  marketing: {
    label: "━━━ MARKKINOINTI ━━━",
    items: [
      {
        label: "📱 Some",
        path: "/some",
        icon: SocialIcon,
        children: [
          {
            label: "Julkaisukalenteri",
            path: "/some/calendar",
            icon: PlaceholderIcon,
          },
          {
            label: "Analytiikka",
            path: "/some/analytics",
            icon: PlaceholderIcon,
          },
          {
            label: "Kommenttien hallinta",
            path: "/some/comments",
            icon: PlaceholderIcon,
          },
        ],
      },
      {
        label: "📰 Sisältö",
        path: "/content",
        icon: ContentIcon,
        children: [
          { label: "Blogit", path: "/content/blogs", icon: PlaceholderIcon },
          {
            label: "Uutiskirjeet",
            path: "/content/newsletters",
            icon: PlaceholderIcon,
          },
          {
            label: "Mediaseuranta",
            path: "/content/media-monitoring",
            icon: PlaceholderIcon,
          },
        ],
      },
      {
        label: "🎯 Sisältöstrategia",
        path: "/strategy",
        icon: StrategyIcon,
        children: [
          {
            label: "Kampanjasuunnitelmat",
            path: "/strategy/campaigns",
            icon: PlaceholderIcon,
          },
          {
            label: "Kohderyhmät",
            path: "/strategy/audiences",
            icon: PlaceholderIcon,
          },
          {
            label: "AI-sisältögeneraattori",
            path: "/strategy/ai-generator",
            icon: PlaceholderIcon,
          },
        ],
      },
    ],
  },
  sales: {
    label: "━━━ MYYNTI ━━━",
    items: [
      { label: "🎪 Kampanjat", path: "/sales/campaigns", icon: CampaignIcon },
      {
        label: "📞 Puhelut",
        path: "/calls",
        icon: CallsIcon,
        children: [
          {
            label: "Soittolistat",
            path: "/calls/lists",
            icon: PlaceholderIcon,
          },
          { label: "Puhelulogi", path: "/calls/log", icon: PlaceholderIcon },
          {
            label: "AI-puheluanalyysi",
            path: "/calls/ai-analysis",
            icon: PlaceholderIcon,
          },
        ],
      },
      {
        label: "👥 Liidit",
        path: "/leads",
        icon: LeadsIcon,
        children: [
          {
            label: "Liidiputki",
            path: "/leads/pipeline",
            icon: PlaceholderIcon,
          },
          {
            label: "Lead scoring",
            path: "/leads/scoring",
            icon: PlaceholderIcon,
          },
          {
            label: "Yritystiedot",
            path: "/leads/company-info",
            icon: PlaceholderIcon,
          },
        ],
      },
      {
        label: "💬 Asiakaspalvelu",
        path: "/customer-service",
        icon: CustomerServiceIcon,
        children: [
          {
            label: "Chat-widget",
            path: "/customer-service/chat",
            icon: PlaceholderIcon,
          },
          {
            label: "Tikettijärjestelmä",
            path: "/customer-service/tickets",
            icon: PlaceholderIcon,
          },
          {
            label: "AI-assistentti",
            path: "/customer-service/ai",
            icon: PlaceholderIcon,
          },
        ],
      },
    ],
  },
  mail: {
    label: "━━━ SÄHKÖPOSTI (MAIL) ━━━",
    items: [
      {
        label: "✉️ Kampanjat",
        path: "/mail/campaigns",
        icon: EmailIcon,
        children: [
          {
            label: "Uutiskirjeet",
            path: "/mail/campaigns/newsletters",
            icon: PlaceholderIcon,
          },
          {
            label: "Drip-sekvenssit",
            path: "/mail/campaigns/drip",
            icon: PlaceholderIcon,
          },
          {
            label: "Transaktioviestit",
            path: "/mail/campaigns/transactional",
            icon: PlaceholderIcon,
          },
        ],
      },
      {
        label: "📋 Listat & segmentit",
        path: "/mail/lists",
        icon: PlaceholderIcon,
      },
      {
        label: "📈 Analytiikka",
        path: "/mail/analytics",
        icon: PlaceholderIcon,
        children: [
          {
            label: "Avaus- & klikkausraportit",
            path: "/mail/analytics/reports",
            icon: PlaceholderIcon,
          },
          {
            label: "Toimitettavuus",
            path: "/mail/analytics/deliverability",
            icon: PlaceholderIcon,
          },
          {
            label: "A/B-testit",
            path: "/mail/analytics/ab-tests",
            icon: PlaceholderIcon,
          },
        ],
      },
      {
        label: "⚙️ Asetukset",
        path: "/mail/settings",
        icon: PlaceholderIcon,
        children: [
          {
            label: "Lähettäjädomainit",
            path: "/mail/settings/domains",
            icon: PlaceholderIcon,
          },
          {
            label: "Templatekirjasto",
            path: "/mail/settings/templates",
            icon: PlaceholderIcon,
          },
          {
            label: "Automaatiosäännöt",
            path: "/mail/settings/automation",
            icon: PlaceholderIcon,
          },
        ],
      },
    ],
  },
  pages: {
    label: "━━━ SIVUSTOT (PAGES) ━━━",
    items: [
      {
        label: "🌐 Sivustot",
        path: "/pages/sites",
        icon: PagesIcon,
        children: [
          {
            label: "Omat sivustot",
            path: "/pages/sites/my-sites",
            icon: PlaceholderIcon,
          },
          {
            label: "Luo uusi",
            path: "/pages/sites/create",
            icon: PlaceholderIcon,
          },
        ],
      },
      { label: "🎨 Sivueditori", path: "/pages/editor", icon: PlaceholderIcon },
      {
        label: "📄 Laskeutumissivut",
        path: "/pages/landing",
        icon: PlaceholderIcon,
      },
      { label: "📝 Lomakkeet", path: "/pages/forms", icon: PlaceholderIcon },
      {
        label: "🧩 Komponenttikirjasto",
        path: "/pages/components",
        icon: PlaceholderIcon,
      },
      {
        label: "🔗 Domainit & julkaisu",
        path: "/pages/domains",
        icon: PlaceholderIcon,
      },
    ],
  },
  ads: {
    label: "━━━ MAINONTA (ADS) ━━━",
    items: [
      {
        label: "📢 Kampanjat",
        path: "/ads/campaigns",
        icon: AdsIcon,
        children: [
          {
            label: "Meta (Facebook/IG)",
            path: "/ads/campaigns/meta",
            icon: PlaceholderIcon,
          },
          {
            label: "Google Ads",
            path: "/ads/campaigns/google",
            icon: PlaceholderIcon,
          },
          {
            label: "LinkedIn",
            path: "/ads/campaigns/linkedin",
            icon: PlaceholderIcon,
          },
        ],
      },
      {
        label: "🎯 Yleisöt",
        path: "/ads/audiences",
        icon: PlaceholderIcon,
        children: [
          {
            label: "Retargeting-listat",
            path: "/ads/audiences/retargeting",
            icon: PlaceholderIcon,
          },
          {
            label: "Lookalike-yleisöt",
            path: "/ads/audiences/lookalike",
            icon: PlaceholderIcon,
          },
          {
            label: "Custom audiences",
            path: "/ads/audiences/custom",
            icon: PlaceholderIcon,
          },
        ],
      },
      {
        label: "💰 Budjetti & kulut",
        path: "/ads/budget",
        icon: PlaceholderIcon,
      },
      {
        label: "📊 Raportointi",
        path: "/ads/reporting",
        icon: PlaceholderIcon,
        children: [
          {
            label: "ROAS-seuranta",
            path: "/ads/reporting/roas",
            icon: PlaceholderIcon,
          },
          {
            label: "Attribuutio",
            path: "/ads/reporting/attribution",
            icon: PlaceholderIcon,
          },
          {
            label: "Vertailu kanavittain",
            path: "/ads/reporting/channels",
            icon: PlaceholderIcon,
          },
        ],
      },
      {
        label: "🤖 AI-optimointi",
        path: "/ads/ai",
        icon: PlaceholderIcon,
        children: [
          {
            label: "Automaattiset säädöt",
            path: "/ads/ai/auto-adjust",
            icon: PlaceholderIcon,
          },
          {
            label: "Luova testaus",
            path: "/ads/ai/creative-testing",
            icon: PlaceholderIcon,
          },
        ],
      },
    ],
  },
  tools: {
    label: "━━━ TYÖKALUT ━━━",
    items: [
      {
        label: "🤖 AI-assistentti",
        path: "/tools/ai-assistant",
        icon: ToolsIcon,
      },
      {
        label: "📊 Raporttigeneraattori",
        path: "/tools/reports",
        icon: PlaceholderIcon,
      },
      {
        label: "🔌 Integraatiot",
        path: "/tools/integrations",
        icon: PlaceholderIcon,
        children: [
          {
            label: "CRM-yhteydet",
            path: "/tools/integrations/crm",
            icon: PlaceholderIcon,
          },
          {
            label: "Maksupalvelut",
            path: "/tools/integrations/payments",
            icon: PlaceholderIcon,
          },
          {
            label: "API-avaimet",
            path: "/tools/integrations/api",
            icon: PlaceholderIcon,
          },
        ],
      },
      {
        label: "📁 Mediakirjasto",
        path: "/tools/media-library",
        icon: PlaceholderIcon,
      },
    ],
  },
  admin: {
    label: "━━━ YLLÄPITO ━━━",
    items: [
      {
        label: "🏢 Organisaatio",
        path: "/admin/organization",
        icon: AdminIcon,
        children: [
          {
            label: "Käyttäjät & roolit",
            path: "/admin/organization/users",
            icon: PlaceholderIcon,
          },
          {
            label: "Tiimit",
            path: "/admin/organization/teams",
            icon: PlaceholderIcon,
          },
          {
            label: "Audit-logi",
            path: "/admin/organization/audit",
            icon: PlaceholderIcon,
          },
        ],
      },
      {
        label: "💼 Salkun hallinta (asiakkaat)",
        path: "/admin/portfolio",
        icon: PlaceholderIcon,
      },
      {
        label: "💳 Laskutus & tilaus",
        path: "/admin/billing",
        icon: PlaceholderIcon,
      },
      {
        label: "⚙️ Asetukset",
        path: "/admin/settings",
        icon: PlaceholderIcon,
        children: [
          {
            label: "Brändiasetukset",
            path: "/admin/settings/brand",
            icon: PlaceholderIcon,
          },
          {
            label: "Ilmoitukset",
            path: "/admin/settings/notifications",
            icon: PlaceholderIcon,
          },
          {
            label: "Tietosuoja",
            path: "/admin/settings/privacy",
            icon: PlaceholderIcon,
          },
        ],
      },
    ],
  },
});

// Navigation item component
function SidebarNavItem({ item, isActive, isCollapsed, onClick, depth = 0 }) {
  const Icon = item.icon;
  const hasChildren = item.children && item.children.length > 0;
  const [isExpanded, setIsExpanded] = useState(false);

  const handleClick = () => {
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    } else {
      onClick();
    }
  };

  return (
    <li className="list-none m-0 p-0">
      <div className="relative group">
        <button
          onClick={handleClick}
          className={`
            flex items-center w-full rounded-lg transition-all duration-150 text-left
            outline-none cursor-pointer border-none
            ${isCollapsed ? "justify-center px-3 py-2.5" : `px-${4 + depth * 2} py-2.5 gap-3`}
            ${
              isActive
                ? "!bg-[#ff6600] !text-white shadow-[0_2px_8px_rgba(255,102,0,0.3)] font-semibold"
                : "!bg-transparent !text-gray-300 hover:!bg-gray-800/80 hover:!text-white"
            }
          `}
        >
          <span className="flex-shrink-0">
            <Icon />
          </span>
          {!isCollapsed && (
            <>
              <span className="truncate text-sm flex-1">{item.label}</span>
              {hasChildren && <ChevronIcon isOpen={isExpanded} />}
            </>
          )}
        </button>

        {isCollapsed && (
          <span className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-gray-800 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible pointer-events-none whitespace-nowrap z-50 transition-all duration-150 shadow-lg">
            {item.label}
          </span>
        )}
      </div>

      {hasChildren && isExpanded && !isCollapsed && (
        <ul className="ml-4 mt-1 space-y-0.5 list-none">
          {item.children.map((child) => (
            <SidebarNavItem
              key={child.path}
              item={child}
              isActive={false}
              isCollapsed={isCollapsed}
              onClick={onClick}
              depth={depth + 1}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

// Section component
function SidebarSection({
  title,
  items,
  isOpen,
  onToggle,
  isCollapsed,
  location,
  navigate,
}) {
  if (isCollapsed) {
    return (
      <ul className="space-y-0.5 px-2 py-1 list-none m-0 p-0">
        {items.map((item) => (
          <SidebarNavItem
            key={item.path}
            item={item}
            isActive={location.pathname.startsWith(item.path)}
            isCollapsed={isCollapsed}
            onClick={() => navigate(item.path)}
          />
        ))}
      </ul>
    );
  }

  return (
    <div className="mb-1">
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full px-5 py-2 mt-3 mb-1 outline-none cursor-pointer !bg-transparent border-none !text-gray-400 hover:!text-gray-200 text-xs font-bold uppercase tracking-wider transition-colors duration-150"
        type="button"
      >
        <span>{title}</span>
        <ChevronIcon isOpen={isOpen} />
      </button>

      <div
        className={`overflow-hidden transition-all duration-200 ${isOpen ? "max-h-[1000px]" : "max-h-0"}`}
      >
        <ul className="space-y-0.5 px-2 pb-1 list-none m-0 p-0">
          {items.map((item) => (
            <SidebarNavItem
              key={item.path}
              item={item}
              isActive={location.pathname.startsWith(item.path)}
              isCollapsed={isCollapsed}
              onClick={() => navigate(item.path)}
            />
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function SidebarNew() {
  const navigate = useNavigate();
  const location = useLocation();
  const { i18n } = useTranslation("common");
  const { user, signOut, organization } = useAuth();

  const [logoUrl, setLogoUrl] = useState(null);
  const [openSections, setOpenSections] = useState({
    marketing: true,
    sales: true,
    mail: true,
    pages: true,
    ads: true,
    tools: true,
    admin: true,
  });
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const menuStructure = getMenuStructure();

  // Lue valittu kategoria localStoragesta
  useEffect(() => {
    const category = localStorage.getItem("selectedCategory");
    setSelectedCategory(category);
  }, []);

  const toggleSection = (key) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => {
    if (organization?.data?.logo_url) {
      setLogoUrl(organization.data.logo_url);
    }
  }, [organization]);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--sidebar-width",
      isCollapsed ? "70px" : "250px",
    );
  }, [isCollapsed]);

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("signOut error:", error);
    }
  };

  const setLanguage = (lang) => {
    if (lang !== "fi" && lang !== "en") return;
    document.cookie = `rascal.lang=${encodeURIComponent(lang)}; path=/; max-age=31536000`;
    i18n.changeLanguage(lang);
  };

  return (
    <>
      <aside
        data-collapsed={isCollapsed}
        onMouseEnter={() => setIsCollapsed(false)}
        onMouseLeave={() => setIsCollapsed(true)}
        className={`
          fixed left-0 top-0 z-40 h-screen
          flex flex-col
          bg-gray-900 text-gray-400
          border-r border-gray-800
          transition-all duration-300 ease-in-out
          overflow-x-hidden
          ${isCollapsed ? "w-[70px]" : "w-[250px]"}
          max-md:hidden
        `}
      >
        {/* Profile Section */}
        <div
          className={`flex flex-col items-center flex-shrink-0 border-b border-gray-700 transition-all duration-300 ${isCollapsed ? "p-4 gap-3" : "p-5 gap-3"}`}
        >
          <div
            className={`flex items-center justify-center flex-shrink-0 rounded-xl overflow-hidden bg-gray-800 transition-all duration-300 ${isCollapsed ? "w-10 h-10" : "w-12 h-12"}`}
          >
            <img
              src={logoUrl || DEFAULT_LOGO_URL}
              alt={logoUrl ? "Company Logo" : "Rascal AI"}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = DEFAULT_LOGO_URL;
              }}
            />
          </div>

          {!isCollapsed && (
            <>
              {organization?.data?.company_name && (
                <span className="font-semibold text-white text-sm text-center truncate max-w-full">
                  {organization.data.company_name}
                </span>
              )}
              <span className="text-gray-400 text-xs text-center truncate max-w-full">
                {user?.email || "user@example.com"}
              </span>

              <div
                style={{
                  background: "rgba(255, 102, 0, 0.1)",
                  border: "1px solid rgba(255, 102, 0, 0.3)",
                }}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full transition-colors duration-200"
              >
                <button
                  type="button"
                  onClick={() => setLanguage("fi")}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#ff6600",
                  }}
                  className="px-1.5 py-0.5 text-xs font-semibold uppercase cursor-pointer rounded transition-all duration-200 hover:text-white"
                >
                  FI
                </button>
                <span style={{ color: "#6b7280" }} className="text-xs">
                  /
                </span>
                <button
                  type="button"
                  onClick={() => setLanguage("en")}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#ff6600",
                  }}
                  className="px-1.5 py-0.5 text-xs font-semibold uppercase cursor-pointer rounded transition-all duration-200 hover:text-white"
                >
                  EN
                </button>
              </div>
            </>
          )}

          <div className="flex justify-center items-center mt-1">
            <NotificationBell />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-2 overflow-y-auto overflow-x-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {/* Dashboard */}
          <ul className="space-y-0.5 px-2 pb-2 list-none m-0">
            <SidebarNavItem
              item={menuStructure.dashboard}
              isActive={location.pathname === menuStructure.dashboard.path}
              isCollapsed={isCollapsed}
              onClick={() => navigate(menuStructure.dashboard.path)}
            />
          </ul>

          {/* Marketing Section - näytetään kun marketing valittu tai ei valintaa */}
          {(!selectedCategory || selectedCategory === "marketing") && (
            <>
              <SidebarSection
                title={menuStructure.marketing.label}
                items={menuStructure.marketing.items}
                isOpen={openSections.marketing}
                onToggle={() => toggleSection("marketing")}
                isCollapsed={isCollapsed}
                location={location}
                navigate={navigate}
              />
              <SidebarSection
                title={menuStructure.mail.label}
                items={menuStructure.mail.items}
                isOpen={openSections.mail}
                onToggle={() => toggleSection("mail")}
                isCollapsed={isCollapsed}
                location={location}
                navigate={navigate}
              />
              <SidebarSection
                title={menuStructure.ads.label}
                items={menuStructure.ads.items}
                isOpen={openSections.ads}
                onToggle={() => toggleSection("ads")}
                isCollapsed={isCollapsed}
                location={location}
                navigate={navigate}
              />
            </>
          )}

          {/* Sales Section - näytetään kun sales valittu tai ei valintaa */}
          {(!selectedCategory || selectedCategory === "sales") && (
            <SidebarSection
              title={menuStructure.sales.label}
              items={menuStructure.sales.items}
              isOpen={openSections.sales}
              onToggle={() => toggleSection("sales")}
              isCollapsed={isCollapsed}
              location={location}
              navigate={navigate}
            />
          )}

          {/* Pages Section - näytetään kun pages valittu tai ei valintaa */}
          {(!selectedCategory || selectedCategory === "pages") && (
            <SidebarSection
              title={menuStructure.pages.label}
              items={menuStructure.pages.items}
              isOpen={openSections.pages}
              onToggle={() => toggleSection("pages")}
              isCollapsed={isCollapsed}
              location={location}
              navigate={navigate}
            />
          )}

          {/* Tools Section - näytetään aina */}
          <SidebarSection
            title={menuStructure.tools.label}
            items={menuStructure.tools.items}
            isOpen={openSections.tools}
            onToggle={() => toggleSection("tools")}
            isCollapsed={isCollapsed}
            location={location}
            navigate={navigate}
          />

          {/* Admin Section - näytetään aina */}
          <SidebarSection
            title={menuStructure.admin.label}
            items={menuStructure.admin.items}
            isOpen={openSections.admin}
            onToggle={() => toggleSection("admin")}
            isCollapsed={isCollapsed}
            location={location}
            navigate={navigate}
          />
        </nav>

        {/* Settings Section - Sticky Bottom */}
        <div
          style={{ background: "#111827" }}
          className={`sticky bottom-0 flex flex-col gap-1 border-t border-gray-700 pt-3 pb-4 transition-all duration-300 ${isCollapsed ? "px-2" : "px-3"}`}
        >
          {/* Change Category - show only if a category is selected */}
          {selectedCategory && (
            <div className="relative group">
              <button
                onClick={() => {
                  localStorage.removeItem("selectedCategory");
                  navigate("/select");
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#9ca3af",
                }}
                className={`flex items-center w-full rounded-lg transition-all duration-150 outline-none cursor-pointer hover:bg-gray-800 hover:text-white ${isCollapsed ? "justify-center px-3 py-2.5" : "px-4 py-2.5 gap-3"}`}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M3 12h18M3 6h18M3 18h18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
                {!isCollapsed && (
                  <span className="text-sm">Vaihda kategoria</span>
                )}
              </button>
              {isCollapsed && (
                <span className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-gray-800 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible pointer-events-none whitespace-nowrap z-50 transition-all duration-150 shadow-lg">
                  Vaihda kategoria
                </span>
              )}
            </div>
          )}

          {/* Help */}
          <div className="relative group">
            <button
              onClick={() => navigate("/help")}
              style={{
                background: "transparent",
                border: "none",
                color: "#9ca3af",
              }}
              className={`flex items-center w-full rounded-lg transition-all duration-150 outline-none cursor-pointer hover:bg-gray-800 hover:text-white ${isCollapsed ? "justify-center px-3 py-2.5" : "px-4 py-2.5 gap-3"}`}
            >
              <HelpIcon />
              {!isCollapsed && <span className="text-sm">Tuki</span>}
            </button>
            {isCollapsed && (
              <span className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-gray-800 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible pointer-events-none whitespace-nowrap z-50 transition-all duration-150 shadow-lg">
                Tuki
              </span>
            )}
          </div>

          {/* Logout */}
          <div className="relative group">
            <button
              onClick={handleLogout}
              type="button"
              style={{
                background: "transparent",
                border: "none",
                color: "#9ca3af",
              }}
              className={`flex items-center w-full rounded-lg transition-all duration-150 outline-none cursor-pointer hover:bg-gray-800 hover:text-white ${isCollapsed ? "justify-center px-3 py-2.5" : "px-4 py-2.5 gap-3"}`}
            >
              <LogoutIcon />
              {!isCollapsed && <span className="text-sm">Kirjaudu ulos</span>}
            </button>
            {isCollapsed && (
              <span className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-gray-800 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible pointer-events-none whitespace-nowrap z-50 transition-all duration-150 shadow-lg">
                Kirjaudu ulos
              </span>
            )}
          </div>
        </div>
      </aside>

      <TicketButton />
    </>
  );
}
