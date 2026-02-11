import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../contexts/AuthContext";
import { useFeatures } from "../hooks/useFeatures";
import NotificationBell from "./NotificationBell";
import TicketButton from "./TicketButton";
import { OpenBuilderButton } from "./OpenBuilderButton";
import { OpenMailButton } from "./OpenMailButton";
import { OpenAdminButton } from "./OpenAdminButton";

const DEFAULT_LOGO_URL =
  "https://enrploxjigoyqajoqgkj.supabase.co/storage/v1/object/public/user-logos/1b60ac47-ac9a-4b0e-ba08-610a38380f3d/logo.png";

// Icons as separate components for cleaner code
const HomeIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
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

const PostsIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M17 2H7C5.89543 2 5 2.89543 5 4V20C5 21.1046 5.89543 22 7 22H17C18.1046 22 19 21.1046 19 20V4C19 2.89543 18.1046 2 17 2Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 18H12.01"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M8 6H16"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M8 10H16"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M8 14H16"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const MonitoringIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M2 3h20v18H2V3z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M7 8h10M7 12h10M7 16h6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="18" cy="6" r="2" fill="currentColor" />
  </svg>
);

const BlogIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M4 19.5C4 18.1193 5.11929 17 6.5 17H20"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M6.5 2H20V22H6.5C5.11929 22 4 20.8807 4 19.5V2.5C4 1.11929 5.11929 0 6.5 0Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M10 9H16"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M10 13H16"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M10 17H16"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const StrategyIcon = () => (
  <svg width="20" height="20" viewBox="0 0 256 256" fill="currentColor">
    <path d="M48,64a8,8,0,0,1,8-8H72V40a8,8,0,0,1,16,0V56h16a8,8,0,0,1,0,16H88V88a8,8,0,0,1-16,0V72H56A8,8,0,0,1,48,64ZM184,192h-8v-8a8,8,0,0,0-16,0v8h-8a8,8,0,0,0,0,16h8v8a8,8,0,0,0,16,0v-8h8a8,8,0,0,0,0-16Zm56-48H224V128a8,8,0,0,0-16,0v16H192a8,8,0,0,0,0,16h16v16a8,8,0,0,0,16,0V160h16a8,8,0,0,0,0-16ZM219.31,80,80,219.31a16,16,0,0,1-22.62,0L36.68,198.63a16,16,0,0,1,0-22.63L176,36.69a16,16,0,0,1,22.63,0l20.68,20.68A16,16,0,0,1,219.31,80Zm-54.63,32L144,91.31l-96,96L68.68,208ZM208,68.69,187.31,48l-32,32L176,100.69Z" />
  </svg>
);

const CampaignsIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M3 3h18v4H3V3zM3 10h18v11H3V10z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M7 14h6M7 18h10"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CallsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 256 256" fill="currentColor">
    <path d="M200,48H136V16a8,8,0,0,0-16,0V48H56A32,32,0,0,0,24,80V192a32,32,0,0,0,32,32H200a32,32,0,0,0,32-32V80A32,32,0,0,0,200,48Zm16,144a16,16,0,0,1-16,16H56a16,16,0,0,1-16-16V80A16,16,0,0,1,56,64H200a16,16,0,0,1,16,16Zm-52-56H92a28,28,0,0,0,0,56h72a28,28,0,0,0,0-56Zm-28,16v24H120V152ZM80,164a12,12,0,0,1,12-12h12v24H92A12,12,0,0,1,80,164Zm84,12H152V152h12a12,12,0,0,1,0,24ZM72,108a12,12,0,1,1,12,12A12,12,0,0,1,72,108Zm88,0a12,12,0,1,1,12,12A12,12,0,0,1,160,108Z" />
  </svg>
);

const LeadsIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle
      cx="12"
      cy="10"
      r="3"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const AssistantIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M16 18l6-6-6-6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M8 6L2 12l6 6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const VoicemailIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M14.05 2a9 9 0 0 1 8 7.94"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M14.05 6A5 5 0 0 1 18 10"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const SettingsIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle
      cx="12"
      cy="12"
      r="3"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const MeetingNotesIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M14 2V8H20"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M16 13H8"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M16 17H8"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M10 9H9H8"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const OrganizationIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle
      cx="9"
      cy="7"
      r="4"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M23 21v-2a4 4 0 0 0-3-3.87"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M16 3.13a4 4 0 0 1 0 7.75"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const HelpIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <line
      x1="12"
      y1="17"
      x2="12.01"
      y2="17"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const LogoutIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M16 17l5-5-5-5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M21 12H9"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ChevronIcon = ({ isOpen }) => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
  >
    <path
      d="M6 9l6 6 6-6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const getMenuItems = (t) => [
  { label: t("general.home"), path: "/dashboard", icon: HomeIcon },
  { label: t("sidebar.labels.posts"), path: "/posts", icon: PostsIcon },
  {
    label: t("sidebar.labels.monitoring"),
    path: "/monitoring",
    icon: MonitoringIcon,
  },
  {
    label: t("general.blogsNewsletters"),
    path: "/blog-newsletter",
    icon: BlogIcon,
  },
  {
    label: t("general.contentStrategy"),
    path: "/strategy",
    icon: StrategyIcon,
  },
  {
    label: t("sidebar.labels.campaigns"),
    path: "/campaigns",
    icon: CampaignsIcon,
  },
  { label: t("sidebar.labels.calls"), path: "/calls", icon: CallsIcon },
  { label: t("sidebar.labels.leads"), path: "/lead-scraping", icon: LeadsIcon },
  {
    label: t("sidebar.labels.assistentti"),
    path: "/ai-chat",
    icon: AssistantIcon,
    moderatorOnly: false,
    feature: null,
  },
  {
    label: t("sidebar.labels.vastaaja"),
    path: "/vastaaja",
    icon: VoicemailIcon,
    moderatorOnly: false,
    feature: "Voicemail",
  },
  {
    label: t("sidebar.labels.admin"),
    path: "/admin",
    icon: SettingsIcon,
    superadminOnly: true,
  },
  {
    label: t("sidebar.labels.adminBlog"),
    path: "/admin-blog",
    icon: BlogIcon,
    superadminOnly: true,
  },
  {
    label: t("sidebar.labels.meetingNotes"),
    path: "/meeting-notes",
    icon: MeetingNotesIcon,
    feature: "Meeting Notes",
  },
  {
    label: t("sidebar.labels.organizationMembers"),
    path: "/organization-members",
    icon: OrganizationIcon,
    adminOnly: false,
  },
];

// SidebarNavItem component with tooltip support for collapsed state
function SidebarNavItem({ item, isActive, isCollapsed, onClick }) {
  const Icon = item.icon;

  return (
    <li className="relative group list-none m-0 p-0">
      <button
        onClick={onClick}
        className={`
          flex items-center w-full rounded-lg transition-all duration-150 text-left
          outline-none cursor-pointer border-none
          ${isCollapsed ? "justify-center px-3 py-2.5" : "px-4 py-2.5 gap-3"}
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
        {!isCollapsed && <span className="truncate text-sm">{item.label}</span>}
      </button>

      {/* Tooltip for collapsed state */}
      {isCollapsed && (
        <span className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-gray-800 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible pointer-events-none whitespace-nowrap z-50 transition-all duration-150 shadow-lg">
          {item.label}
        </span>
      )}
    </li>
  );
}

// SidebarSection component for collapsible sections
function SidebarSection({
  title,
  items,
  isOpen,
  onToggle,
  isCollapsed,
  location,
  navigate,
  isItemVisible,
  hasFeature,
}) {
  if (isCollapsed) {
    // In collapsed mode, show icons without section headers
    return (
      <ul className="space-y-0.5 px-2 py-1 list-none m-0 p-0">
        {items.filter(isItemVisible).map((item) => {
          if (item.feature && !hasFeature(item.feature)) return null;
          return (
            <SidebarNavItem
              key={item.path}
              item={item}
              isActive={location.pathname.startsWith(item.path)}
              isCollapsed={isCollapsed}
              onClick={() => navigate(item.path)}
            />
          );
        })}
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
        className={`overflow-hidden transition-all duration-200 ${isOpen ? "max-h-[500px]" : "max-h-0"}`}
      >
        <ul className="space-y-0.5 px-2 pb-1 list-none m-0 p-0">
          {items.filter(isItemVisible).map((item) => {
            if (item.feature && !hasFeature(item.feature)) return null;
            return (
              <SidebarNavItem
                key={item.path}
                item={item}
                isActive={location.pathname.startsWith(item.path)}
                isCollapsed={isCollapsed}
                onClick={() => navigate(item.path)}
              />
            );
          })}
        </ul>
      </div>
    </div>
  );
}

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation("common");
  const menuItems = getMenuItems(t);

  const [logoUrl, setLogoUrl] = useState(null);
  const { user, signOut, organization } = useAuth();
  const { has: hasFeature } = useFeatures();
  const [openSections, setOpenSections] = useState({
    markkinointi: true,
    myynti: true,
    tyokalut: true,
    yllapito: true,
  });
  const [isCollapsed, setIsCollapsed] = useState(true);

  const isSuperAdmin = user?.systemRole === "superadmin";
  const isAdmin = user?.systemRole === "admin" || isSuperAdmin;
  const isModerator = user?.systemRole === "moderator" || isAdmin;

  const toggleSection = (key) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const isItemVisible = (item) => {
    if (item.path === "/organization-members") {
      if (isSuperAdmin || user?.systemRole === "admin") return true;
      const orgRole = organization?.role;
      return orgRole === "owner" || orgRole === "admin";
    }
    if (item.superadminOnly && !isSuperAdmin) return false;
    if (item.moderatorOnly && !isSuperAdmin && !isModerator) return false;
    return true;
  };

  // Filter items by section
  const marketingItems = menuItems.filter((i) =>
    ["/posts", "/blog-newsletter", "/strategy", "/monitoring"].includes(i.path),
  );
  const salesItems = menuItems.filter((i) =>
    ["/campaigns", "/calls", "/lead-scraping"].includes(i.path),
  );
  const toolItems = menuItems.filter((i) =>
    ["/ai-chat", "/vastaaja", "/meeting-notes"].includes(i.path),
  );
  const adminItems = menuItems.filter((i) =>
    ["/admin", "/admin-blog", "/organization-members"].includes(i.path),
  );

  // Feature-gated visibility
  const marketingItemsWithFeatures = marketingItems.filter((item) => {
    if (item.path === "/posts" && !hasFeature("Social Media")) return false;
    if (
      item.path === "/blog-newsletter" &&
      !hasFeature("Email marketing integration")
    )
      return false;
    if (item.path === "/strategy" && !hasFeature("Marketing assistant"))
      return false;
    if (item.path === "/monitoring" && !hasFeature("Media Monitoring"))
      return false;
    return true;
  });

  const salesItemsWithFeatures = salesItems.filter((item) => {
    if (item.path === "/campaigns" && !hasFeature("Campaigns")) return false;
    if (item.path === "/calls" && !hasFeature("Phone Calls")) return false;
    if (item.path === "/lead-scraping" && !hasFeature("Leads")) return false;
    return true;
  });

  const canShowTools = toolItems.some(isItemVisible);
  const canShowAdmin = adminItems.some(isItemVisible);

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
      {/* Desktop sidebar */}
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
          className={`
          flex flex-col items-center flex-shrink-0
          border-b border-gray-700
          transition-all duration-300
          ${isCollapsed ? "p-4 gap-3" : "p-5 gap-3"}
        `}
        >
          {/* Logo/Avatar */}
          <div
            className={`
            flex items-center justify-center flex-shrink-0
            rounded-xl overflow-hidden bg-gray-800
            transition-all duration-300
            ${isCollapsed ? "w-10 h-10" : "w-12 h-12"}
          `}
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

          {/* Company name and email - hidden when collapsed */}
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

              {/* Language Selector */}
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
                  {t("lang.shortFi")}
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
                  {t("lang.shortEn")}
                </button>
              </div>
            </>
          )}

          {/* Notification Bell */}
          <div className="flex justify-center items-center mt-1">
            <NotificationBell />
          </div>
        </div>

        {/* Navigation */}
        <nav
          className={`flex-1 py-2 overflow-y-auto overflow-x-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden`}
        >
          {/* Dashboard */}
          <ul className="space-y-0.5 px-2 pb-2 list-none m-0">
            {menuItems
              .filter((i) => i.path === "/dashboard")
              .map((item) => (
                <SidebarNavItem
                  key={item.path}
                  item={item}
                  isActive={location.pathname.startsWith(item.path)}
                  isCollapsed={isCollapsed}
                  onClick={() => navigate(item.path)}
                />
              ))}
          </ul>

          {/* Marketing Section */}
          {marketingItemsWithFeatures.length > 0 && (
            <SidebarSection
              title={t("sidebar.sections.marketing")}
              items={marketingItemsWithFeatures}
              isOpen={openSections.markkinointi}
              onToggle={() => toggleSection("markkinointi")}
              isCollapsed={isCollapsed}
              location={location}
              navigate={navigate}
              isItemVisible={isItemVisible}
              hasFeature={hasFeature}
            />
          )}

          {/* Sales Section */}
          {salesItemsWithFeatures.length > 0 && (
            <SidebarSection
              title={t("sidebar.sections.sales")}
              items={salesItemsWithFeatures}
              isOpen={openSections.myynti}
              onToggle={() => toggleSection("myynti")}
              isCollapsed={isCollapsed}
              location={location}
              navigate={navigate}
              isItemVisible={isItemVisible}
              hasFeature={hasFeature}
            />
          )}

          {/* Tools Section */}
          {canShowTools && (
            <SidebarSection
              title={t("sidebar.sections.tools")}
              items={toolItems}
              isOpen={openSections.tyokalut}
              onToggle={() => toggleSection("tyokalut")}
              isCollapsed={isCollapsed}
              location={location}
              navigate={navigate}
              isItemVisible={isItemVisible}
              hasFeature={hasFeature}
            />
          )}

          {/* OpenBuilderButton in Tools section when expanded */}
          {!isCollapsed && hasFeature("sitebuilder") && (
            <div className="px-2">
              <OpenBuilderButton isCollapsed={isCollapsed} />
            </div>
          )}

          {/* OpenMailButton in Tools section when expanded */}
          {!isCollapsed && hasFeature("Rascal Mail") && (
            <div className="px-2">
              <OpenMailButton isCollapsed={isCollapsed} />
            </div>
          )}

          {/* Admin Section */}
          {canShowAdmin && (
            <SidebarSection
              title={t("sidebar.sections.admin")}
              items={adminItems}
              isOpen={openSections.yllapito}
              onToggle={() => toggleSection("yllapito")}
              isCollapsed={isCollapsed}
              location={location}
              navigate={navigate}
              isItemVisible={isItemVisible}
              hasFeature={hasFeature}
            />
          )}

          {/* Open Admin Button */}
          {isModerator && (
            <div className="px-2">
              <OpenAdminButton isCollapsed={isCollapsed} />
            </div>
          )}
        </nav>

        {/* Settings Section - Sticky Bottom */}
        <div
          style={{ background: "#111827" }}
          className={`sticky bottom-0 flex flex-col gap-1 border-t border-gray-700 pt-3 pb-4 transition-all duration-300 ${isCollapsed ? "px-2" : "px-3"}`}
        >
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
              {!isCollapsed && (
                <span className="text-sm">{t("sidebar.helpCenter")}</span>
              )}
            </button>
            {isCollapsed && (
              <span className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-gray-800 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible pointer-events-none whitespace-nowrap z-50 transition-all duration-150 shadow-lg">
                {t("sidebar.helpCenter")}
              </span>
            )}
          </div>

          {/* Settings */}
          <div className="relative group">
            <button
              onClick={() => navigate("/settings")}
              style={{
                background: "transparent",
                border: "none",
                color: "#9ca3af",
              }}
              className={`flex items-center w-full rounded-lg transition-all duration-150 outline-none cursor-pointer hover:bg-gray-800 hover:text-white ${isCollapsed ? "justify-center px-3 py-2.5" : "px-4 py-2.5 gap-3"}`}
            >
              <SettingsIcon />
              {!isCollapsed && (
                <span className="text-sm">{t("sidebar.settings")}</span>
              )}
            </button>
            {isCollapsed && (
              <span className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-gray-800 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible pointer-events-none whitespace-nowrap z-50 transition-all duration-150 shadow-lg">
                {t("sidebar.settings")}
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
              {!isCollapsed && (
                <span className="text-sm">{t("sidebar.logout")}</span>
              )}
            </button>
            {isCollapsed && (
              <span className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-gray-800 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible pointer-events-none whitespace-nowrap z-50 transition-all duration-150 shadow-lg">
                {t("sidebar.logout")}
              </span>
            )}
          </div>
        </div>
      </aside>

      <TicketButton />
    </>
  );
}
