import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { getUserOrgId } from "../lib/getUserOrgId";
import {
  ChatHeader,
  ChatInput,
  ChatMessages,
  ChatSidebar,
} from "../components/ai-chat";

export default function AIChatPage() {
  const { t } = useTranslation("common");
  const [searchParams] = useSearchParams();

  // Pending queue for reliable message delivery
  const PENDING_KEY = "rascalai_pending_msgs";
  const loadPendingQueue = () => {
    try {
      const s = localStorage.getItem(PENDING_KEY);
      return s ? JSON.parse(s) : [];
    } catch {
      return [];
    }
  };
  const savePendingQueue = (q) => {
    try {
      localStorage.setItem(PENDING_KEY, JSON.stringify(q));
    } catch {}
  };
  const pendingQueueRef = useRef(loadPendingQueue());
  const dequeuePending = (id) => {
    pendingQueueRef.current = pendingQueueRef.current.filter(
      (i) => i.id !== id,
    );
    savePendingQueue(pendingQueueRef.current);
  };

  // State
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState("threads");
  const [files, setFiles] = useState([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [filesError, setFilesError] = useState("");
  const [threadId, setThreadId] = useState(
    () => localStorage.getItem("rascalai_threadId") || null,
  );
  const [assistantType, setAssistantType] = useState("marketing");
  const [threads, setThreads] = useState([]);
  const [threadsLoading, setThreadsLoading] = useState(false);
  const [currentThreadId, setCurrentThreadId] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");
  const [pendingFiles, setPendingFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);

  const { user, organization } = useAuth();
  const sendingRef = useRef(false);
  const pollingIntervalRef = useRef(null);
  const lastMessageCountRef = useRef(0);
  const lastAssistantMessageRef = useRef(null);
  const [, forceUpdate] = useState(0);

  // Open database tab from URL param
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "database") {
      setSidebarTab("database");
      setSidebarOpen(true);
    }
  }, [searchParams]);

  // Clean message helper
  const cleanMessage = (content) => {
    if (!content) return content;

    const trimmed = content.trim();

    // Filter out tool call invocations
    if (/^Calling\s+\w+\s+with\s+input:/i.test(trimmed)) {
      return null;
    }

    // Filter out raw JSON tool results (pageContent, metadata blobs)
    if (
      (trimmed.startsWith("[{") || trimmed.startsWith('{"')) &&
      (trimmed.includes('"pageContent"') ||
        trimmed.includes('"metadata"') ||
        trimmed.includes('"response"'))
    ) {
      return null;
    }

    const promptRegex = /\[prompt:.*?\]/gi;
    let cleaned = content.replace(promptRegex, "").trim();
    cleaned = cleaned.replace(/^\[viesti\]\s*/i, "").trim();
    const systemPromptPattern = /\n\nAnswer in a spartan style.*$/is;
    cleaned = cleaned.replace(systemPromptPattern, "").trim();
    return cleaned;
  };

  // Sanitize filename helper
  function sanitizeFilename(inputName) {
    const trimmed = (inputName || "").trim();
    const justName = trimmed.split("\\").pop().split("/").pop();
    const dotIdx = justName.lastIndexOf(".");
    const ext = dotIdx >= 0 ? justName.slice(dotIdx) : "";
    const base = dotIdx >= 0 ? justName.slice(0, dotIdx) : justName;
    const withoutDiacritics = base
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    const asciiSafe = withoutDiacritics.replace(/[^a-zA-Z0-9._-]+/g, "-");
    const collapsed = asciiSafe
      .replace(/-+/g, "-")
      .replace(/^[.-]+|[.-]+$/g, "");
    return (collapsed || "file") + ext;
  }

  // Fetch files
  const fetchFiles = async () => {
    if (!user?.id) {
      setFilesError(t("assistant.errors.notLoggedIn"));
      return;
    }

    const orgId = await getUserOrgId(user.id);
    if (!orgId) {
      setFilesError(t("assistant.errors.organizationIdNotFound"));
      return;
    }

    setFilesLoading(true);
    setFilesError("");
    setFiles([]);
    try {
      const response = await axios.post(
        "/api/storage/knowledge",
        { action: "list", userId: orgId },
        {
          headers: { "x-api-key": import.meta.env.N8N_SECRET_KEY },
        },
      );

      let arr = [];
      if (Array.isArray(response.data.files)) {
        arr = response.data.files;
      } else if (
        response.data.files &&
        Array.isArray(response.data.files.data)
      ) {
        arr = response.data.files.data;
      } else if (Array.isArray(response.data.data)) {
        arr = response.data.data;
      } else if (Array.isArray(response.data)) {
        if (
          response.data.length > 0 &&
          response.data[0].data &&
          Array.isArray(response.data[0].data)
        ) {
          arr = response.data[0].data;
        } else {
          arr = response.data;
        }
      }

      const normalized = Array.isArray(arr)
        ? arr.map((item) => {
            if (
              item &&
              typeof item === "object" &&
              "file_name" in item &&
              Array.isArray(item.id)
            ) {
              return item;
            }
            const resolvedName =
              item && typeof item === "object"
                ? item.file_name ||
                  item.filename ||
                  item.name ||
                  item.originalFilename ||
                  item.title ||
                  "Tiedosto"
                : typeof item === "string"
                  ? item
                  : "Tiedosto";
            const resolvedId =
              item && typeof item === "object"
                ? Array.isArray(item.id)
                  ? item.id
                  : item.id
                    ? [item.id]
                    : []
                : [];
            return {
              file_name: resolvedName,
              id: resolvedId,
            };
          })
        : [];

      setFiles(normalized);
    } catch (error) {
      console.error("❌ Error fetching files:", error);
      setFilesError(t("assistant.files.list.error"));
    } finally {
      setFilesLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchFiles();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Polling functions
  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearTimeout(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  const startPolling = (threadIdToPoll) => {
    stopPolling();
    if (!threadIdToPoll) return;

    let pollCount = 0;
    const MAX_POLLS = 80;
    const POLL_INTERVAL = 1500;

    const poll = async () => {
      if (!pollingIntervalRef.current) return;
      pollCount++;

      if (pollCount > MAX_POLLS) {
        stopPolling();
        setMessages((prev) => prev.filter((m) => !m.isProcessing));
        return;
      }

      if (document.visibilityState === "hidden") {
        pollingIntervalRef.current = setTimeout(poll, POLL_INTERVAL);
        return;
      }

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session?.access_token) {
          pollingIntervalRef.current = setTimeout(poll, POLL_INTERVAL);
          return;
        }

        const response = await axios.get(
          `/api/ai/messages?threadId=${threadIdToPoll}`,
          {
            headers: { Authorization: `Bearer ${session.access_token}` },
          },
        );
        const zepMessages = response.data?.messages || [];
        const hasNewMessages = zepMessages.length > lastMessageCountRef.current;

        if (hasNewMessages) {
          const lastMessage = zepMessages[zepMessages.length - 1];
          const isLastMessageFromAssistant =
            lastMessage &&
            (lastMessage.role === "AI" ||
              lastMessage.role === "ai" ||
              lastMessage.role === "assistant") &&
            lastMessage.content &&
            lastMessage.content.trim().length > 0;

          const assistantMessages = zepMessages.filter(
            (msg) =>
              (msg.role === "AI" ||
                msg.role === "ai" ||
                msg.role === "assistant") &&
              msg.content,
          );
          const latestAssistantMsg =
            assistantMessages.length > 0
              ? cleanMessage(
                  assistantMessages[assistantMessages.length - 1].content,
                )
              : null;

          const hasNewAssistantResponse =
            isLastMessageFromAssistant &&
            latestAssistantMsg &&
            latestAssistantMsg !== lastAssistantMessageRef.current &&
            latestAssistantMsg.trim().length > 0;

          if (hasNewAssistantResponse) {
            lastMessageCountRef.current = zepMessages.length;
            lastAssistantMessageRef.current = latestAssistantMsg;

            const formattedMessages = zepMessages
              .filter((msg) => msg.content)
              .map((msg) => {
                let normalizedRole = msg.role;
                if (msg.role === "Human" || msg.role === "human") {
                  normalizedRole = "user";
                } else if (msg.role === "AI" || msg.role === "ai") {
                  normalizedRole = "assistant";
                }
                return {
                  role: normalizedRole,
                  content: cleanMessage(msg.content),
                };
              })
              .filter((msg) => msg.content);

            setMessages(formattedMessages);
            setTimeout(() => {
              setMessages((current) => [...current]);
              forceUpdate((prev) => prev + 1);
            }, 0);
            setTimeout(() => forceUpdate((prev) => prev + 1), 100);
            setTimeout(() => forceUpdate((prev) => prev + 1), 300);

            stopPolling();
            return;
          } else {
            lastMessageCountRef.current = zepMessages.length;
            if (
              latestAssistantMsg &&
              latestAssistantMsg !== lastAssistantMessageRef.current
            ) {
              lastAssistantMessageRef.current = latestAssistantMsg;
            }
          }
        }
      } catch (error) {
        console.error("❌ Polling error:", error);
      }

      if (pollingIntervalRef.current) {
        pollingIntervalRef.current = setTimeout(poll, POLL_INTERVAL);
      }
    };

    pollingIntervalRef.current = setTimeout(poll, POLL_INTERVAL);
  };

  // Send message
  const sendMessage = async () => {
    if (sendingRef.current || !input.trim() || loading) return;
    sendingRef.current = true;

    if (!user?.id) {
      sendingRef.current = false;
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: t("assistant.errors.notLoggedInContact"),
        },
      ]);
      return;
    }

    const orgId = await getUserOrgId(user.id);
    if (!orgId) {
      sendingRef.current = false;
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: t("assistant.errors.organizationIdNotFoundContact"),
        },
      ]);
      return;
    }

    const userMessageContent = input;
    setMessages((prev) => [
      ...prev,
      { role: "user", content: userMessageContent },
    ]);
    setInput("");

    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: t("assistant.errors.processingResponse"),
        isProcessing: true,
      },
    ]);
    setLoading(true);

    try {
      let activeThreadId = currentThreadId || threadId;
      if (!activeThreadId) {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.access_token) {
          try {
            const threadResponse = await axios.post(
              "/api/ai/threads",
              {
                title: userMessageContent.substring(0, 50),
                assistant_type: assistantType,
              },
              {
                headers: {
                  Authorization: `Bearer ${session.access_token}`,
                  "Content-Type": "application/json",
                },
              },
            );
            activeThreadId = threadResponse.data.thread.id;
            setCurrentThreadId(activeThreadId);
            setThreadId(activeThreadId);
            localStorage.setItem("rascalai_threadId", activeThreadId);
            setThreads((prev) => [threadResponse.data.thread, ...prev]);
          } catch (err) {
            console.error("Thread creation failed:", err);
          }
        }
      }

      const clientMessageId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const payload = {
        message: userMessageContent,
        threadId: activeThreadId,
        userId: orgId,
        assistantType: assistantType,
        clientMessageId,
      };

      if (activeThreadId) {
        try {
          const {
            data: { session: currentSession },
          } = await supabase.auth.getSession();
          if (!currentSession?.access_token) {
            throw new Error("No session");
          }

          const currentResponse = await axios.get(
            `/api/ai/messages?threadId=${activeThreadId}`,
            {
              headers: {
                Authorization: `Bearer ${currentSession.access_token}`,
              },
            },
          );
          const currentMessages = currentResponse.data?.messages || [];
          lastMessageCountRef.current = currentMessages.length;

          const assistantMessages = currentMessages.filter(
            (msg) =>
              (msg.role === "AI" ||
                msg.role === "ai" ||
                msg.role === "assistant") &&
              msg.content,
          );
          if (assistantMessages.length > 0) {
            lastAssistantMessageRef.current = cleanMessage(
              assistantMessages[assistantMessages.length - 1].content,
            );
          } else {
            lastAssistantMessageRef.current = null;
          }
        } catch (err) {
          lastMessageCountRef.current = messages.length;
          lastAssistantMessageRef.current = null;
        }

        setTimeout(() => startPolling(activeThreadId), 500);
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setMessages((prev) => prev.filter((m) => !m.isProcessing));
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: t("assistant.errors.loginRequiredRefresh"),
          },
        ]);
        setLoading(false);
        sendingRef.current = false;
        return;
      }

      try {
        await axios.post("/api/ai/chat", payload, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
        });
      } catch (error) {
        stopPolling();
        setMessages((prev) => prev.filter((m) => !m.isProcessing));
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: t("assistant.sendError") },
        ]);
      }

      if (activeThreadId) {
        await updateThreadTimestamp(activeThreadId);
      }

      setLoading(false);
      sendingRef.current = false;
    } catch (error) {
      setMessages((prev) => prev.filter((m) => !m.isProcessing));
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: t("assistant.sendError") },
      ]);
      setLoading(false);
      sendingRef.current = false;
    }
  };

  // Flush pending messages on mount/unmount
  useEffect(() => {
    const flushWithAxios = async () => {
      if (!pendingQueueRef.current.length) return;
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const queue = [...pendingQueueRef.current];
      for (const item of queue) {
        try {
          await axios.post("/api/ai/chat", item.payload, {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              "Content-Type": "application/json",
            },
          });
          dequeuePending(item.id);
        } catch {}
      }
    };
    flushWithAxios();

    const flushWithBeacon = async () => {
      if (!pendingQueueRef.current.length) return;
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const queue = [...pendingQueueRef.current];
      for (const item of queue) {
        const body = JSON.stringify(item.payload);
        try {
          await fetch("/api/ai/chat", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
            body,
            keepalive: true,
          });
        } catch {}
        dequeuePending(item.id);
      }
    };

    const onVis = () => {
      if (document.visibilityState === "hidden") flushWithBeacon();
    };
    const onUnload = () => flushWithBeacon();
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("beforeunload", onUnload);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("beforeunload", onUnload);
    };
  }, []);

  // Thread functions
  const fetchThreads = async () => {
    if (!user) return;
    try {
      setThreadsLoading(true);
      setThreads([]);

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await axios.get("/api/ai/threads", {
        headers: { Authorization: `Bearer ${session.access_token}` },
        params: { assistant_type: assistantType },
      });

      setThreads(response.data.threads || []);
    } catch (error) {
      console.error("Error fetching threads:", error);
      setThreads([]);
    } finally {
      setThreadsLoading(false);
    }
  };

  const createNewThread = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        alert(t("assistant.errors.loginRequired"));
        return;
      }

      const response = await axios.post(
        "/api/ai/threads",
        {
          title: t("assistant.threads.newThread"),
          assistant_type: assistantType,
        },
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
        },
      );

      const newThread = response.data.thread;
      setThreads((prev) => [newThread, ...prev]);
      setCurrentThreadId(newThread.id);
      setThreadId(newThread.id);
      setMessages([]);
      localStorage.setItem("rascalai_threadId", newThread.id);
    } catch (error) {
      console.error("Error creating thread:", error);
      alert(t("alerts.error.newChatFailed"));
    }
  };

  const loadThread = async (threadIdToLoad, isPollingUpdate = false) => {
    try {
      console.log("[loadThread] Loading thread:", threadIdToLoad);
      const thread = threads.find((t) => t.id === threadIdToLoad);
      if (!thread) {
        console.log("[loadThread] Thread not found in threads list");
        return;
      }

      setCurrentThreadId(threadIdToLoad);
      setThreadId(threadIdToLoad);

      const isRefresh = threadIdToLoad === currentThreadId;
      if (!isRefresh && !isPollingUpdate) {
        setMessages([]);
      }

      if (!isPollingUpdate) {
        setLoading(true);
      }
      localStorage.setItem("rascalai_threadId", threadIdToLoad);

      if (window.innerWidth <= 1024 && !isPollingUpdate) {
        setSidebarOpen(false);
      }

      const {
        data: { session: loadSession },
      } = await supabase.auth.getSession();
      if (!loadSession?.access_token) {
        throw new Error("No session");
      }

      console.log(
        "[loadThread] Fetching messages for threadId:",
        threadIdToLoad,
      );
      const response = await axios.get(
        `/api/ai/messages?threadId=${threadIdToLoad}`,
        {
          headers: { Authorization: `Bearer ${loadSession.access_token}` },
        },
      );

      const zepMessages = response.data?.messages || [];
      console.log("[loadThread] Received messages:", zepMessages.length);
      console.log("[loadThread] Raw messages:", zepMessages);
      lastMessageCountRef.current = zepMessages.length;

      const assistantMessages = zepMessages.filter(
        (msg) =>
          (msg.role === "AI" ||
            msg.role === "ai" ||
            msg.role === "assistant") &&
          msg.content,
      );
      if (assistantMessages.length > 0) {
        lastAssistantMessageRef.current = cleanMessage(
          assistantMessages[assistantMessages.length - 1].content,
        );
      }

      const formattedMessages = zepMessages
        .filter((msg) => {
          const hasContent = !!msg.content;
          if (!hasContent) {
            console.log(
              "[loadThread] Filtering out message without content:",
              msg,
            );
          }
          return hasContent;
        })
        .map((msg) => {
          let normalizedRole = msg.role;
          if (msg.role === "Human" || msg.role === "human") {
            normalizedRole = "user";
          } else if (msg.role === "AI" || msg.role === "ai") {
            normalizedRole = "assistant";
          }
          return {
            role: normalizedRole,
            content: cleanMessage(msg.content),
          };
        })
        .filter((msg) => msg.content);

      console.log("[loadThread] Formatted messages:", formattedMessages.length);
      console.log("[loadThread] Messages:", formattedMessages);
      setMessages(formattedMessages);
      await new Promise((resolve) => setTimeout(resolve, 0));

      if (isPollingUpdate || pollingIntervalRef.current) {
        stopPolling();
      }
    } catch (error) {
      console.error("Error loading messages:", error);
      if (!isPollingUpdate) {
        setMessages([]);
      }
      stopPolling();
    } finally {
      if (!isPollingUpdate) {
        setLoading(false);
      }
    }
  };

  const deleteThread = async (threadIdToDelete) => {
    if (!confirm(t("assistant.threads.deleteConfirm"))) return;

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      await axios.delete("/api/ai/threads", {
        data: { threadId: threadIdToDelete },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
      });

      setThreads((prev) => prev.filter((t) => t.id !== threadIdToDelete));
      if (currentThreadId === threadIdToDelete) {
        setCurrentThreadId(null);
        setThreadId(null);
        setMessages([]);
        localStorage.removeItem("rascalai_threadId");
      }
    } catch (error) {
      console.error("Error deleting thread:", error);
      alert(t("alerts.error.chatDeleteFailed"));
    }
  };

  const updateThreadTimestamp = async (threadIdTarget) => {
    try {
      await supabase
        .from("ai_chat_threads")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", threadIdTarget);
    } catch (error) {
      console.error("Error updating thread:", error);
    }
  };

  const updateThreadTitle = async (threadIdToUpdate, newTitle) => {
    if (!newTitle.trim()) {
      alert(t("alerts.error.emptyTitle"));
      return;
    }

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        alert(t("assistant.errors.loginRequired"));
        return;
      }

      const response = await axios.patch(
        "/api/ai/threads",
        {
          threadId: threadIdToUpdate,
          title: newTitle.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
        },
      );

      setThreads((prev) =>
        prev.map((t) =>
          t.id === threadIdToUpdate
            ? { ...t, title: response.data.thread.title }
            : t,
        ),
      );
    } catch (error) {
      console.error("Error updating title:", error);
      alert(t("alerts.error.titleUpdateFailed"));
    }
  };

  // Load threads when user or assistantType changes
  useEffect(() => {
    if (user) {
      if (assistantType) {
        setCurrentThreadId(null);
        setThreadId(null);
        setMessages([]);
        localStorage.removeItem("rascalai_threadId");
      }
      fetchThreads();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, assistantType]);

  // Handle visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && currentThreadId) {
        loadThread(currentThreadId);
        if (pollingIntervalRef.current) {
          // Continue polling
        } else if (messages.some((m) => m.isProcessing)) {
          startPolling(currentThreadId);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [currentThreadId, messages]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => stopPolling();
  }, [currentThreadId]);

  // File validation
  const validateFileType = (file) => {
    const validMimeTypes = [
      "application/pdf",
      "text/plain",
      "text/markdown",
      "text/x-markdown",
      "application/rtf",
      "text/rtf",
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
      "image/bmp",
      "audio/mpeg",
      "audio/mp3",
    ];

    if (file.type) {
      if (validMimeTypes.includes(file.type)) return { valid: true };
      if (file.type.startsWith("image/")) return { valid: true };
      if (file.type === "audio/mpeg" || file.type === "audio/mp3")
        return { valid: true };
    }

    const fileName = file.name.toLowerCase();
    const validExtensions = [
      ".pdf",
      ".txt",
      ".md",
      ".rtf",
      ".jpg",
      ".jpeg",
      ".png",
      ".gif",
      ".webp",
      ".svg",
      ".bmp",
      ".mp3",
    ];

    const hasValidExtension = validExtensions.some((ext) =>
      fileName.endsWith(ext),
    );
    if (hasValidExtension) return { valid: true };

    const extension =
      fileName.substring(fileName.lastIndexOf(".")) || "tuntematon";
    return {
      valid: false,
      error: t("assistant.files.list.unsupportedFormat", { extension }),
    };
  };

  // File handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length === 0) return;

    setUploadError("");
    const validFiles = [];
    const invalidFiles = [];

    droppedFiles.forEach((file) => {
      const validation = validateFileType(file);
      if (validation.valid) {
        validFiles.push(file);
      } else {
        invalidFiles.push({ file, error: validation.error });
      }
    });

    if (invalidFiles.length > 0) {
      const errorMessages = invalidFiles.map(
        ({ file, error }) => `${file.name}: ${error}`,
      );
      setUploadError(errorMessages.join(" "));
      if (validFiles.length === 0) return;
    }

    const MAX_BYTES = 25 * 1024 * 1024;
    const tooLarge = validFiles.find((f) => (f.size || 0) > MAX_BYTES);
    if (tooLarge) {
      setUploadError((prev) =>
        prev
          ? `${prev} Tiedosto "${tooLarge.name}" on liian suuri (maksimi 25 MB).`
          : `Tiedosto "${tooLarge.name}" on liian suuri (maksimi 25 MB).`,
      );
      return;
    }

    if (validFiles.length > 0) {
      setPendingFiles((prev) => {
        const uniqueNew = validFiles.filter(
          (f) => !prev.some((p) => p.name === f.name && p.size === f.size),
        );
        return [...prev, ...uniqueNew];
      });
    }
  };

  const handleFileInput = (e) => {
    const selectedFiles = Array.from(e.target.files);
    e.target.value = "";

    if (selectedFiles.length > 0) {
      setUploadError("");
      const validFiles = [];
      const invalidFiles = [];

      selectedFiles.forEach((file) => {
        const validation = validateFileType(file);
        if (validation.valid) {
          validFiles.push(file);
        } else {
          invalidFiles.push({ file, error: validation.error });
        }
      });

      if (invalidFiles.length > 0) {
        const errorMessages = invalidFiles.map(
          ({ file, error }) => `${file.name}: ${error}`,
        );
        setUploadError(errorMessages.join(" "));
        if (validFiles.length === 0) return;
      }

      const MAX_BYTES = 25 * 1024 * 1024;
      const tooLarge = validFiles.find((f) => (f.size || 0) > MAX_BYTES);
      if (tooLarge) {
        setUploadError((prev) =>
          prev
            ? `${prev} Tiedosto "${tooLarge.name}" on liian suuri (maksimi 25 MB).`
            : `Tiedosto "${tooLarge.name}" on liian suuri (maksimi 25 MB).`,
        );
        return;
      }

      if (validFiles.length > 0) {
        setPendingFiles((prev) => {
          const uniqueNew = validFiles.filter(
            (f) => !prev.some((p) => p.name === f.name && p.size === f.size),
          );
          return [...prev, ...uniqueNew];
        });
      }
    }
  };

  const handleRemovePending = (name, size) => {
    setPendingFiles((prev) =>
      prev.filter((f) => !(f.name === name && f.size === size)),
    );
  };

  const handleUploadPending = async () => {
    if (pendingFiles.length === 0) return;

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token || !session?.user?.id) {
      setUploadError("Kirjautuminen vaaditaan");
      return;
    }

    const orgId = await getUserOrgId(session.user.id);
    if (!orgId) {
      setUploadError(t("assistant.errors.organizationIdNotFound"));
      return;
    }

    setUploadLoading(true);
    setUploadError("");
    setUploadSuccess("");

    try {
      const uploaded = [];
      for (const file of pendingFiles) {
        const bucket = "temp-ingest";
        const safeName = sanitizeFilename(file.name);
        const path = `${Date.now()}-${safeName}`;
        const { error: putErr } = await supabase.storage
          .from(bucket)
          .upload(path, file, {
            upsert: true,
            contentType: file.type || "application/octet-stream",
          });
        if (putErr) throw new Error(putErr.message);
        const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
        uploaded.push({
          bucket,
          path,
          publicUrl: pub?.publicUrl || null,
          filename: file.name,
          size: file.size || 0,
          contentType: file.type || "application/octet-stream",
        });
      }

      await axios.post(
        "/api/storage/ingest",
        {
          userId: orgId,
          files: uploaded,
        },
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
            "x-api-key": import.meta.env.N8N_SECRET_KEY,
          },
        },
      );

      setUploadSuccess(
        t("assistant.files.uploadCard.uploadSuccess", {
          count: pendingFiles.length,
        }),
      );
      setPendingFiles([]);
      await fetchFiles();
    } catch (error) {
      console.error("Upload error:", error);
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.hint ||
        error.message ||
        t("assistant.files.uploadCard.uploadError");
      setUploadError(errorMessage);
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDeleteFile = async (fileIds) => {
    if (!Array.isArray(fileIds) || fileIds.length === 0) return;

    const file = files.find(
      (f) => JSON.stringify(f.id) === JSON.stringify(fileIds),
    );
    const fileName = file?.file_name || "tiedosto";

    if (!confirm(t("assistant.files.delete.confirmDelete", { fileName })))
      return;

    try {
      if (!user?.id) {
        alert(t("alerts.error.notLoggedIn"));
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        alert(t("assistant.errors.loginRequired"));
        return;
      }

      const orgId = await getUserOrgId(user.id);
      if (!orgId) {
        alert(t("alerts.error.organizationIdNotFound"));
        return;
      }

      await axios.post(
        "/api/storage/knowledge/delete",
        { ids: fileIds },
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
        },
      );

      setFiles((prev) =>
        prev.filter(
          (file) => JSON.stringify(file.id) !== JSON.stringify(fileIds),
        ),
      );
    } catch (error) {
      console.error("Error deleting file:", error);
      alert(t("alerts.error.fileDeleteFailed"));
    }
  };

  const handleAssistantTypeChange = (type) => {
    if (assistantType !== type) {
      setAssistantType(type);
      setCurrentThreadId(null);
      setThreadId(null);
      setMessages([]);
      localStorage.removeItem("rascalai_threadId");
      fetchThreads();
    }
  };

  if (!user) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
          <p className="text-gray-500">{t("assistant.loadingUser")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <ChatSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeTab={sidebarTab}
        onTabChange={setSidebarTab}
        threads={threads}
        threadsLoading={threadsLoading}
        currentThreadId={currentThreadId}
        onLoadThread={loadThread}
        onCreateThread={createNewThread}
        onDeleteThread={deleteThread}
        onUpdateThreadTitle={updateThreadTitle}
        files={files}
        filesLoading={filesLoading}
        filesError={filesError}
        pendingFiles={pendingFiles}
        uploadLoading={uploadLoading}
        uploadError={uploadError}
        uploadSuccess={uploadSuccess}
        dragActive={dragActive}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onFileInput={handleFileInput}
        onRemovePending={handleRemovePending}
        onUploadPending={handleUploadPending}
        onDeleteFile={handleDeleteFile}
        organizationRole={organization?.role}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <ChatHeader
          assistantType={assistantType}
          onAssistantTypeChange={handleAssistantTypeChange}
          filesCount={files.length}
          onOpenDatabase={() => {
            setSidebarOpen(true);
            setSidebarTab("database");
          }}
        />

        <ChatMessages messages={messages} loading={loading} />

        <ChatInput
          input={input}
          onInputChange={setInput}
          onSend={sendMessage}
          onNewChat={createNewThread}
          loading={loading}
        />
      </div>
    </div>
  );
}
