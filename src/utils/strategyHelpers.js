// Helper functions for ContentStrategyPage

export const ENGLISH_MONTH_NAMES = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];

export const FINNISH_MONTH_NAMES = [
  "tammikuu",
  "helmikuu",
  "maaliskuu",
  "huhtikuu",
  "toukokuu",
  "kesäkuu",
  "heinäkuu",
  "elokuu",
  "syyskuu",
  "lokakuu",
  "marraskuu",
  "joulukuu",
];

export const getStrategyStatus = (month) => {
  if (!month || typeof month !== "string") return "upcoming";

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const trimmed = month.trim();

  // Handle ISO date format (e.g., "2025-02-01T00:00:00")
  const datePart = trimmed.includes("T") ? trimmed.split("T")[0] : trimmed;
  const parts = datePart.split("-");

  if (parts.length < 2) return "upcoming";

  const year = parseInt(parts[0], 10);
  const monthNum = parseInt(parts[1], 10);

  if (isNaN(year) || isNaN(monthNum)) return "upcoming";

  if (year < currentYear || (year === currentYear && monthNum < currentMonth)) {
    return "old";
  } else if (year === currentYear && monthNum === currentMonth) {
    return "current";
  } else {
    return "upcoming";
  }
};

export const getStatusColor = (status) => {
  switch (status) {
    case "current":
      return "#3b82f6"; // blue-500
    case "upcoming":
      return "#8b5cf6"; // violet-500
    case "old":
      return "#6b7280"; // gray-500
    default:
      return "#6b7280";
  }
};

export const getStatusText = (status, t) => {
  switch (status) {
    case "current":
      return t("strategy.status.current");
    case "upcoming":
      return t("strategy.status.upcoming");
    case "old":
      return t("strategy.status.old");
    default:
      return "";
  }
};

export const formatMonth = (month) => {
  if (!month) return "";

  // Handle ISO date format (e.g., "2025-02-01T00:00:00")
  const datePart = month.includes("T") ? month.split("T")[0] : month;
  const parts = datePart.split("-");
  if (parts.length < 2) return month;

  const [year, monthNum] = parts;
  const monthIndex = parseInt(monthNum, 10) - 1;

  if (isNaN(monthIndex) || monthIndex < 0 || monthIndex > 11) return month;

  const monthNames = [
    "Tammikuu",
    "Helmikuu",
    "Maaliskuu",
    "Huhtikuu",
    "Toukokuu",
    "Kesäkuu",
    "Heinäkuu",
    "Elokuu",
    "Syyskuu",
    "Lokakuu",
    "Marraskuu",
    "Joulukuu",
  ];

  const monthNamesEn = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const locale = document.documentElement.lang || "fi";
  const names = locale === "en" ? monthNamesEn : monthNames;

  return `${names[monthIndex]} ${year}`;
};

export const findStrategyByMonthAndYear = (strategies, month, year) => {
  if (!strategies || strategies.length === 0) return null;

  const targetMonthName = ENGLISH_MONTH_NAMES[month];
  const targetMonthNameFi = FINNISH_MONTH_NAMES[month];

  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);

  return (
    strategies.find((strategy) => {
      if (strategy?.target_month) {
        const targetDate = new Date(strategy.target_month);
        return targetDate >= monthStart && targetDate <= monthEnd;
      }

      if (!strategy?.month) return false;

      const monthLower = String(strategy.month).toLowerCase();
      const hasMonth =
        monthLower.includes(targetMonthName) || monthLower.includes(targetMonthNameFi);

      // Vanhat strategiat voivat olla ilman vuotta -> hyväksy jos kuukausi täsmää
      return hasMonth;
    }) || null
  );
};

export const findNextMonthStrategy = (strategies, month, year) => {
  if (!strategies || strategies.length === 0) return null;

  const nextMonthName = ENGLISH_MONTH_NAMES[month];
  const nextMonthNameFi = FINNISH_MONTH_NAMES[month];

  return (
    strategies.find((strategy) => {
      if (!strategy?.month) return false;

      const monthLower = String(strategy.month).toLowerCase();
      const hasMonth =
        monthLower.includes(nextMonthName) || monthLower.includes(nextMonthNameFi);
      const hasYear = monthLower.includes(String(year));

      return hasMonth && hasYear;
    }) || null
  );
};

export const calculateMonthlyLimit = (subscriptionStatus) => {
  const status = String(subscriptionStatus || "free").toLowerCase();

  switch (status) {
    case "enterprise":
      return 999999;
    case "pro":
      return 100;
    default:
      return 30;
  }
};
