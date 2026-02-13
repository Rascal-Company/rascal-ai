import React, { useMemo, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { useToast } from "../contexts/ToastContext";
import Button from "./Button";

export default function PostsCalendar({
  items = [],
  onEventClick,
  readyPosts = [],
  onSchedulePost,
  socialAccounts = [],
  selectedAccounts = [],
  setSelectedAccounts,
  loadingAccounts = false,
  onFetchSocialAccounts,
  onRefresh,
  refreshing = false,
  onReschedulePost,
}) {
  const { t, i18n } = useTranslation("common");
  const currentLang = i18n.language || "fi";
  const dateLocale = currentLang.startsWith("fi") ? "fi-FI" : "en-US";
  const toast = useToast();

  // Drag-and-drop states
  const [draggedEvent, setDraggedEvent] = useState(null);
  const [dragOverDate, setDragOverDate] = useState(null);

  // Mobile states
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 768 : false,
  );
  const [isLandscape, setIsLandscape] = useState(() =>
    typeof window !== "undefined"
      ? window.innerWidth < 768 && window.innerWidth > window.innerHeight
      : false,
  );

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setIsLandscape(mobile && window.innerWidth > window.innerHeight);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [viewType, setViewType] = useState("month");

  useEffect(() => {
    if (isMobile) {
      setViewType(isLandscape ? "week" : "day");
    }
  }, [isMobile, isLandscape]);

  const [current, setCurrent] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [hoveredDate, setHoveredDate] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [selectedTime, setSelectedTime] = useState("12:00");

  const { monthLabel, weeks, weekLabel } = useMemo(() => {
    const eventsByDate = new Map();
    for (const item of items) {
      if (!item.dateKey) continue;
      if (!eventsByDate.has(item.dateKey)) eventsByDate.set(item.dateKey, []);
      eventsByDate.get(item.dateKey).push(item);
    }

    if (viewType === "day") {
      const now = new Date(current);
      const yyyy = String(now.getFullYear());
      const mm = String(now.getMonth() + 1).padStart(2, "0");
      const dd = String(now.getDate()).padStart(2, "0");
      const key = `${yyyy}-${mm}-${dd}`;
      const dayFormatter = new Intl.DateTimeFormat(dateLocale, {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      const dayLabelLocal = dayFormatter.format(now);
      const dayCell = {
        day: now.getDate(),
        key,
        events: eventsByDate.get(key) || [],
        date: new Date(now),
      };
      return {
        monthLabel: dayLabelLocal,
        weekLabel: dayLabelLocal,
        weeks: [[dayCell]],
      };
    } else if (viewType === "week") {
      const now = new Date(current);
      const dayOfWeek = (now.getDay() + 6) % 7;
      const monday = new Date(now);
      monday.setDate(now.getDate() - dayOfWeek);
      const weekCells = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(monday);
        date.setDate(monday.getDate() + i);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
        weekCells.push({
          day: date.getDate(),
          key,
          events: eventsByDate.get(key) || [],
          date: new Date(date),
        });
      }
      const weekFormatter = new Intl.DateTimeFormat(dateLocale, {
        day: "numeric",
        month: "long",
      });
      const weekLabelLocal = `${weekFormatter.format(monday)} - ${weekFormatter.format(new Date(monday.getTime() + 6 * 24 * 60 * 60 * 1000))}`;
      return {
        monthLabel: weekLabelLocal,
        weekLabel: weekLabelLocal,
        weeks: [weekCells],
      };
    } else {
      const monthFormatter = new Intl.DateTimeFormat(dateLocale, {
        month: "long",
        year: "numeric",
      });
      const monthLabelLocal = monthFormatter.format(current);
      const firstDayOfMonth = new Date(
        current.getFullYear(),
        current.getMonth(),
        1,
      );
      const lastDayOfMonth = new Date(
        current.getFullYear(),
        current.getMonth() + 1,
        0,
      );
      const startOffset = (firstDayOfMonth.getDay() + 6) % 7;
      const totalDays = lastDayOfMonth.getDate();
      const cells = [];

      const prevMonthLastDay = new Date(
        current.getFullYear(),
        current.getMonth(),
        0,
      ).getDate();
      for (let i = startOffset - 1; i >= 0; i--) {
        const d = prevMonthLastDay - i;
        const date = new Date(current.getFullYear(), current.getMonth() - 1, d);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
        cells.push({
          day: d,
          key,
          events: eventsByDate.get(key) || [],
          isCurrentMonth: false,
        });
      }

      for (let d = 1; d <= totalDays; d++) {
        const date = new Date(current.getFullYear(), current.getMonth(), d);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        cells.push({
          day: d,
          key,
          events: eventsByDate.get(key) || [],
          isCurrentMonth: true,
        });
      }

      let nextDay = 1;
      while (cells.length % 7 !== 0) {
        const date = new Date(
          current.getFullYear(),
          current.getMonth() + 1,
          nextDay,
        );
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(nextDay).padStart(2, "0")}`;
        cells.push({
          day: nextDay,
          key,
          events: eventsByDate.get(key) || [],
          isCurrentMonth: false,
        });
        nextDay++;
      }
      const weeksLocal = [];
      for (let i = 0; i < cells.length; i += 7)
        weeksLocal.push(cells.slice(i, i + 7));
      return {
        monthLabel: monthLabelLocal,
        weekLabel: monthLabelLocal,
        weeks: weeksLocal,
      };
    }
  }, [current, items, viewType]);

  const todayKey = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  }, []);

  const mobileMonthDays = useMemo(() => {
    if (viewType !== "month") return [];
    return weeks
      .flat()
      .filter((cell) => cell && cell.isCurrentMonth !== false)
      .sort((a, b) => a.day - b.day);
  }, [weeks, viewType]);

  const goPrev = () => {
    setCurrent((prev) => {
      const d = new Date(prev);
      if (viewType === "day") d.setDate(d.getDate() - 1);
      else if (viewType === "week") d.setDate(d.getDate() - 7);
      else d.setMonth(d.getMonth() - 1);
      return d;
    });
  };
  const goNext = () => {
    setCurrent((prev) => {
      const d = new Date(prev);
      if (viewType === "day") d.setDate(d.getDate() + 1);
      else if (viewType === "week") d.setDate(d.getDate() + 7);
      else d.setMonth(d.getMonth() + 1);
      return d;
    });
  };
  const goToday = () => {
    const now = new Date();
    setCurrent(
      viewType === "month"
        ? new Date(now.getFullYear(), now.getMonth(), 1)
        : now,
    );
  };

  const handleDateClick = (dateKey, time = null) => {
    if (readyPosts.length === 0) return;
    setSelectedPost({ dateKey });
    // Set time if provided, otherwise keep default
    if (time) {
      setSelectedTime(time);
    } else {
      setSelectedTime("12:00");
    }
    setShowScheduleModal(true);
  };

  const handleTimeSlotClick = (e, dateKey, hour) => {
    e.stopPropagation();
    const timeString = `${hour.toString().padStart(2, "0")}:00`;
    handleDateClick(dateKey, timeString);
  };

  const handlePostSelect = (post) => {
    setSelectedPost((prev) => ({ ...prev, post }));
    setShowScheduleModal(false);
    setShowTimeModal(true);
    // Don't reset selectedTime here - preserve the time that was clicked
    // Only set default if no time was previously selected
    setSelectedTime((prev) => prev || "12:00");
    if (setSelectedAccounts) setSelectedAccounts([]);
    if (onFetchSocialAccounts) onFetchSocialAccounts();
  };

  const toggleAccount = (accountId) => {
    if (!setSelectedAccounts) return;
    setSelectedAccounts((prev) =>
      prev.includes(accountId)
        ? prev.filter((id) => id !== accountId)
        : [...prev, accountId],
    );
  };

  const handleConfirmSchedule = () => {
    if (onSchedulePost && selectedPost) {
      const { post, dateKey } = selectedPost;
      if (!selectedAccounts || selectedAccounts.length === 0) {
        toast.warning(t("posts.alerts.selectAtLeastOne"));
        return;
      }
      const [year, month, day] = dateKey.split("-");
      const [hours, minutes] = selectedTime.split(":");
      const localDate = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hours),
        parseInt(minutes),
      );
      // Helsinki Offset Handling
      const helsinkiTime = new Date(
        localDate.toLocaleString("en-US", { timeZone: "Europe/Helsinki" }),
      );
      const utcTime = new Date(
        localDate.toLocaleString("en-US", { timeZone: "UTC" }),
      );
      const offset = helsinkiTime.getTime() - utcTime.getTime();
      const utcDate = new Date(localDate.getTime() - offset);
      onSchedulePost(
        post,
        utcDate.toISOString().slice(0, 16),
        selectedAccounts,
      );
    }
    setShowTimeModal(false);
    setSelectedPost(null);
    if (setSelectedAccounts) setSelectedAccounts([]);
  };

  // Drag-and-drop handlers
  const handleEventDragStart = (e, event) => {
    setDraggedEvent(event);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", e.target);
    // Add slight opacity to the dragged element
    e.target.style.opacity = "0.4";
  };

  const handleEventDragEnd = (e) => {
    e.target.style.opacity = "1";
    setDraggedEvent(null);
    setDragOverDate(null);
  };

  const handleCellDragOver = (e, dateKey) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverDate(dateKey);
  };

  const handleCellDragLeave = () => {
    setDragOverDate(null);
  };

  const handleCellDrop = async (e, targetDateKey) => {
    e.preventDefault();
    setDragOverDate(null);

    if (!draggedEvent || !onReschedulePost) {
      setDraggedEvent(null);
      return;
    }

    // Don't do anything if dropped on same date
    if (draggedEvent.dateKey === targetDateKey) {
      setDraggedEvent(null);
      return;
    }

    // Parse the target date and keep the original time
    const [year, month, day] = targetDateKey.split("-");
    const originalTime = draggedEvent.time || "12:00";
    const [hours, minutes] = originalTime.split(":");

    const localDate = new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hours),
      parseInt(minutes),
    );

    // Helsinki Offset Handling
    const helsinkiTime = new Date(
      localDate.toLocaleString("en-US", { timeZone: "Europe/Helsinki" }),
    );
    const utcTime = new Date(
      localDate.toLocaleString("en-US", { timeZone: "UTC" }),
    );
    const offset = helsinkiTime.getTime() - utcTime.getTime();
    const utcDate = new Date(localDate.getTime() - offset);

    try {
      await onReschedulePost(draggedEvent, utcDate.toISOString().slice(0, 16));
      toast.success(t("calendar.alerts.rescheduled") || "Julkaisu siirretty");
    } catch (error) {
      toast.error(
        t("calendar.alerts.rescheduleFailed") || "Siirto epäonnistui",
      );
    }

    setDraggedEvent(null);
  };

  const weekdayLabels = ["Ma", "Ti", "Ke", "To", "Pe", "La", "Su"];

  // Helper function to calculate event position based on time
  const getEventTimePosition = (timeString) => {
    if (!timeString) return 50; // Default to middle of day if no time
    const [hours, minutes] = timeString.split(":").map(Number);
    // Calculate percentage of day (0% = 00:00, 100% = 24:00)
    return ((hours + minutes / 60) / 24) * 100;
  };

  // Generate hourly time slots
  const timeSlots = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, "0");
    return `${hour}:00`;
  });

  const getEventStyles = (channel) => {
    const c = channel?.toLowerCase() || "";
    if (c === "instagram")
      return "bg-rose-50 border-rose-100 text-rose-700 hover:bg-rose-100 hover:border-rose-200";
    if (c === "facebook")
      return "bg-blue-50 border-blue-100 text-blue-700 hover:bg-blue-100 hover:border-blue-200";
    if (c === "tiktok")
      return "bg-gray-900 border-gray-800 text-white hover:bg-black hover:border-black";
    if (c === "linkedin")
      return "bg-indigo-50 border-indigo-100 text-indigo-700 hover:bg-indigo-100 hover:border-indigo-200";
    if (c === "reels")
      return "bg-fuchsia-50 border-fuchsia-100 text-fuchsia-700 hover:bg-fuchsia-100 hover:border-fuchsia-200";
    return "bg-gray-50 border-gray-100 text-gray-700 hover:bg-gray-100 hover:border-gray-200";
  };

  return (
    <div className="bg-white rounded-[40px] border border-gray-100 shadow-[0_32px_96px_-16px_rgba(0,0,0,0.06)] overflow-hidden flex flex-col">
      {/* Premium Header */}
      <div className="calendar-header p-4 pt-6 sm:p-6 md:p-10 border-b border-gray-50 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 sm:gap-6 bg-gradient-to-br from-white to-gray-50/30">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6 w-full md:flex-1 md:min-w-0 md:grid md:grid-cols-[minmax(0,1fr)_220px] md:items-center">
          <div className="calendar-period-block flex flex-col min-w-0 pl-2 sm:pl-0">
            <h2 className="calendar-period-label text-lg sm:text-2xl font-black text-gray-900 md:tracking-tight capitalize leading-[1.45] pt-1 md:pt-0 break-words">
              {monthLabel}
            </h2>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1">
              {t("calendar.title")}
            </p>
          </div>

          <div className="calendar-nav-controls inline-flex items-center justify-center bg-gray-100/80 p-1 rounded-2xl w-auto md:w-[220px] md:flex-shrink-0">
            <button
              onClick={goPrev}
              className="p-2.5 hover:bg-white hover:shadow-sm rounded-xl transition-all text-gray-500 hover:text-gray-900"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <button
              onClick={goToday}
              className="calendar-today-btn px-2.5 sm:px-4 py-2.5 text-[10px] font-black uppercase tracking-wide sm:tracking-widest text-gray-500 hover:text-gray-900 transition-colors whitespace-nowrap mx-0.5"
            >
              {t("calendar.today")}
            </button>
            <button
              onClick={goNext}
              className="p-2.5 hover:bg-white hover:shadow-sm rounded-xl transition-all text-gray-500 hover:text-gray-900"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="calendar-controls-row flex items-center justify-between md:justify-end gap-3 w-full md:w-auto">
          {!isMobile && (
            <div className="flex p-1 bg-gray-100/80 rounded-2xl mr-4">
              {["month", "week", "day"].map((type) => (
                <button
                  key={type}
                  onClick={() => setViewType(type)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    viewType === type
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  {type === "month"
                    ? t("calendar.view.month")
                    : type === "week"
                      ? t("calendar.view.week")
                      : t("calendar.view.day")}
                </button>
              ))}
            </div>
          )}

          {isMobile && (
            <div className="calendar-mobile-view-switch flex p-1 bg-gray-100/80 rounded-2xl flex-1 min-w-0 mx-2">
              {["month", "week", "day"].map((type) => (
                <button
                  key={type}
                  onClick={() => setViewType(type)}
                  className={`flex-1 px-2 py-2 rounded-xl text-[10px] font-black uppercase tracking-wide transition-all ${
                    viewType === type
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  {type === "month"
                    ? t("calendar.view.month")
                    : type === "week"
                      ? t("calendar.view.week")
                      : t("calendar.view.day")}
                </button>
              ))}
            </div>
          )}

          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={refreshing}
              className="calendar-refresh-btn p-2.5 sm:p-3 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all text-gray-400 hover:text-blue-500 disabled:opacity-50 mr-2"
            >
              <svg
                className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="p-4 sm:p-6 md:p-8 bg-gray-50/20">
        {/* Time-grid layout for week and day views */}
        {(viewType === "week" || viewType === "day") && (
          <div className="calendar-time-layout flex gap-0 max-h-[600px] overflow-y-auto custom-scrollbar px-3 sm:px-0">
            {/* Time labels column - sticky */}
            <div className="calendar-time-label-col w-16 flex-shrink-0 sticky left-0 bg-gray-50/20 z-10 relative">
              <div className="h-12 border-b border-gray-200 sticky top-0 bg-gray-50/90 backdrop-blur-sm z-20" />{" "}
              {/* Header spacing */}
              <div className="relative" style={{ height: "1152px" }}>
                {timeSlots.map((time, idx) => (
                  <div
                    key={time}
                    className="absolute right-0 pr-2 text-[9px] font-bold text-gray-400"
                    style={{ top: `${idx * 48 - 6}px` }}
                  >
                    {time}
                  </div>
                ))}
              </div>
            </div>

            {/* Days columns */}
            <div className="calendar-time-days flex-1 flex gap-2">
              {weeks[0]?.map((cell, ci) => {
                const isToday = cell?.key === todayKey;
                const isDragOver = dragOverDate === cell?.key;

                return (
                  <div key={cell?.key || ci} className="flex-1 flex flex-col">
                    {/* Day header - sticky */}
                    <div className="h-12 flex flex-col items-center justify-center border-b border-gray-200 mb-1 sticky top-0 bg-gray-50/90 backdrop-blur-sm z-20">
                      <span className="text-[10px] font-black text-gray-400 uppercase">
                        {weekdayLabels[ci]}
                      </span>
                      <span
                        className={`text-sm font-black ${isToday ? "text-blue-600" : "text-gray-900"}`}
                      >
                        {cell?.day}
                      </span>
                    </div>

                    {/* Time grid */}
                    <div
                      className={`relative border-l border-gray-100 ${
                        isDragOver && draggedEvent
                          ? "bg-blue-50/30 border-blue-200"
                          : ""
                      }`}
                      style={{ height: "1152px" }} // 24 hours * 48px per hour
                      onDragOver={(e) =>
                        cell && handleCellDragOver(e, cell.key)
                      }
                      onDragLeave={handleCellDragLeave}
                      onDrop={(e) => cell && handleCellDrop(e, cell.key)}
                    >
                      {/* Hour lines with clickable slots */}
                      {timeSlots.map((time, idx) => (
                        <div
                          key={time}
                          className="absolute left-0 right-0 h-12 border-t border-gray-100 hover:bg-blue-50/20 cursor-pointer transition-colors group/timeslot"
                          style={{ top: `${idx * 48}px` }}
                          onClick={(e) => handleTimeSlotClick(e, cell.key, idx)}
                        >
                          <div className="absolute right-1 top-1 opacity-0 group-hover/timeslot:opacity-100 transition-opacity">
                            <svg
                              className="w-3 h-3 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="3"
                                d="M12 4v16m8-8H4"
                              />
                            </svg>
                          </div>
                        </div>
                      ))}

                      {/* Current time indicator */}
                      {isToday &&
                        (() => {
                          const now = new Date();
                          const currentHour = now.getHours();
                          const currentMinute = now.getMinutes();
                          const currentPosition =
                            currentHour * 48 + (currentMinute / 60) * 48;

                          return (
                            <div
                              className="absolute left-0 right-0 border-t-2 border-red-500 z-30"
                              style={{ top: `${currentPosition}px` }}
                            >
                              <div className="absolute -left-1 -top-1 w-2 h-2 bg-red-500 rounded-full" />
                            </div>
                          );
                        })()}

                      {/* Events positioned by time */}
                      {cell?.events.map((ev, idx) => {
                        const [hours, minutes] = (ev.time || "12:00")
                          .split(":")
                          .map(Number);
                        // Calculate position: each hour is 48px (h-12 = 48px)
                        // Position is based on hour + minute fraction
                        const hourPosition = hours * 48;
                        const minutePosition = (minutes / 60) * 48;
                        const topPosition = hourPosition + minutePosition;

                        return (
                          <div
                            key={ev.id || idx}
                            draggable={true}
                            onDragStart={(e) => handleEventDragStart(e, ev)}
                            onDragEnd={handleEventDragEnd}
                            onClick={(e) => {
                              e.stopPropagation();
                              onEventClick?.(ev);
                            }}
                            className={`absolute left-1 right-1 p-1.5 rounded-lg border transition-all cursor-move shadow-sm hover:shadow-lg hover:scale-105 active:cursor-grabbing z-20 ${
                              draggedEvent?.id === ev.id
                                ? "opacity-40 scale-95"
                                : ""
                            } ${getEventStyles(ev.channel || ev.type)}`}
                            style={{
                              top: `${topPosition}px`,
                              height: "40px",
                            }}
                          >
                            <div className="text-[8px] font-black uppercase opacity-70 mb-0.5">
                              {ev.time}
                            </div>
                            <p className="text-[9px] font-bold line-clamp-1 leading-tight">
                              {ev.title}
                            </p>
                          </div>
                        );
                      })}

                      {/* Add button on hover */}
                      {hoveredDate === cell?.key && readyPosts.length > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDateClick(cell.key);
                          }}
                          className="absolute top-2 right-2 w-6 h-6 bg-gray-900 text-white rounded-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-lg z-20"
                        >
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="3"
                              d="M12 4v16m8-8H4"
                            />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Month view */}
        {viewType === "month" && (
          <>
            {isMobile ? (
              <div className="space-y-2">
                {mobileMonthDays.map((cell, idx) => {
                  const isToday = cell.key === todayKey;
                  const dayDate = new Date(cell.key);
                  const weekday = dayDate.toLocaleDateString(dateLocale, {
                    weekday: "short",
                  });

                  return (
                    <button
                      key={cell.key || idx}
                      onClick={() => handleDateClick(cell.key)}
                      className={`w-full text-left p-4 rounded-2xl border transition-all ${
                        isToday
                          ? "bg-blue-50/40 border-blue-200"
                          : "bg-white border-gray-100 hover:border-gray-200"
                      }`}
                    >
                      <div className="calendar-month-day-header flex items-center justify-between gap-3 mb-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black ${
                              isToday
                                ? "bg-blue-600 text-white"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {cell.day}
                          </span>
                          <span className="text-xs font-bold uppercase tracking-wide text-gray-500">
                            {weekday}
                          </span>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-wide text-gray-400">
                          {cell.events.length} {t("calendar.title")}
                        </span>
                      </div>

                      {cell.events.length > 0 ? (
                        <div className="calendar-month-events space-y-1.5">
                          {cell.events.slice(0, 2).map((ev, evIdx) => (
                            <div
                              key={ev.id || evIdx}
                              className={`calendar-month-event-pill p-2 pl-3 rounded-lg border text-[11px] font-semibold line-clamp-1 ${getEventStyles(ev.channel || ev.type)}`}
                            >
                              {ev.time ? `${ev.time} - ` : ""}
                              {ev.title}
                            </div>
                          ))}
                          {cell.events.length > 2 && (
                            <p className="text-[10px] font-bold text-gray-400 pl-1">
                              +{cell.events.length - 2}
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-[11px] text-gray-400 italic">
                          {t("calendar.modals.selectPost.empty")}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-7 mb-4">
                  {weekdayLabels.map((label) => (
                    <div
                      key={label}
                      className="text-center text-[10px] font-black text-gray-400 uppercase tracking-widest py-2"
                    >
                      {label}
                    </div>
                  ))}
                </div>

                <div className="grid gap-3 grid-cols-7">
                  {weeks.map((week, wi) => (
                    <React.Fragment key={wi}>
                      {week.map((cell, ci) => {
                        if (!cell && viewType === "month")
                          return (
                            <div
                              key={`empty-${wi}-${ci}`}
                              className="aspect-[4/5] md:aspect-square"
                            />
                          );

                        const isToday = cell?.key === todayKey;
                        const isSelected = selectedPost?.dateKey === cell?.key;

                        const isDragOver = dragOverDate === cell?.key;

                        return (
                          <div
                            key={cell?.key || ci}
                            onMouseEnter={() => cell && setHoveredDate(cell.key)}
                            onMouseLeave={() => setHoveredDate(null)}
                            onDragOver={(e) =>
                              cell && handleCellDragOver(e, cell.key)
                            }
                            onDragLeave={handleCellDragLeave}
                            onDrop={(e) => cell && handleCellDrop(e, cell.key)}
                            className={`
                      relative group/cell aspect-[4/5] md:aspect-square p-2.5 rounded-[24px] border transition-all duration-500 flex flex-col gap-2 overflow-hidden
                      ${cell?.isCurrentMonth === false ? "bg-transparent border-transparent opacity-30 shadow-none" : "bg-white border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-gray-200/50 hover:-translate-y-1.5"}
                      ${isToday ? "ring-2 ring-blue-500 ring-offset-2" : ""}
                      ${isSelected ? "bg-blue-50/50 border-blue-100" : ""}
                      ${isDragOver && draggedEvent ? "ring-4 ring-blue-500/30 bg-blue-50/30 scale-105 shadow-2xl shadow-blue-500/20" : ""}
                    `}
                      >
                        {cell && (
                          <>
                            <div className="calendar-month-day-header flex justify-between items-center z-10">
                              <span
                                className={`text-[13px] font-black ${isToday ? "text-blue-600" : "text-gray-900 opacity-40"}`}
                              >
                                {cell.day}
                              </span>

                              {hoveredDate === cell.key &&
                                readyPosts.length > 0 && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDateClick(cell.key);
                                    }}
                                    className="w-7 h-7 bg-gray-900 text-white rounded-xl flex items-center justify-center text-sm font-black hover:scale-110 active:scale-95 transition-all shadow-xl shadow-gray-200 animate-in zoom-in duration-300"
                                  >
                                    <svg
                                      className="w-4 h-4"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="3"
                                        d="M12 4v16m8-8H4"
                                      />
                                    </svg>
                                  </button>
                                )}
                            </div>

                            <div className="calendar-month-events flex-1 overflow-y-auto space-y-1.5 no-scrollbar scroll-smooth">
                              {cell.events.map((ev, idx) => (
                                <div
                                  key={ev.id || idx}
                                  draggable={true}
                                  onDragStart={(e) =>
                                    handleEventDragStart(e, ev)
                                  }
                                  onDragEnd={handleEventDragEnd}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onEventClick?.(ev);
                                  }}
                                  className={`calendar-month-event-pill p-2 rounded-lg border transition-all cursor-move group/event shadow-sm hover:shadow-lg hover:scale-[1.02] active:cursor-grabbing ${
                                    draggedEvent?.id === ev.id
                                      ? "opacity-40 scale-95"
                                      : ""
                                  } ${getEventStyles(ev.channel || ev.type)}`}
                                >
                                  <div className="flex items-center justify-between mb-0.5 pointer-events-none">
                                    <span className="text-[8px] font-black uppercase tracking-tight opacity-70">
                                      {ev.time || "Ajaton"}
                                    </span>
                                    {ev.channel && (
                                      <span className="text-[7px] font-black uppercase opacity-60">
                                        {ev.channel}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[10px] font-bold line-clamp-2 leading-tight pointer-events-none">
                                    {ev.title}
                                  </p>
                                </div>
                              ))}
                            </div>

                            {cell.events.length > 3 && viewType !== "day" && (
                              <div className="absolute bottom-2 right-2 text-[8px] font-black text-gray-400 bg-white/80 backdrop-blur-sm px-1.5 py-0.5 rounded-md border border-gray-100">
                                +{cell.events.length - 3}
                              </div>
                            )}
                          </>
                        )}
                          </div>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Modals remain the same but use consistent styles */}
      {showScheduleModal &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 overflow-hidden"
            onClick={() => setShowScheduleModal(false)}
          >
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300" />
            <div
              className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-full animate-in zoom-in-95 duration-500"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                <div className="flex flex-col">
                  <h2 className="text-xl font-black text-gray-900">
                    {t("calendar.modals.selectPost.title")}
                  </h2>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
                    {t("calendar.modals.selectPost.subtitle")}
                  </p>
                </div>
                <button
                  onClick={() => setShowScheduleModal(false)}
                  className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-900 transition-colors"
                >
                  ×
                </button>
              </div>
              <div className="p-8 overflow-y-auto space-y-4">
                {readyPosts.length === 0 ? (
                  <div className="py-12 text-center">
                    <span className="text-4xl block mb-4">📭</span>
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                      {t("calendar.modals.selectPost.empty")}
                    </p>
                  </div>
                ) : (
                  readyPosts.map((post) => (
                    <button
                      key={post.id}
                      onClick={() => handlePostSelect(post)}
                      className="w-full flex items-center gap-6 p-6 bg-white rounded-[32px] border border-gray-100 hover:border-blue-100 hover:shadow-xl hover:shadow-gray-100 transition-all text-left group"
                    >
                      <div className="w-20 h-20 rounded-2xl bg-gray-50 overflow-hidden shrink-0 border border-gray-100">
                        {post.thumbnail ? (
                          <img
                            src={post.thumbnail}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl">
                            🖼️
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-base font-black text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                          {post.title || t("posts.statuses.untitled")}
                        </h4>
                        <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed opacity-60 italic">
                          {post.caption ||
                            t("posts.placeholders.noDescription")}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}

      {showTimeModal &&
        selectedPost?.post &&
        createPortal(
          <div
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-8 overflow-hidden"
            onClick={() => setShowTimeModal(false)}
          >
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300" />
            <div
              className="relative w-full max-w-4xl bg-white rounded-[48px] shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-full animate-in zoom-in-95 duration-500"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-full md:w-5/12 p-10 bg-gray-50/50 border-r border-gray-100 flex flex-col">
                <div className="mb-8">
                  <span className="px-3 py-1 bg-white rounded-full text-[9px] font-black text-gray-400 uppercase tracking-widest border border-gray-100">
                    {t("calendar.modals.schedule.preview")}
                  </span>
                </div>
                <div className="flex-1 flex flex-col gap-6">
                  <div className="aspect-square rounded-[32px] overflow-hidden shadow-2xl shadow-gray-200 border border-white">
                    {selectedPost.post.thumbnail ? (
                      <img
                        src={selectedPost.post.thumbnail}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-white flex items-center justify-center text-4xl text-gray-200">
                        🖼️
                      </div>
                    )}
                  </div>
                  <div className="space-y-4 p-2">
                    <h3 className="text-xl font-black text-gray-900 leading-tight">
                      {selectedPost.post.title || t("posts.statuses.untitled")}
                    </h3>
                    <p className="text-sm text-gray-500 leading-relaxed italic opacity-80 line-clamp-4">
                      "{selectedPost.post.caption}"
                    </p>
                  </div>
                </div>
              </div>

              <div className="w-full md:w-7/12 p-10 flex flex-col overflow-y-auto">
                <div className="flex items-center justify-between mb-10">
                  <div className="flex flex-col">
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                      {t("calendar.modals.schedule.title")}
                    </h2>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
                      {selectedPost.dateKey}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowTimeModal(false)}
                    className="w-10 h-10 hover:bg-gray-50 rounded-full flex items-center justify-center text-gray-400"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-8 flex-1">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />{" "}
                      {t("calendar.modals.schedule.timeLabel")}
                    </label>
                    <input
                      type="time"
                      value={selectedTime}
                      onChange={(e) => setSelectedTime(e.target.value)}
                      className="w-full p-5 bg-gray-50 border-none rounded-2xl text-xl font-black text-gray-900 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />{" "}
                      {t("calendar.modals.schedule.channelsLabel")}
                    </label>
                    <div className="grid grid-cols-1 gap-3 max-h-[240px] overflow-y-auto pr-2 custom-scrollbar">
                      {socialAccounts.map((account) => {
                        const isSelected = selectedAccounts.includes(
                          account.mixpost_account_uuid,
                        );
                        return (
                          <button
                            key={account.mixpost_account_uuid}
                            onClick={() =>
                              toggleAccount(account.mixpost_account_uuid)
                            }
                            className={`flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${
                              isSelected
                                ? "bg-white border-blue-500 shadow-lg shadow-blue-500/10"
                                : "bg-white border-gray-100 hover:border-gray-200"
                            }`}
                          >
                            <div
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? "bg-blue-500 border-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.4)]" : "bg-white border-gray-200"}`}
                            >
                              {isSelected && (
                                <svg
                                  className="w-3 h-3 text-white"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="4"
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              )}
                            </div>
                            {account.profile_image_url && (
                              <img
                                src={account.profile_image_url}
                                className="w-10 h-10 rounded-full shadow-sm"
                              />
                            )}
                            <div className="flex-1">
                              <p className="text-sm font-black text-gray-900">
                                {account.account_name}
                              </p>
                              <p className="text-[10px] font-bold text-gray-400 uppercase">
                                {account.provider}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="mt-10 pt-8 border-t border-gray-50 flex items-center justify-between">
                  <button
                    onClick={() => setShowTimeModal(false)}
                    className="text-[10px] font-black uppercase tracking-widest text-gray-300 hover:text-gray-900 transition-colors"
                  >
                    {t("common.cancel")}
                  </button>
                  <button
                    onClick={handleConfirmSchedule}
                    disabled={!selectedAccounts.length}
                    className="px-10 py-5 bg-gray-900 hover:bg-black text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl shadow-gray-200 hover:-translate-y-1 active:scale-95 transition-all disabled:opacity-20"
                  >
                    {t("calendar.modals.schedule.confirm")}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
