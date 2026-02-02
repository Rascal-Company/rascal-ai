import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "../lib/supabase";
import { getCurrentUser } from "../utils/userApi";
// CSS Module removed - styles moved to main.css
import { useAuth } from "../contexts/AuthContext";
import { useFeatures } from "../hooks/useFeatures";
import NotificationBell from "./NotificationBell";
import TicketButton from "./TicketButton";
import { OpenBuilderButton } from "./OpenBuilderButton";

// Default brändilogo jos käyttäjällä ei ole omaa logoa
const DEFAULT_LOGO_URL =
  "https://enrploxjigoyqajoqgkj.supabase.co/storage/v1/object/public/user-logos/1b60ac47-ac9a-4b0e-ba08-610a38380f3d/logo.png";

const getMenuItems = (t) => [
  {
    label: t("general.home"),
    path: "/dashboard",
    icon: (
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
    ),
  },
  {
    label: t("sidebar.labels.posts"),
    path: "/posts",
    icon: (
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
    ),
  },
  {
    label: t("sidebar.labels.monitoring"),
    path: "/monitoring",
    icon: (
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
    ),
  },
  {
    label: t("general.blogsNewsletters"),
    path: "/blog-newsletter",
    icon: (
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
    ),
  },
  {
    label: t("general.contentStrategy"),
    path: "/strategy",
    icon: (
      <svg width="20" height="20" viewBox="0 0 256 256" fill="currentColor">
        <path d="M48,64a8,8,0,0,1,8-8H72V40a8,8,0,0,1,16,0V56h16a8,8,0,0,1,0,16H88V88a8,8,0,0,1-16,0V72H56A8,8,0,0,1,48,64ZM184,192h-8v-8a8,8,0,0,0-16,0v8h-8a8,8,0,0,0,0,16h8v8a8,8,0,0,0,16,0v-8h8a8,8,0,0,0,0-16Zm56-48H224V128a8,8,0,0,0-16,0v16H192a8,8,0,0,0,0,16h16v16a8,8,0,0,0,16,0V160h16a8,8,0,0,0,0-16ZM219.31,80,80,219.31a16,16,0,0,1-22.62,0L36.68,198.63a16,16,0,0,1,0-22.63L176,36.69a16,16,0,0,1,22.63,0l20.68,20.68A16,16,0,0,1,219.31,80Zm-54.63,32L144,91.31l-96,96L68.68,208ZM208,68.69,187.31,48l-32,32L176,100.69Z"></path>
      </svg>
    ),
  },
  {
    label: t("sidebar.labels.campaigns"),
    path: "/campaigns",
    icon: (
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
    ),
  },
  {
    label: t("sidebar.labels.calls"),
    path: "/calls",
    icon: (
      <svg width="20" height="20" viewBox="0 0 256 256" fill="currentColor">
        <path d="M200,48H136V16a8,8,0,0,0-16,0V48H56A32,32,0,0,0,24,80V192a32,32,0,0,0,32,32H200a32,32,0,0,0,32-32V80A32,32,0,0,0,200,48Zm16,144a16,16,0,0,1-16,16H56a16,16,0,0,1-16-16V80A16,16,0,0,1,56,64H200a16,16,0,0,1,16,16Zm-52-56H92a28,28,0,0,0,0,56h72a28,28,0,0,0,0-56Zm-28,16v24H120V152ZM80,164a12,12,0,0,1,12-12h12v24H92A12,12,0,0,1,80,164Zm84,12H152V152h12a12,12,0,0,1,0,24ZM72,108a12,12,0,1,1,12,12A12,12,0,0,1,72,108Zm88,0a12,12,0,1,1,12,12A12,12,0,0,1,160,108Z"></path>
      </svg>
    ),
  },
  {
    label: t("sidebar.labels.leads"),
    path: "/lead-scraping",
    icon: (
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
    ),
  },
  {
    label: t("sidebar.labels.assistentti"),
    path: "/ai-chat",
    moderatorOnly: false,
    feature: null,
    icon: (
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
    ),
  },
  {
    label: t("sidebar.labels.vastaaja"),
    path: "/vastaaja",
    moderatorOnly: false,
    feature: "Voicemail",
    icon: (
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
    ),
  },
  {
    label: t("sidebar.labels.admin"),
    path: "/admin",
    superadminOnly: true,
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M19.4 15C19.2669 15.3016 19.2272 15.6362 19.286 15.9606C19.3448 16.285 19.4995 16.5843 19.73 16.82L19.79 16.88C19.976 17.0657 20.1235 17.2863 20.2241 17.5291C20.3248 17.7719 20.3766 18.0322 20.3766 18.295C20.3766 18.5578 20.3248 18.8181 20.2241 19.0609C20.1235 19.3037 19.976 19.5243 19.79 19.71C19.6043 19.896 19.3837 20.0435 19.1409 20.1441C18.8981 20.2448 18.6378 20.2966 18.375 20.2966C18.1122 20.2966 17.8519 20.2448 17.6091 20.1441C17.3663 20.0435 17.1457 19.896 16.96 19.71L16.9 19.65C16.6643 19.4195 16.365 19.2648 16.0406 19.206C15.7162 19.1472 15.3816 19.1869 15.08 19.32C14.7842 19.4468 14.532 19.6572 14.3543 19.9255C14.1766 20.1938 14.0813 20.5082 14.08 20.83V21C14.08 21.5304 13.8693 22.0391 13.4942 22.4142C13.1191 22.7893 12.6104 23 12.08 23C11.5496 23 11.0409 22.7893 10.6658 22.4142C10.2907 22.0391 10.08 21.5304 10.08 21V20.91C10.0723 20.579 9.96512 20.257 9.77251 19.9887C9.5799 19.7204 9.31074 19.5206 9 19.41C8.69838 19.2994 8.36381 19.2818 8.03941 19.3594C7.71502 19.437 7.41471 19.6066 7.18 19.85L7.12 19.91C6.936 20.0937 6.71547 20.2401 6.47275 20.3398C6.23004 20.4395 5.97033 20.4903 5.708 20.49C5.44567 20.49 5.18596 20.4395 4.94325 20.3398C4.70053 20.2401 4.47997 20.0937 4.296 19.91C4.11233 19.7263 3.96588 19.5058 3.86619 19.2631C3.7665 19.0204 3.71567 18.7607 3.71567 18.498C3.71567 18.2353 3.7665 17.9756 3.86619 17.7329C3.96588 17.4902 4.11233 17.2697 4.296 17.086L4.356 17.026C4.5995 16.792 4.75437 16.4907 4.81243 16.1663C4.87049 15.8419 4.82912 15.5073 4.694 15.2C4.57403 14.9248 4.38131 14.6902 4.13438 14.5198C3.88745 14.3494 3.59556 14.2499 3.29 14.23H3C2.46957 14.23 1.96086 14.0193 1.58579 13.6442C1.21071 13.2691 1 12.7604 1 12.23C1 11.6996 1.21071 11.1909 1.58579 10.8158C1.96086 10.4407 2.46957 10.23 3 10.23H3.29C3.59556 10.2101 3.88745 10.1106 4.13438 9.94019C4.38131 9.76978 4.57403 9.53519 4.694 9.26C4.82912 8.95266 4.87049 8.61805 4.81243 8.29364C4.75437 7.96923 4.5995 7.66797 4.356 7.434L4.296 7.374C4.11233 7.19033 3.96588 6.9698 3.86619 6.7271C3.7665 6.48439 3.71567 6.22468 3.71567 5.962C3.71567 5.69932 3.7665 5.43961 3.86619 5.1969C3.96588 4.95419 4.11233 4.73366 4.296 4.55L4.356 4.49C4.5995 4.2565 4.75437 3.95523 4.81243 3.63082C4.87049 3.30641 4.82912 2.9718 4.694 2.664C4.57403 2.38878 4.38131 2.15418 4.13438 1.98378C3.88745 1.81337 3.59556 1.71387 3.29 1.694H3C2.46957 1.694 1.96086 1.48329 1.58579 1.10822C1.21071 0.733141 1 0.224428 1 0C1 0.530428 1.21071 1.03914 1.58579 1.41421C1.96086 1.78929 2.46957 2 3 2H3.29C3.59556 2.01987 3.88745 2.11937 4.13438 2.28978C4.38131 2.46018 4.57403 2.69478 4.694 2.97C4.82912 3.27734 4.87049 3.61195 4.81243 3.93636C4.75437 4.26077 4.5995 4.56203 4.356 4.796L4.296 4.856C4.11233 5.03967 3.96588 5.2602 3.86619 5.5029C3.7665 5.74561 3.71567 6.00532 3.71567 6.268C3.71567 6.53068 3.7665 6.79039 3.86619 7.0331C3.96588 7.2758 4.11233 7.49633 4.296 7.68L4.356 7.74C4.5995 7.9735 4.75437 8.27477 4.81243 8.59918C4.87049 8.92359 4.82912 9.2582 4.694 9.566C4.57403 9.84122 4.38131 10.0758 4.13438 10.2462C3.88745 10.4166 3.59556 10.5161 3.29 10.536H3C2.46957 10.536 1.96086 10.3253 1.58579 9.95021C1.21071 9.57514 1 9.06643 1 8.536C1 8.00557 1.21071 7.49686 1.58579 7.12179C1.96086 6.74671 2.46957 6.536 3 6.536H3.29C3.59556 6.55687 3.88745 6.65637 4.13438 6.82678C4.38131 6.99718 4.57403 7.23178 4.694 7.507C4.82912 7.81434 4.87049 8.14895 4.81243 8.47336C4.75437 8.79777 4.5995 9.09903 4.356 9.333L4.296 9.393C4.11233 9.57667 3.96588 9.7972 3.86619 10.0399C3.7665 10.2826 3.71567 10.5423 3.71567 10.805C3.71567 11.0677 3.7665 11.3274 3.86619 11.5701C3.96588 11.8128 4.11233 12.0333 4.296 12.217L4.356 12.277C4.5995 12.5105 4.75437 12.8118 4.81243 13.1362C4.87049 13.4606 4.82912 13.7952 4.694 14.103C4.57403 14.3782 4.38131 14.6128 4.13438 14.7832C3.88745 14.9536 3.59556 15.0531 3.29 15.073H3C2.46957 15.073 1.96086 14.8623 1.58579 14.4872C1.21071 14.1121 1 13.6034 1 13.073C1 12.5426 1.21071 12.0339 1.58579 11.6588C1.96086 11.2837 2.46957 11.073 3 11.073H3.29C3.59556 11.0939 3.88745 11.1934 4.13438 11.3638C4.38131 11.5342 4.57403 11.7688 4.694 12.044C4.82912 12.3513 4.87049 12.6859 4.81243 13.0103C4.75437 13.3347 4.5995 13.636 4.356 13.87L4.356 13.87Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    label: t("sidebar.labels.adminBlog"),
    path: "/admin-blog",
    superadminOnly: true,
    icon: (
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
    ),
  },
  {
    label: t("sidebar.labels.meetingNotes"),
    path: "/meeting-notes",
    feature: "Meeting Notes",
    icon: (
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
    ),
  },
  {
    label: t("sidebar.labels.accountManager"),
    path: "/account-manager",
    moderatorOrSuperadminOnly: true,
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M17 20H22V18C22 16.3431 20.6569 15 19 15C18.0444 15 17.1931 15.4468 16.6438 16.1429M17 20H7M17 20V18C17 15.2386 14.7614 13 12 13C9.23858 13 7 15.2386 7 18V20M7 20H2V18C2 16.3431 3.34315 15 5 15C5.95561 15 6.80686 15.4468 7.35625 16.1429M15 7C15 9.20914 13.2091 11 11 11C8.79086 11 7 9.20914 7 7C7 4.79086 8.79086 3 11 3C13.2091 3 15 4.79086 15 7Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    label: t("sidebar.labels.organizationMembers"),
    path: "/organization-members",
    adminOnly: false, // Tarkistetaan erikseen owner/admin roolilla
    icon: (
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
    ),
  },
];

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
    jarjestelma: true,
  });

  // Roolihierarkia: superadmin > admin > moderator > user
  // superadmin = näkee kaikki admin-sivut
  // admin = näkee vain organisaation hallinnan
  const isSuperAdmin = user?.systemRole === "superadmin";
  const isAdmin = user?.systemRole === "admin" || isSuperAdmin;
  const isModerator = user?.systemRole === "moderator" || isAdmin;

  const toggleSection = (key) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Apufunktiot näkyvyyden arviointiin
  const isItemVisible = (item) => {
    // Organisaation hallinta näkyy:
    // - superadmin: aina
    // - admin (systemRole): aina
    // - owner/admin (org_members.role): aina
    if (item.path === "/organization-members") {
      if (isSuperAdmin || user?.systemRole === "admin") return true;
      const orgRole = organization?.role;
      return orgRole === "owner" || orgRole === "admin";
    }
    // Superadmin-only sivut: /admin, /admin-blog
    if (item.superadminOnly && !isSuperAdmin) return false;
    // Moderator tai superadmin only (EI admin)
    if (item.moderatorOrSuperadminOnly) {
      return (
        user?.systemRole === "moderator" || user?.systemRole === "superadmin"
      );
    }
    // Moderator-only sivut (superadmin näkee myös)
    if (item.moderatorOnly && !isSuperAdmin && !isModerator) return false;
    return true;
  };

  // Työkalut - julkiset työkalut
  const publicToolItems = menuItems.filter((i) =>
    ["/ai-chat", "/vastaaja", "/meeting-notes"].includes(i.path),
  );
  const canShowTools = publicToolItems.some(isItemVisible);

  // Ylläpito - admin/moderator-toiminnot
  const adminItems = menuItems.filter((i) =>
    [
      "/admin",
      "/admin-blog",
      "/account-manager",
      "/organization-members",
    ].includes(i.path),
  );
  const canShowAdmin = adminItems.some(isItemVisible);

  // Hae vain logo (roolit tulevat suoraan user.systemRole:sta)
  useEffect(() => {
    if (organization?.data?.logo_url) {
      setLogoUrl(organization.data.logo_url);
    }
  }, [organization]);

  const handleLogout = async () => {
    try {
      console.log("Kirjaudutaan ulos...");
      await signOut();
      console.log("Uloskirjautuminen valmis");
    } catch (error) {
      console.error("signOut error:", error);
    }
  };

  const setLanguage = (lang) => {
    if (lang !== "fi" && lang !== "en") return;
    document.cookie = `rascal.lang=${encodeURIComponent(lang)}; path=/; max-age=31536000`;
    i18n.changeLanguage(lang);
  };

  const menu = (
    <>
      <div className="sidebar-profile-section">
        <div className="sidebar-profile-avatar">
          <img
            src={logoUrl || DEFAULT_LOGO_URL}
            alt={logoUrl ? "Company Logo" : "Rascal AI"}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              borderRadius: "8px",
            }}
            onError={(e) => {
              // Fallback jos logo ei lataudu
              e.target.src = DEFAULT_LOGO_URL;
            }}
          />
        </div>
        {organization?.data?.company_name && (
          <span className="sidebar-company-name">
            {organization.data.company_name}
          </span>
        )}
        <span className="sidebar-profile-name">
          {user?.email || "user@example.com"}
        </span>
        <div className="sidebar-language-selector">
          <button
            className="sidebar-lang-btn"
            type="button"
            onClick={() => setLanguage("fi")}
          >
            {t("lang.shortFi")}
          </button>
          <span className="sidebar-lang-separator">/</span>
          <button
            className="sidebar-lang-btn"
            type="button"
            onClick={() => setLanguage("en")}
          >
            {t("lang.shortEn")}
          </button>
        </div>
        <div className="sidebar-notification-bell-wrapper">
          <NotificationBell />
        </div>
      </div>
      {/* Dashboard */}
      <ul className="sidebar-nav-menu">
        {menuItems
          .filter((i) => i.path === "/dashboard")
          .map((item) => {
            const adminOnly = item.adminOnly && !isAdmin;
            const moderatorOnly = item.moderatorOnly && !isModerator;
            if (adminOnly || moderatorOnly) return null;
            return (
              <li className="sidebar-nav-item" key={item.path}>
                <button
                  className={`sidebar-nav-link ${location.pathname.startsWith(item.path) ? "active" : ""}`}
                  onClick={() => navigate(item.path)}
                >
                  <span className="sidebar-nav-icon">{item.icon}</span>
                  {item.label}
                </button>
              </li>
            );
          })}
      </ul>

      {/* Markkinointi */}
      <button
        className="sidebar-section-header"
        onClick={() => toggleSection("markkinointi")}
        type="button"
      >
        <span>{t("sidebar.sections.marketing")}</span>
        <span
          className={`sidebar-chevron ${openSections.markkinointi ? "open" : ""}`}
        >
          ▾
        </span>
      </button>
      {openSections.markkinointi && (
        <ul className="sidebar-nav-menu">
          {menuItems
            .filter((i) =>
              [
                "/posts",
                "/blog-newsletter",
                "/strategy",
                "/monitoring",
              ].includes(i.path),
            )
            .map((item) => {
              const adminOnly = item.adminOnly && !isAdmin;
              const moderatorOnly = item.moderatorOnly && !isModerator;
              if (adminOnly || moderatorOnly) return null;
              // Feature-gating: Markkinointi
              if (item.path === "/posts" && !hasFeature("Social Media"))
                return null;
              if (
                item.path === "/blog-newsletter" &&
                !hasFeature("Email marketing integration")
              )
                return null;
              if (
                item.path === "/strategy" &&
                !hasFeature("Marketing assistant")
              )
                return null;
              if (
                item.path === "/monitoring" &&
                !hasFeature("Media Monitoring")
              )
                return null;
              return (
                <li className="sidebar-nav-item" key={item.path}>
                  <button
                    className={`sidebar-nav-link ${location.pathname.startsWith(item.path) ? "active" : ""}`}
                    onClick={() => navigate(item.path)}
                  >
                    <span className="sidebar-nav-icon">{item.icon}</span>
                    {item.label}
                  </button>
                </li>
              );
            })}
        </ul>
      )}

      {/* Myynti */}
      <button
        className="sidebar-section-header"
        onClick={() => toggleSection("myynti")}
        type="button"
      >
        <span>{t("sidebar.sections.sales")}</span>
        <span
          className={`sidebar-chevron ${openSections.myynti ? "open" : ""}`}
        >
          ▾
        </span>
      </button>
      {openSections.myynti && (
        <ul className="sidebar-nav-menu">
          {menuItems
            .filter((i) =>
              ["/campaigns", "/calls", "/lead-scraping"].includes(
                i.path,
              ),
            )
            .map((item) => {
              const adminOnly = item.adminOnly && !isAdmin;
              const moderatorOnly = item.moderatorOnly && !isModerator;
              if (adminOnly || moderatorOnly) return null;
              // Feature-gating: Myynti
              if (item.path === "/campaigns" && !hasFeature("Campaigns"))
                return null;
              if (item.path === "/calls" && !hasFeature("Phone Calls"))
                return null;
              if (item.path === "/lead-scraping" && !hasFeature("Leads"))
                return null;
              return (
                <li className="sidebar-nav-item" key={item.path}>
                  <button
                    className={`sidebar-nav-link ${location.pathname.startsWith(item.path) ? "active" : ""}`}
                    onClick={() => navigate(item.path)}
                  >
                    <span className="sidebar-nav-icon">{item.icon}</span>
                    {item.label}
                  </button>
                </li>
              );
            })}
        </ul>
      )}

      {/* Työkalut */}
      {canShowTools && (
        <>
          <button
            className="sidebar-section-header"
            onClick={() => toggleSection("tyokalut")}
            type="button"
          >
            <span>{t("sidebar.sections.tools")}</span>
            <span
              className={`sidebar-chevron ${openSections.tyokalut ? "open" : ""}`}
            >
              ▾
            </span>
          </button>
          {openSections.tyokalut && (
            <ul className="sidebar-nav-menu">
              {publicToolItems.filter(isItemVisible).map((item) => {
                // Feature-gating: tarkista kaikille kohteille joilla on feature-kenttä
                if (item.feature && !hasFeature(item.feature)) {
                  return null;
                }
                return (
                  <li className="sidebar-nav-item" key={item.path}>
                    <button
                      className={`sidebar-nav-link ${location.pathname.startsWith(item.path) ? "active" : ""}`}
                      onClick={() => navigate(item.path)}
                    >
                      <span className="sidebar-nav-icon">{item.icon}</span>
                      {item.label}
                    </button>
                  </li>
                );
              })}
              {/* Sivustorakentaja */}
              {hasFeature("sitebuilder") && <OpenBuilderButton />}
            </ul>
          )}
        </>
      )}

      {/* Ylläpito */}
      {canShowAdmin && (
        <>
          <button
            className="sidebar-section-header"
            onClick={() => toggleSection("yllapito")}
            type="button"
          >
            <span>{t("sidebar.sections.admin")}</span>
            <span
              className={`sidebar-chevron ${openSections.yllapito ? "open" : ""}`}
            >
              ▾
            </span>
          </button>
          {openSections.yllapito && (
            <ul className="sidebar-nav-menu">
              {adminItems.filter(isItemVisible).map((item) => (
                <li className="sidebar-nav-item" key={item.path}>
                  <button
                    className={`sidebar-nav-link ${location.pathname.startsWith(item.path) ? "active" : ""}`}
                    onClick={() => navigate(item.path)}
                  >
                    <span className="sidebar-nav-icon">{item.icon}</span>
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
      <div className="sidebar-settings-section">
        <button
          className="sidebar-nav-link"
          onClick={() => navigate("/help")}
        >
          <span className="sidebar-nav-icon">
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
          </span>
          {t("sidebar.helpCenter")}
        </button>
        <button
          className="sidebar-nav-link"
          onClick={() => navigate("/settings")}
        >
          <span className="sidebar-nav-icon">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M19.4 15C19.2669 15.3016 19.2272 15.6362 19.286 15.9606C19.3448 16.285 19.4995 16.5843 19.73 16.82L19.79 16.88C19.976 17.0657 20.1235 17.2863 20.2241 17.5291C20.3248 17.7719 20.3766 18.0322 20.3766 18.295C20.3766 18.5578 20.3248 18.8181 20.2241 19.0609C20.1235 19.3037 19.976 19.5243 19.79 19.71C19.6043 19.896 19.3837 20.0435 19.1409 20.1441C18.8981 20.2448 18.6378 20.2966 18.375 20.2966C18.1122 20.2966 17.8519 20.2448 17.6091 20.1441C17.3663 20.0435 17.1457 19.896 16.96 19.71L16.9 19.65C16.6643 19.4195 16.365 19.2648 16.0406 19.206C15.7162 19.1472 15.3816 19.1869 15.08 19.32C14.7842 19.4468 14.532 19.6572 14.3543 19.9255C14.1766 20.1938 14.0813 20.5082 14.08 20.83V21C14.08 21.5304 13.8693 22.0391 13.4942 22.4142C13.1191 22.7893 12.6104 23 12.08 23C11.5496 23 11.0409 22.7893 10.6658 22.4142C10.2907 22.0391 10.08 21.5304 10.08 21V20.91C10.0723 20.579 9.96512 20.257 9.77251 19.9887C9.5799 19.7204 9.31074 19.5206 9 19.41C8.69838 19.2994 8.36381 19.2818 8.03941 19.3594C7.71502 19.437 7.41471 19.6066 7.18 19.85L7.12 19.91C6.936 20.0937 6.71547 20.2401 6.47275 20.3398C6.23004 20.4395 5.97033 20.4903 5.708 20.49C5.44567 20.49 5.18596 20.4395 4.94325 20.3398C4.70053 20.2401 4.47997 20.0937 4.296 19.91C4.11233 19.7263 3.96588 19.5058 3.86619 19.2631C3.7665 19.0204 3.71567 18.7607 3.71567 18.498C3.71567 18.2353 3.7665 17.9756 3.86619 17.7329C3.96588 17.4902 4.11233 17.2697 4.296 17.086L4.356 17.026C4.5995 16.792 4.75437 16.4907 4.81243 16.1663C4.87049 15.8419 4.82912 15.5073 4.694 15.2C4.57403 14.9248 4.38131 14.6902 4.13438 14.5198C3.88745 14.3494 3.59556 14.2499 3.29 14.23H3C2.46957 14.23 1.96086 14.0193 1.58579 13.6442C1.21071 13.2691 1 12.7604 1 12.23C1 11.6996 1.21071 11.1909 1.58579 10.8158C1.96086 10.4407 2.46957 10.23 3 10.23H3.29C3.59556 10.2101 3.88745 10.1106 4.13438 9.94019C4.38131 9.76978 4.57403 9.53519 4.694 9.26C4.82912 8.95266 4.87049 8.61805 4.81243 8.29364C4.75437 7.96923 4.5995 7.66797 4.356 7.434L4.296 7.374C4.11233 7.19033 3.96588 6.9698 3.86619 6.7271C3.7665 6.48439 3.71567 6.22468 3.71567 5.962C3.71567 5.69932 3.7665 5.43961 3.86619 5.1969C3.96588 4.95419 4.11233 4.73366 4.296 4.55L4.356 4.49C4.5995 4.2565 4.75437 3.95523 4.81243 3.63082C4.87049 3.30641 4.82912 2.9718 4.694 2.664C4.57403 2.38878 4.38131 2.15418 4.13438 1.98378C3.88745 1.81337 3.59556 1.71387 3.29 1.694H3C2.46957 1.694 1.96086 1.48329 1.58579 1.10822C1.21071 0.733141 1 0.224428 1 0C1 0.530428 1.21071 1.03914 1.58579 1.41421C1.96086 1.78929 2.46957 2 3 2H3.29C3.59556 2.01987 3.88745 2.11937 4.13438 2.28978C4.38131 2.46018 4.57403 2.69478 4.694 2.97C4.82912 3.27734 4.87049 3.61195 4.81243 3.93636C4.75437 4.26077 4.5995 4.56203 4.356 4.796L4.296 4.856C4.11233 5.03967 3.96588 5.2602 3.86619 5.5029C3.7665 5.74561 3.71567 6.00532 3.71567 6.268C3.71567 6.53068 3.7665 6.79039 3.86619 7.0331C3.96588 7.2758 4.11233 7.49633 4.296 7.68L4.356 7.74C4.5995 7.9735 4.75437 8.27477 4.81243 8.59918C4.87049 8.92359 4.82912 9.2582 4.694 9.566C4.57403 9.84122 4.38131 10.0758 4.13438 10.2462C3.88745 10.4166 3.59556 10.5161 3.29 10.536H3C2.46957 10.536 1.96086 10.3253 1.58579 9.95021C1.21071 9.57514 1 9.06643 1 8.536C1 8.00557 1.21071 7.49686 1.58579 7.12179C1.96086 6.74671 2.46957 6.536 3 6.536H3.29C3.59556 6.55687 3.88745 6.65637 4.13438 6.82678C4.38131 6.99718 4.57403 7.23178 4.694 7.507C4.82912 7.81434 4.87049 8.14895 4.81243 8.47336C4.75437 8.79777 4.5995 9.09903 4.356 9.333L4.296 9.393C4.11233 9.57667 3.96588 9.7972 3.86619 10.0399C3.7665 10.2826 3.71567 10.5423 3.71567 10.805C3.71567 11.0677 3.7665 11.3274 3.86619 11.5701C3.96588 11.8128 4.11233 12.0333 4.296 12.217L4.356 12.277C4.5995 12.5105 4.75437 12.8118 4.81243 13.1362C4.87049 13.4606 4.82912 13.7952 4.694 14.103C4.57403 14.3782 4.38131 14.6128 4.13438 14.7832C3.88745 14.9536 3.59556 15.0531 3.29 15.073H3C2.46957 15.073 1.96086 14.8623 1.58579 14.4872C1.21071 14.1121 1 13.6034 1 13.073C1 12.5426 1.21071 12.0339 1.58579 11.6588C1.96086 11.2837 2.46957 11.073 3 11.073H3.29C3.59556 11.0939 3.88745 11.1934 4.13438 11.3638C4.38131 11.5342 4.57403 11.7688 4.694 12.044C4.82912 12.3513 4.87049 12.6859 4.81243 13.0103C4.75437 13.3347 4.5995 13.636 4.356 13.87L4.356 13.87Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          {t("sidebar.settings")}
        </button>
        <button
          onClick={handleLogout}
          className="sidebar-logout-btn"
          type="button"
        >
          <span className="sidebar-nav-icon">
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
          </span>
          {t("sidebar.logout")}
        </button>
      </div>
    </>
  );

  const [isCollapsed, setIsCollapsed] = useState(true);

  // Update CSS variable when sidebar collapses/expands
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--sidebar-width",
      isCollapsed ? "70px" : "250px",
    );
  }, [isCollapsed]);

  return (
    <>
      {/* Desktop sidebar - näytetään vain desktopilla */}
      <div
        className={`sidebar ${isCollapsed ? "collapsed" : ""}`}
        onMouseEnter={() => setIsCollapsed(false)}
        onMouseLeave={() => setIsCollapsed(true)}
      >
        {menu}
      </div>

      <TicketButton />
    </>
  );
}
