import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { upload as vercelBlobUpload } from "@vercel/blob/client";
import ReactMarkdown from "react-markdown";
import PageHeader from "../components/PageHeader";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { getUserOrgId } from "../lib/getUserOrgId";

export default function AIChatPage() {
  const { t } = useTranslation("common");
  const [searchParams] = useSearchParams();
  // Luotettava lähetystapa sivulta poistuttaessa
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
  const enqueuePending = (item) => {
    pendingQueueRef.current = [...pendingQueueRef.current, item];
    savePendingQueue(pendingQueueRef.current);
  };
  const dequeuePending = (id) => {
    pendingQueueRef.current = pendingQueueRef.current.filter(
      (i) => i.id !== id,
    );
    savePendingQueue(pendingQueueRef.current);
  };
  // Viestit ladataan Zepistä, ei localStoragesta
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false); // Sidebar auki/kiinni
  const [sidebarTab, setSidebarTab] = useState("threads"); // 'database' tai 'threads' - oletuksena 'threads'
  const [files, setFiles] = useState([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [filesError, setFilesError] = useState("");
  const [threadId, setThreadId] = useState(
    () => localStorage.getItem("rascalai_threadId") || null,
  );

  // Assistenttityyppi: 'marketing' tai 'sales'
  const [assistantType, setAssistantType] = useState("marketing");

  // Thread-hallinta
  const [threads, setThreads] = useState([]);
  const [threadsLoading, setThreadsLoading] = useState(false);
  const [currentThreadId, setCurrentThreadId] = useState(null);
  const [editingThreadId, setEditingThreadId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [uploadLoading, setUploadLoading] = useState(false);

  // Debug: Seuraa uploadLoading tilan muutoksia
  useEffect(() => {
    console.log("uploadLoading muuttui:", uploadLoading);
  }, [uploadLoading]);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");
  const [showAllFiles, setShowAllFiles] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [pendingFiles, setPendingFiles] = useState([]);

  // Debug: Seuraa pendingFiles tilan muutoksia
  useEffect(() => {
    console.log(
      "pendingFiles muuttui:",
      pendingFiles.length,
      pendingFiles.map((f) => f.name),
    );
  }, [pendingFiles]);
  const [dragActive, setDragActive] = useState(false);
  const dropRef = useRef(null);
  const filesListRef = useRef(null);
  const { user, organization } = useAuth();
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const MAX_BATCH_BYTES = 4 * 1024 * 1024; // ei käytössä Blob-polussa, jätetty varalle
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const sendingRef = useRef(false); // Estää duplikaattilähetykset
  const pollingIntervalRef = useRef(null); // Polling-intervallia varten
  const lastMessageCountRef = useRef(0); // Viimeisin viestimäärä, jotta voidaan havaita uusia viestejä
  const lastAssistantMessageRef = useRef(null); // Viimeisin assistentin viesti, jotta voidaan havaita uusi vastaus
  const [, forceUpdate] = useState(0); // Safari-optimointi: Pakota re-render

  // Mahdollista avata suoraan Tietokanta URL-parametrilla: /ai-chat?tab=database
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "database") {
      setSidebarTab("database");
      setSidebarOpen(true);
    }
  }, [searchParams]);

  // Scrollaa viestit automaattisesti alas
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Automaattinen textarea koon kasvu
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        textareaRef.current.scrollHeight + "px";
    }
  }, [input]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Safari-optimointi: Pakota re-render kun viestit muuttuvat
  useEffect(() => {
    // Tämä useEffect varmistaa että Safari renderöi viestit oikein
    if (messages.length > 0) {
      console.log("📨 Viestit muuttuivat, viestejä:", messages.length);
      // Pakota scrollaus päivittymään
      setTimeout(() => {
        scrollToBottom();
      }, 50);
    }
  }, [messages]);

  // Hae companyName organisaation tiedoista
  const companyName = organization?.data?.company_name || "Company";

  // Apufunktio: Poista system prompt viestistä
  const cleanMessage = (content) => {
    if (!content) return content;

    // Poista [prompt: ...] -osuus (voi olla missä tahansa viestissä)
    const promptRegex = /\[prompt:.*?\]/gi;
    let cleaned = content.replace(promptRegex, "").trim();

    // Jos viesti alkaa [viesti] tagilla, poista se
    cleaned = cleaned.replace(/^\[viesti\]\s*/i, "").trim();

    // Poista system prompt joka alkaa "\n\nAnswer in a spartan style..."
    // Tämä tulee Zepistä kun käyttäjän viesti sisältää promptin
    const systemPromptPattern = /\n\nAnswer in a spartan style.*$/is;
    cleaned = cleaned.replace(systemPromptPattern, "").trim();

    return cleaned;
  };

  // Vieritä alas aina kun viestit päivittyvät (column-reverse hoitaa, joten ei tarvita)
  // useEffect ei enää tarpeen

  // Hae tiedostot heti kun käyttäjä on kirjautunut
  useEffect(() => {
    if (user?.id) {
      fetchFiles();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Seuraa ikkunan koon muutoksia responsiivisuutta varten
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Apufunktiot tiedostokoon ja päivämäärän muotoiluun
  function formatBytes(bytes) {
    if (!bytes) return "-";
    if (bytes < 1024) return bytes + " t";
    return (bytes / 1024).toFixed(1).replace(".", ",") + " kt";
  }
  function formatDate(ts) {
    if (!ts) return "-";
    const d = new Date(ts * 1000);
    return d.toLocaleDateString("fi-FI");
  }
  function formatMB(bytes) {
    const mb = bytes / (1024 * 1024);
    return mb.toFixed(1).replace(".", ",") + " MB";
  }

  // Palauta turvallinen tiedostonimi (poista diakriitit ja erikoismerkit)
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

  const fetchFiles = async () => {
    // Hae käyttäjän organisaation ID (toimii sekä normaaleille että kutsutuille käyttäjille)
    if (!user?.id) {
      setFilesError(t("assistant.errors.notLoggedIn"));
      return;
    }

    const orgId = await getUserOrgId(user.id);
    if (!orgId) {
      setFilesError(t("assistant.errors.organizationIdNotFound"));
      return;
    }

    console.log("📁 Käytetään organisaation ID:tä:", orgId);
    setFilesLoading(true);
    setFilesError("");
    setFiles([]); // Tyhjennä vanhat tiedostot
    try {
      const response = await axios.post(
        "/api/storage/knowledge",
        { action: "list", userId: orgId },
        {
          headers: { "x-api-key": import.meta.env.N8N_SECRET_KEY },
        },
      );

      console.log("📁 API vastaus:", response.data);

      // Tuki eri payload-rakenteille
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
        // Jos response.data on array, tarkista onko siinä data-kenttiä
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

      console.log("📁 Parsittu array:", arr.length, "tiedostoa");

      // Normalize: ensure we always have a visible filename and consistent id array
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

      console.log("📁 Normalized:", normalized.length, "tiedostoa");
      console.log("📁 Ensimmäinen tiedosto:", normalized[0]);

      setFiles(normalized);
    } catch (error) {
      console.error("❌ Virhe haettaessa tiedostoja:", error);
      setFilesError(t("assistant.files.list.error"));
    } finally {
      setFilesLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    // Enter ilman Shiftia = lähetä viesti
    // Shift + Enter = rivinvaihto
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      // Kutsu lähetyslogiikkaa suoraan
      sendMessage();
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    // Estä duplikaattilähetys jos lähetys on jo käynnissä
    if (sendingRef.current || loading || !input.trim()) return;
    await sendMessage();
  };

  // Varsinainen lähetyslogiikka (kutsutaan sekä formista että Enter-näppäimestä)
  const sendMessage = async () => {
    // Estä duplikaattilähetykset - tarkista ja aseta flag heti
    if (sendingRef.current || !input.trim() || loading) {
      console.log("[AIChatPage] sendMessage blocked:", {
        sendingRef: sendingRef.current,
        hasInput: !!input.trim(),
        loading,
      });
      return;
    }

    console.log("[AIChatPage] sendMessage starting");

    // Aseta lähetys käynnissä -lippu HETI, ennen muita operaatioita
    sendingRef.current = true;

    // Hae organisaation ID (toimii sekä normaaleille että kutsutuille käyttäjille)
    if (!user?.id) {
      sendingRef.current = false;
      const errorMessage = {
        role: "assistant",
        content: t("assistant.errors.notLoggedInContact"),
      };
      setMessages((prev) => [...prev, errorMessage]);
      return;
    }

    const orgId = await getUserOrgId(user.id);
    if (!orgId) {
      sendingRef.current = false;
      const errorMessage = {
        role: "assistant",
        content: t("assistant.errors.organizationIdNotFoundContact"),
      };
      setMessages((prev) => [...prev, errorMessage]);
      return;
    }

    const userMessageContent = input;
    const userMessage = { role: "user", content: userMessageContent };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    // Nollaa textarea korkeus
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    // Näytä "Käsitellään..." -viesti
    const processingMessage = {
      role: "assistant",
      content: t("assistant.errors.processingResponse"),
      isProcessing: true,
    };
    setMessages((prev) => [...prev, processingMessage]);

    setLoading(true);

    try {
      // Luo uusi thread jos ei ole olemassa
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
                title: userMessageContent.substring(0, 50), // Käytä ensimmäistä viestiä otsikkona
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
            setThreadId(activeThreadId); // Tämä menee Zepiin sessionId:nä
            localStorage.setItem("rascalai_threadId", activeThreadId);
            setThreads((prev) => [threadResponse.data.thread, ...prev]);
          } catch (err) {
            console.error("Threadin luonti epäonnistui:", err);
          }
        }
      }

      // Lähetä viesti N8N:ään (joka tallentaa Zepiin käyttäen threadId:tä sessionId:nä)
      const clientMessageId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const payload = {
        message: userMessageContent,
        threadId: activeThreadId, // Zep käyttää tätä sessionId:nä
        userId: orgId, // Organisaation ID
        assistantType: assistantType, // 'marketing' tai 'sales'
        clientMessageId, // Duplikaattisuojaukseen
      };
      // Aseta viestimäärä ja viimeisin assistentin viesti heti kun viesti lähetetään
      // Tämä auttaa havaitsemaan kun uusi vastaus tulee
      if (activeThreadId) {
        try {
          const currentResponse = await axios.get(
            `/api/integrations/zep/messages?threadId=${activeThreadId}`,
          );
          const currentMessages = currentResponse.data?.messages || [];
          // Aseta viestimääräksi nykyinen määrä (käyttäjän uusi viesti lisätään pian Zepiin)
          lastMessageCountRef.current = currentMessages.length;

          // Etsi viimeisin assistentin viesti
          const assistantMessages = currentMessages.filter(
            (msg) =>
              (msg.role === "AI" ||
                msg.role === "ai" ||
                msg.role === "assistant") &&
              msg.content,
          );
          if (assistantMessages.length > 0) {
            const latestAssistantMsg =
              assistantMessages[assistantMessages.length - 1];
            lastAssistantMessageRef.current = cleanMessage(
              latestAssistantMsg.content,
            );
          } else {
            lastAssistantMessageRef.current = null;
          }

          console.log(
            `📊 Asetettiin alkuperäinen viestimäärä: ${lastMessageCountRef.current}, viimeisin assistentin viesti: ${lastAssistantMessageRef.current ? "löytyi" : "ei löytynyt"}`,
          );
        } catch (err) {
          console.error("Virhe nykyisten viestien haussa:", err);
          // Jos haussa virhe, käytä oletusarvoa
          lastMessageCountRef.current = messages.length;
          lastAssistantMessageRef.current = null;
        }

        // Aloita polling heti - se havaitsee kun uusi vastaus tulee Zepiin
        setTimeout(() => {
          startPolling(activeThreadId);
        }, 500); // Aloita polling 0.5 sekunnin kuluttua
      }

      // FIRE-AND-FORGET: Lähetä taustalle, älä odota vastausta
      // Hae token ennen lähetystä
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setMessages((prev) => prev.filter((m) => !m.isProcessing));
        const errorMessage = {
          role: "assistant",
          content: t("assistant.errors.loginRequiredRefresh"),
        };
        setMessages((prev) => [...prev, errorMessage]);
        setLoading(false);
        sendingRef.current = false;
        return;
      }

      // Lähetä suoraan (ei pending queuea, koska se aiheuttaa duplikaatteja)
      console.log("[AIChatPage] Sending message:", {
        clientMessageId,
        hasThreadId: !!activeThreadId,
        messageLength: userMessageContent.length,
        payload: {
          ...payload,
          message: payload.message.substring(0, 50) + "...",
        },
      });

      try {
        const response = await axios.post("/api/ai/chat", payload, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
        });
        console.log("[AIChatPage] Message sent successfully:", response.data);
      } catch (error) {
        console.error("[AIChatPage] Virhe viestin lähetyksessä:", error);
        console.error("[AIChatPage] Error response:", error.response?.data);
        console.error("[AIChatPage] Error status:", error.response?.status);
        // Lopeta polling jos se on käynnissä
        stopPolling();
        // Poista "Käsitellään..." ja näytä virhe
        setMessages((prev) => prev.filter((m) => !m.isProcessing));
        const errorMessage = {
          role: "assistant",
          content: t("assistant.sendError"),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }

      // Päivitä thread-aikaleima
      if (activeThreadId) {
        await updateThreadTimestamp(activeThreadId);
      }

      // Käyttäjä voi heti jatkaa - ei tarvitse odottaa vastausta
      setLoading(false);
      sendingRef.current = false;
    } catch (error) {
      // Poista "Käsitellään..." ja näytä virhe
      setMessages((prev) => prev.filter((m) => !m.isProcessing));
      const errorMessage = {
        role: "assistant",
        content: t("assistant.sendError"),
      };
      setMessages((prev) => [...prev, errorMessage]);
      setLoading(false);
      sendingRef.current = false;
    }
  };

  // Flushaa keskeneräiset viestit käynnistyksessä ja poistuttaessa
  useEffect(() => {
    const flushWithAxios = async () => {
      if (!pendingQueueRef.current.length) return;

      // Hae token ennen flushausta
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

      // Hae token ennen flushausta
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const queue = [...pendingQueueRef.current];
      for (const item of queue) {
        const body = JSON.stringify(item.payload);
        let sent = false;
        // sendBeacon ei tue custom headereita, joten käytetään fetch:ia
        if (!sent) {
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
        }
        dequeuePending(item.id);
      }
    };
    const onVis = () => {
      if (document.visibilityState === "hidden") flushWithBeacon();
    };
    const onUnload = () => {
      flushWithBeacon();
    };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("beforeunload", onUnload);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("beforeunload", onUnload);
    };
  }, []);

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    if (!user?.id) {
      setUploadError(t("assistant.errors.notLoggedIn"));
      return;
    }

    const orgId = await getUserOrgId(user.id);
    if (!orgId) {
      setUploadError(t("assistant.errors.organizationIdNotFound"));
      return;
    }

    console.log("Asetetaan uploadLoading = true (handleFileUpload)");
    setUploadLoading(true);
    setUploadError("");
    setUploadSuccess("");

    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));
      formData.append("action", "feed");
      formData.append("userId", orgId);
      try {
        formData.append("fileNames", JSON.stringify(files.map((f) => f.name)));
      } catch {}

      await axios.post("/api/storage/knowledge/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          "x-api-key": import.meta.env.N8N_SECRET_KEY,
        },
      });

      setUploadSuccess(
        t("assistant.files.uploadCard.uploadSuccess", { count: files.length }),
      );
      // Päivitä tiedostolista heti uploadin jälkeen
      await fetchFiles();
    } catch (error) {
      console.error("Virhe tiedostojen lataamisessa:", error);
      console.error("Virheen response:", error.response?.data);
      console.error("Virheen message:", error.message);
      console.error("Virheen status:", error.response?.status);
      console.error("Virheen config:", error.config);

      const errorMessage =
        error.response?.data?.details ||
        error.response?.data?.error ||
        error.message;
      console.log("Asetetaan virheviesti:", errorMessage);
      setUploadError(
        `${t("assistant.files.uploadCard.uploadError")}: ${errorMessage}`,
      );
    } finally {
      console.log("Finally-lohko suoritettu");
      setUploadLoading(false);
    }
  };

  const handleFileSelection = (fileId) => {
    setSelectedFiles((prev) =>
      prev.includes(fileId)
        ? prev.filter((id) => id !== fileId)
        : [...prev, fileId],
    );
  };

  const handleFileDeletion = async (fileIds) => {
    // fileIds on array UUID:ta, koska yksi tiedosto voi olla jaettu useampaan dokumenttiin
    if (!Array.isArray(fileIds) || fileIds.length === 0) {
      console.error("Virheellinen fileIds:", fileIds);
      return;
    }

    // Etsi tiedoston nimi vahvistusdialogia varten
    const file = files.find(
      (f) => JSON.stringify(f.id) === JSON.stringify(fileIds),
    );
    const fileName = file?.file_name || "tiedosto";

    // Vahvista poisto
    if (!confirm(t("assistant.files.delete.confirmDelete", { fileName }))) {
      return;
    }

    try {
      if (!user?.id) {
        alert(t("alerts.error.notLoggedIn"));
        return;
      }

      // Hae käyttäjän access token
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
      console.log("🗑️ Poistetaan tiedosto, IDs:", fileIds, "orgId:", orgId);

      // Käytä uutta knowledge/delete endpointia joka tukee array-poistoa ja Supabase-integraatiota
      await axios.post(
        "/api/storage/knowledge/delete",
        {
          ids: fileIds,
        },
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
        },
      );

      // Poista tiedosto listasta vertaamalla id-arrayja
      setFiles((prev) =>
        prev.filter(
          (file) => JSON.stringify(file.id) !== JSON.stringify(fileIds),
        ),
      );
      console.log("✅ Tiedosto poistettu");
    } catch (error) {
      console.error("❌ Virhe tiedoston poistamisessa:", error);
      if (error.response?.data) {
        console.error("Virheen yksityiskohdat:", error.response.data);
      }
      alert(t("alerts.error.fileDeleteFailed"));
    }
  };

  // Thread-hallinta funktiot
  const fetchThreads = async () => {
    if (!user) return;

    try {
      setThreadsLoading(true);
      // Tyhjennä threadit ennen uusien lataamista
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
      console.error("Virhe threadien haussa:", error);
      setThreads([]); // Tyhjennä threadit virheen sattuessa
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
      console.log("✅ Uusi thread luotu:", newThread.id);
    } catch (error) {
      console.error("❌ Virhe threadin luonnissa:", error);
      alert(t("alerts.error.newChatFailed"));
    }
  };

  // Lopeta polling jos se on käynnissä
  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearTimeout(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  // Aloita polling joka tarkistaa uusia viestejä säännöllisesti
  // Käytetään setTimeout-rekursiota setIntervalin sijaan paremman Safari-tuen vuoksi
  const startPolling = (threadIdToPoll) => {
    // Lopeta vanha polling jos se on käynnissä
    stopPolling();

    if (!threadIdToPoll) return;

    console.log(`🔄 Aloitetaan polling threadille: ${threadIdToPoll}`);

    let pollCount = 0;
    const MAX_POLLS = 80; // Maksimi 2 minuuttia (80 * 1.5 sekuntia)
    const POLL_INTERVAL = 1500; // 1.5 sekunnin välein

    const poll = async () => {
      // Tarkista että polling on vielä aktiivinen
      if (!pollingIntervalRef.current) {
        return; // Polling on lopetettu
      }

      pollCount++;

      // Lopeta polling jos se on kestänyt liian kauan
      if (pollCount > MAX_POLLS) {
        console.log("⏱️ Polling loppui, maksimikesto ylittyi");
        stopPolling();
        // Poista "Käsitellään..." -viesti jos vastaus ei ole vielä tullut
        setMessages((prev) => prev.filter((m) => !m.isProcessing));
        return;
      }

      // Älä tarkista jos tab on piilossa (Safari optimointi)
      if (document.visibilityState === "hidden") {
        // Ajoita seuraava tarkistus kun tab tulee näkyviin
        pollingIntervalRef.current = setTimeout(poll, POLL_INTERVAL);
        return;
      }

      try {
        const response = await axios.get(
          `/api/integrations/zep/messages?threadId=${threadIdToPoll}`,
        );
        const zepMessages = response.data?.messages || [];

        console.log(
          `🔍 Safari polling: Tarkistetaan viestejä. Zepissä: ${zepMessages.length}, Viimeksi: ${lastMessageCountRef.current}`,
        );

        // Tarkista onko viestejä enemmän kuin viimeksi
        const hasNewMessages = zepMessages.length > lastMessageCountRef.current;

        if (hasNewMessages) {
          console.log(
            `📊 Safari: Löydettiin uusia viestejä! ${zepMessages.length} vs ${lastMessageCountRef.current}`,
          );
          // Etsi viimeisin viesti ja tarkista onko se assistentin viesti
          const lastMessage = zepMessages[zepMessages.length - 1];
          const isLastMessageFromAssistant =
            lastMessage &&
            (lastMessage.role === "AI" ||
              lastMessage.role === "ai" ||
              lastMessage.role === "assistant") &&
            lastMessage.content &&
            lastMessage.content.trim().length > 0;

          // Etsi viimeisin assistentin viesti
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

          // Tarkista onko viimeisin viesti assistentin uusi vastaus
          const hasNewAssistantResponse =
            isLastMessageFromAssistant &&
            latestAssistantMsg &&
            latestAssistantMsg !== lastAssistantMessageRef.current &&
            latestAssistantMsg.trim().length > 0;

          if (hasNewAssistantResponse) {
            console.log(
              `✅ Löydettiin uusi assistentin vastaus: ${zepMessages.length} viestiä (aiemmin ${lastMessageCountRef.current})`,
            );
            lastMessageCountRef.current = zepMessages.length;
            lastAssistantMessageRef.current = latestAssistantMsg;

            // Safari-optimointi: Päivitä viestit suoraan ilman loadThread-kutsua
            // Tämä varmistaa että state päivittyy oikein Safari-ssa
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
              });

            // Safari-optimointi: Käytä funktiota joka pakottaa päivityksen
            console.log(
              "🔄 Safari: Päivitetään viestit suoraan. Uusia viestejä:",
              formattedMessages.length,
            );
            setMessages(formattedMessages); // Aseta suoraan, poista processing-viestit automaattisesti

            // Safari-optimointi: Varmista että viestit näkyvät
            // Tehdään useita päivityksiä jotta Safari varmasti renderöi ne
            setTimeout(() => {
              setMessages((current) => {
                console.log("🔍 Safari: Varmistetaan viestit:", current.length);
                // Palauta sama array mutta varmista että referenssi muuttuu
                return [...current];
              });
              forceUpdate((prev) => prev + 1);
            }, 0);

            setTimeout(() => {
              forceUpdate((prev) => prev + 1);
              scrollToBottom();
            }, 100);

            setTimeout(() => {
              forceUpdate((prev) => prev + 1);
              scrollToBottom();
            }, 300);

            // Lopeta polling kun vastaus on saatu
            stopPolling();
            return;
          } else {
            // Jos viestejä on enemmän mutta viimeisin viesti on käyttäjän viesti,
            // päivitetään viestimäärä mutta ei vielä ladata viestejä
            console.log(
              `📝 Uusia viestejä, mutta viimeisin on käyttäjän viesti: ${zepMessages.length} viestiä`,
            );
            lastMessageCountRef.current = zepMessages.length;
            // Päivitä viimeisin assistentin viesti jos se on muuttunut
            if (
              latestAssistantMsg &&
              latestAssistantMsg !== lastAssistantMessageRef.current
            ) {
              lastAssistantMessageRef.current = latestAssistantMsg;
            }
          }
        }
      } catch (error) {
        console.error("❌ Virhe pollingissa:", error);
        // Älä lopeta pollingia virheen vuoksi, yritä uudelleen seuraavalla kierroksella
      }

      // Ajoita seuraava polling-kierros (rekursiivinen setTimeout)
      if (pollingIntervalRef.current) {
        pollingIntervalRef.current = setTimeout(poll, POLL_INTERVAL);
      }
    };

    // Aloita ensimmäinen polling-kierros
    pollingIntervalRef.current = setTimeout(poll, POLL_INTERVAL);
  };

  const loadThread = async (threadIdToLoad, isPollingUpdate = false) => {
    try {
      // Tarkista että thread kuuluu nykyiseen assistenttityyppiin
      const thread = threads.find((t) => t.id === threadIdToLoad);
      if (!thread) {
        console.warn(
          "Thread ei kuulu nykyiseen assistenttityyppiin:",
          threadIdToLoad,
        );
        return;
      }

      setCurrentThreadId(threadIdToLoad);
      setThreadId(threadIdToLoad); // Zep käyttää tätä sessionId:nä

      // Älä tyhjennä viestejä jos ladataan samaa threadia (päivitys)
      const isRefresh = threadIdToLoad === currentThreadId;
      if (!isRefresh && !isPollingUpdate) {
        setMessages([]); // Tyhjennä vain jos vaihdetaan threadia
      }

      if (!isPollingUpdate) {
        setLoading(true);
      }
      localStorage.setItem("rascalai_threadId", threadIdToLoad);

      // Sulje sidebar mobiilissa
      if (window.innerWidth <= 1024 && !isPollingUpdate) {
        setSidebarOpen(false);
      }

      console.log(`🔄 Haetaan viestit Zepistä threadille: ${threadIdToLoad}`);

      // Hae viestit Zepistä
      const response = await axios.get(
        `/api/integrations/zep/messages?threadId=${threadIdToLoad}`,
      );

      const zepMessages = response.data?.messages || [];
      console.log(`✅ Ladattiin ${zepMessages.length} viestiä Zepistä`);
      console.log("📝 Ensimmäinen viesti:", zepMessages[0]);

      // Päivitä viestimäärä ja viimeisin assistentin viesti
      lastMessageCountRef.current = zepMessages.length;

      // Etsi viimeisin assistentin viesti
      const assistantMessages = zepMessages.filter(
        (msg) =>
          (msg.role === "AI" ||
            msg.role === "ai" ||
            msg.role === "assistant") &&
          msg.content,
      );
      if (assistantMessages.length > 0) {
        const latestAssistantMsg =
          assistantMessages[assistantMessages.length - 1];
        lastAssistantMessageRef.current = cleanMessage(
          latestAssistantMsg.content,
        );
      }

      // Muunna Zep-viestit oikeaan muotoon ja siivoa system promptit
      const formattedMessages = zepMessages
        .filter((msg) => msg.content) // Poista tyhjät viestit
        .map((msg) => {
          // Normalisoi role: "Human" -> "user", "AI" -> "assistant"
          let normalizedRole = msg.role;
          if (msg.role === "Human" || msg.role === "human") {
            normalizedRole = "user";
          } else if (msg.role === "AI" || msg.role === "ai") {
            normalizedRole = "assistant";
          }

          const formatted = {
            role: normalizedRole,
            content: cleanMessage(msg.content),
          };
          console.log(
            `📨 Formatoitu viesti - role: ${msg.role} -> ${formatted.role}, sisältö alkaa: ${formatted.content.substring(0, 50)}...`,
          );
          return formatted;
        });

      // Safari-optimointi: Varmista että viestit päivittyvät oikein
      // Poista ensin "Käsitellään..." -viesti jos se on olemassa
      setMessages((prev) => {
        // Poista processing-viestit ennen uusien viestien asettamista
        const withoutProcessing = prev.filter((m) => !m.isProcessing);
        // Aseta uudet viestit
        return formattedMessages;
      });

      // Safari-optimointi: Pakota komponentin uudelleenrenderöinti
      // Tämä varmistaa että Safari näyttää muutokset oikein
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Lopeta polling jos se on käynnissä (vastaus on nyt nähtävissä)
      if (isPollingUpdate || pollingIntervalRef.current) {
        stopPolling();
      }
    } catch (error) {
      console.error("❌ Virhe viestien lataamisessa:", error);
      // Jos virhe, näytä tyhjä chat
      if (!isPollingUpdate) {
        setMessages([]);
      }
      // Lopeta polling myös virheen sattuessa
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
      console.log("✅ Thread poistettu:", threadIdToDelete);
    } catch (error) {
      console.error("❌ Virhe threadin poistossa:", error);
      alert(t("alerts.error.chatDeleteFailed"));
    }
  };

  const updateThreadTimestamp = async (threadIdTarget) => {
    // Päivitä threadin updated_at kun uusi viesti lähetetään
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      await supabase
        .from("ai_chat_threads")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", threadIdTarget);
    } catch (error) {
      console.error("❌ Virhe threadin päivityksessä:", error);
    }
  };

  const startEditingThread = (thread) => {
    setEditingThreadId(thread.id);
    setEditingTitle(thread.title);
  };

  const cancelEditingThread = () => {
    setEditingThreadId(null);
    setEditingTitle("");
  };

  const saveThreadTitle = async (threadId) => {
    if (!editingTitle.trim()) {
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
          threadId,
          title: editingTitle.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
        },
      );

      // Päivitä threadin otsikko listassa
      setThreads((prev) =>
        prev.map((t) =>
          t.id === threadId ? { ...t, title: response.data.thread.title } : t,
        ),
      );

      setEditingThreadId(null);
      setEditingTitle("");
      console.log("✅ Threadin otsikko päivitetty:", threadId);
    } catch (error) {
      console.error("❌ Virhe otsikon päivityksessä:", error);
      alert(t("alerts.error.titleUpdateFailed"));
    }
  };

  // Lataa threadit kun käyttäjä kirjautuu tai assistantType muuttuu
  useEffect(() => {
    if (user) {
      // Kun assistantType muuttuu, tyhjennetään nykyinen thread ja viestit
      if (assistantType) {
        setCurrentThreadId(null);
        setThreadId(null);
        setMessages([]);
        localStorage.removeItem("rascalai_threadId");
      }

      // Lataa threadit nykyiselle assistenttityypille
      fetchThreads();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, assistantType]);

  // Päivitä viestit kun käyttäjä palaa sivulle ja jatka pollingia jos se on kesken
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && currentThreadId) {
        console.log("👀 Sivu aktiivinen, päivitetään viestit");
        // Päivitä viestit heti kun tab tulee näkyviin
        loadThread(currentThreadId);
        // Jos polling on kesken, jatka sitä
        if (pollingIntervalRef.current) {
          console.log("🔄 Jatketaan pollingia kun tab tulee näkyviin");
        } else if (messages.some((m) => m.isProcessing)) {
          // Jos on "Käsitellään..." -viesti, aloita polling uudelleen
          console.log("🔄 Aloitetaan polling uudelleen kun tab tulee näkyviin");
          startPolling(currentThreadId);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [currentThreadId, messages]);

  // Lopeta polling kun komponentti unmountataan tai thread vaihtuu
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [currentThreadId]);

  // Validoi tiedostotyyppi - tarkistaa onko tiedosto tuettua muotoa
  const validateFileType = (file) => {
    // Tuetut MIME-tyypit
    const validMimeTypes = [
      // PDF
      "application/pdf",
      // Tekstitiedostot
      "text/plain", // .txt
      "text/markdown", // .md
      "text/x-markdown", // .md vaihtoehtoinen
      // RTF
      "application/rtf",
      "text/rtf",
      // Kuvat (kaikki)
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
      "image/bmp",
      // Äänitiedostot - vain MP3
      "audio/mpeg",
      "audio/mp3",
    ];

    // Tarkista MIME-tyyppi
    if (file.type) {
      // Tarkista tarkka MIME-tyyppi
      if (validMimeTypes.includes(file.type)) {
        return { valid: true };
      }

      // Tarkista onko kuva (image/*)
      if (file.type.startsWith("image/")) {
        return { valid: true };
      }

      // Äänitiedostot - vain MP3
      if (file.type === "audio/mpeg" || file.type === "audio/mp3") {
        return { valid: true };
      }
    }

    // Jos MIME-tyyppi puuttuu tai ei ole tuettu, tarkista tiedostopääte
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

    if (hasValidExtension) {
      return { valid: true };
    }

    // Tiedosto ei ole tuettu
    const extension =
      fileName.substring(fileName.lastIndexOf(".")) || "tuntematon";
    return {
      valid: false,
      error: t("assistant.files.list.unsupportedFormat", { extension }),
    };
  };

  // Drag & drop event handlers
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
    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    // Tyhjennä edelliset virheet
    setUploadError("");

    // Validoi tiedostotyypit
    const validFiles = [];
    const invalidFiles = [];

    files.forEach((file) => {
      const validation = validateFileType(file);
      if (validation.valid) {
        validFiles.push(file);
      } else {
        invalidFiles.push({ file, error: validation.error });
      }
    });

    // Näytä virheilmoitus jos on kelpaamattomia tiedostoja
    if (invalidFiles.length > 0) {
      const errorMessages = invalidFiles.map(({ file, error }) => {
        return `${file.name}: ${error}`;
      });
      setUploadError(errorMessages.join(" "));

      // Jos kaikki tiedostot ovat kelpaamattomia, älä lisää mitään
      if (validFiles.length === 0) {
        return;
      }
    }

    // Kokorajoitus 25 MB per tiedosto drag&dropissa
    const MAX_BYTES = 25 * 1024 * 1024;
    const tooLargeDrop = validFiles.find((f) => (f.size || 0) > MAX_BYTES);
    if (tooLargeDrop) {
      setUploadError((prev) =>
        prev
          ? `${prev} Tiedosto "${tooLargeDrop.name}" on liian suuri (maksimi 25 MB).`
          : `Tiedosto "${tooLargeDrop.name}" on liian suuri (maksimi 25 MB).`,
      );
      return;
    }

    // Lisää vain kelvolliset tiedostot
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
    const files = Array.from(e.target.files);
    console.log("handleFileInput kutsuttu, tiedostoja:", files.length);

    // Tyhjennä input-kenttä, jotta sama tiedosto voidaan valita uudelleen
    e.target.value = "";

    if (files.length > 0) {
      // Tyhjennä edelliset virheet
      setUploadError("");

      // Validoi tiedostotyypit
      const validFiles = [];
      const invalidFiles = [];

      files.forEach((file) => {
        const validation = validateFileType(file);
        if (validation.valid) {
          validFiles.push(file);
        } else {
          invalidFiles.push({ file, error: validation.error });
        }
      });

      // Näytä virheilmoitus jos on kelpaamattomia tiedostoja
      if (invalidFiles.length > 0) {
        const errorMessages = invalidFiles.map(({ file, error }) => {
          return `${file.name}: ${error}`;
        });
        setUploadError(errorMessages.join(" "));

        // Jos kaikki tiedostot ovat kelpaamattomia, älä lisää mitään
        if (validFiles.length === 0) {
          return;
        }
      }

      // Kokorajoitus 25 MB per tiedosto inputista
      const MAX_BYTES = 25 * 1024 * 1024;
      const tooLargeInput = validFiles.find((f) => (f.size || 0) > MAX_BYTES);
      if (tooLargeInput) {
        setUploadError((prev) =>
          prev
            ? `${prev} Tiedosto "${tooLargeInput.name}" on liian suuri (maksimi 25 MB).`
            : `Tiedosto "${tooLargeInput.name}" on liian suuri (maksimi 25 MB).`,
        );
        return;
      }

      // Lisää vain kelvolliset tiedostot
      if (validFiles.length > 0) {
        setPendingFiles((prev) => {
          const uniqueNew = validFiles.filter(
            (f) => !prev.some((p) => p.name === f.name && p.size === f.size),
          );
          const newPendingFiles = [...prev, ...uniqueNew];
          console.log("pendingFiles päivitetty:", newPendingFiles.length);
          return newPendingFiles;
        });
      }
    }
  };
  const handleRemovePending = (name, size) => {
    console.log("handleRemovePending kutsuttu:", name, size);
    setPendingFiles((prev) => {
      const newFiles = prev.filter(
        (f) => !(f.name === name && f.size === size),
      );
      console.log("pendingFiles päivitetty:", newFiles.length);
      return newFiles;
    });
  };
  const handleUploadPending = async () => {
    console.log(
      "handleUploadPending klikattu, pendingFiles:",
      pendingFiles.length,
    );
    console.log("uploadLoading:", uploadLoading);

    if (pendingFiles.length === 0) {
      console.log("Ei pendingFiles, palautetaan");
      return;
    }

    // Hae käyttäjän access token
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token || !session?.user?.id) {
      setUploadError("Kirjautuminen vaaditaan");
      return;
    }

    // Hae organisaation ID (toimii sekä normaaleille että kutsutuille käyttäjille)
    const orgId = await getUserOrgId(session.user.id);
    if (!orgId) {
      console.log("Organisaation ID puuttuu");
      setUploadError(t("assistant.errors.organizationIdNotFound"));
      return;
    }

    console.log("Asetetaan uploadLoading = true (handleUploadPending)");
    setUploadLoading(true);
    setUploadError("");
    setUploadSuccess("");
    try {
      console.log("Ladataan tiedostot Supabaseen (public bucket upload)...");
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

      // Backend käyttää automaattisesti req.organization.id:tä, mutta lähetetään orgId varmuuden vuoksi
      await axios.post(
        "/api/storage/ingest",
        {
          userId: orgId, // Organisaation ID
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
      // Päivitä tiedostolista heti uploadin jälkeen
      console.log("Päivitetään tiedostolista...");
      await fetchFiles();
      console.log("Tiedostolista päivitetty");
    } catch (error) {
      console.error("Virhe tiedostojen lataamisessa (blob):", error);
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.hint ||
        error.message ||
        t("assistant.files.uploadCard.uploadError");
      setUploadError(errorMessage);
    } finally {
      console.log("Asetetaan uploadLoading = false (handleUploadPending)");
      setUploadLoading(false);
    }
  };

  // Tyhjennä keskustelu
  const handleNewChat = async () => {
    // Luo uusi thread Supabaseen ja vaihda siihen
    await createNewThread();
  };

  // Ei enää tallenneta viestejä localStorageen, koska ne tulevat Zepistä
  // useEffect(() => {
  //   localStorage.setItem('rascalai_chat_messages', JSON.stringify(messages))
  // }, [messages])

  return (
    <>
      {!user ? (
        <div className="modern-chat-loading">
          <div className="loading-spinner"></div>
          <p>{t("assistant.loadingUser")}</p>
        </div>
      ) : (
        <div className="modern-chat-container">
          {/* Sidebar - Tietokanta ja Keskustelut */}
          <div className={`modern-chat-sidebar ${sidebarOpen ? "open" : ""}`}>
            <div className="sidebar-header">
              <div className="sidebar-tabs">
                <button
                  className={`sidebar-tab ${sidebarTab === "threads" ? "active" : ""}`}
                  onClick={() => setSidebarTab("threads")}
                >
                  {t("assistant.threads.title")}
                </button>
                <button
                  className={`sidebar-tab ${sidebarTab === "database" ? "active" : ""}`}
                  onClick={() => setSidebarTab("database")}
                >
                  {t("assistant.threads.database")}
                </button>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="close-sidebar"
              >
                ✕
              </button>
            </div>

            {/* Keskustelut-tabi */}
            {sidebarTab === "threads" && (
              <div className="sidebar-threads">
                <div className="threads-header">
                  <h3>
                    {t("assistant.threads.count", { count: threads.length })}
                  </h3>
                  <button
                    onClick={createNewThread}
                    className="new-thread-btn"
                    title={t("assistant.threads.newThread")}
                  >
                    +
                  </button>
                </div>

                <div className="threads-list">
                  {threadsLoading ? (
                    <div className="loading-state">
                      <div className="loading-spinner small"></div>
                    </div>
                  ) : threads.length === 0 ? (
                    <p className="empty-state">
                      {t("assistant.threads.empty")}
                    </p>
                  ) : (
                    threads.map((thread) => (
                      <div
                        key={thread.id}
                        className={`thread-item ${currentThreadId === thread.id ? "active" : ""} ${editingThreadId === thread.id ? "editing" : ""}`}
                        onClick={() =>
                          editingThreadId !== thread.id && loadThread(thread.id)
                        }
                      >
                        <div className="thread-info">
                          {editingThreadId === thread.id ? (
                            <input
                              type="text"
                              value={editingTitle}
                              onChange={(e) => setEditingTitle(e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  saveThreadTitle(thread.id);
                                } else if (e.key === "Escape") {
                                  cancelEditingThread();
                                }
                              }}
                              className="thread-title-input"
                              autoFocus
                            />
                          ) : (
                            <span className="thread-title">{thread.title}</span>
                          )}
                          <span className="thread-date">
                            {new Date(thread.updated_at).toLocaleDateString(
                              "fi-FI",
                            )}
                          </span>
                        </div>
                        <div className="thread-actions">
                          {editingThreadId === thread.id ? (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  saveThreadTitle(thread.id);
                                }}
                                className="save-thread-btn"
                                title={t("chat.buttons.save")}
                              >
                                ✓
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  cancelEditingThread();
                                }}
                                className="cancel-thread-btn"
                                title={t("chat.buttons.cancel")}
                              >
                                ✕
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startEditingThread(thread);
                                }}
                                className="edit-thread-btn"
                                title={t("accessibility.editName")}
                              >
                                ✎
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteThread(thread.id);
                                }}
                                className="delete-thread-btn"
                                title={t("chat.buttons.deleteChat")}
                              >
                                ✕
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Tietokanta-tabi */}
            {sidebarTab === "database" && (
              <>
                {/* Upload-alue - näytetään vain owner ja admin rooleille */}
                {(organization?.role === "owner" ||
                  organization?.role === "admin") && (
                  <div className="sidebar-upload">
                    <div
                      ref={dropRef}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`file-drop-zone ${dragActive ? "active" : ""}`}
                      onClick={() =>
                        dropRef.current &&
                        dropRef.current
                          .querySelector("input[type=file]")
                          .click()
                      }
                    >
                      <span className="drop-icon">↑</span>
                      <p>
                        {t("assistant.files.uploadCard.dragText")}{" "}
                        <span className="link-text">
                          {t("assistant.files.uploadCard.chooseFiles")}
                        </span>
                      </p>
                      <input
                        type="file"
                        multiple
                        accept=".pdf,.txt,.md,.rtf,image/*,.mp3"
                        style={{ display: "none" }}
                        onChange={handleFileInput}
                      />
                    </div>

                    {pendingFiles.length > 0 && (
                      <div className="pending-files">
                        {pendingFiles.map((f) => (
                          <div
                            key={f.name + f.size}
                            className="pending-file-item"
                          >
                            <span className="file-name">{f.name}</span>
                            <button
                              onClick={() =>
                                handleRemovePending(f.name, f.size)
                              }
                              className="remove-btn"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={handleUploadPending}
                          disabled={uploadLoading}
                          className="upload-btn"
                        >
                          {uploadLoading
                            ? t("assistant.files.uploadCard.uploading")
                            : t("assistant.files.uploadCard.uploadBtn", {
                                count: pendingFiles.length,
                              })}
                        </button>
                      </div>
                    )}

                    {uploadError && <p className="error-msg">{uploadError}</p>}
                    {uploadSuccess && (
                      <p className="success-msg">{uploadSuccess}</p>
                    )}
                  </div>
                )}

                {/* Info-viesti jäsenille, jotka eivät voi lisätä tiedostoja */}
                {organization?.role === "member" && (
                  <div className="sidebar-upload-info">
                    <p>{t("assistant.files.uploadCard.memberInfo")}</p>
                  </div>
                )}

                {/* Tiedostolista - näytetään kaikille käyttäjille */}
                <div className="sidebar-files">
                  <h3>
                    {t("assistant.files.list.title")} ({files.length})
                  </h3>
                  <div className="files-list" ref={filesListRef}>
                    {filesLoading ? (
                      <div className="loading-state">
                        <div className="loading-spinner small"></div>
                      </div>
                    ) : filesError ? (
                      <p className="error-state">{filesError}</p>
                    ) : files.length === 0 ? (
                      <p className="empty-state">
                        {t("assistant.files.list.empty")}
                      </p>
                    ) : (
                      files.map((file) => (
                        <div key={file.file_name} className="file-item">
                          <span className="file-icon">•</span>
                          <span className="file-name">
                            {file.file_name || file.filename}
                          </span>
                          {(organization?.role === "owner" ||
                            organization?.role === "admin") && (
                            <button
                              onClick={() => handleFileDeletion(file.id)}
                              className="delete-btn"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Pääsisältö - Chat */}
          <div className="modern-chat-main">
            {/* Header */}
            <div className="chat-header">
              <h1>{t("assistant.title")}</h1>
              <div className="assistant-type-selector">
                <button
                  className={`assistant-type-btn ${assistantType === "marketing" ? "active" : ""}`}
                  onClick={() => {
                    if (assistantType !== "marketing") {
                      setAssistantType("marketing");
                      setCurrentThreadId(null);
                      setThreadId(null);
                      setMessages([]);
                      localStorage.removeItem("rascalai_threadId");
                      fetchThreads();
                    }
                  }}
                >
                  {t("assistant.types.marketing")}
                </button>
                <button
                  className={`assistant-type-btn ${assistantType === "sales" ? "active" : ""}`}
                  onClick={() => {
                    if (assistantType !== "sales") {
                      setAssistantType("sales");
                      setCurrentThreadId(null);
                      setThreadId(null);
                      setMessages([]);
                      localStorage.removeItem("rascalai_threadId");
                      fetchThreads();
                    }
                  }}
                >
                  {t("assistant.types.sales")}
                </button>
              </div>
              <button
                onClick={() => {
                  setSidebarOpen(true);
                  setSidebarTab("database");
                }}
                className="files-toggle"
              >
                {t("assistant.threads.databaseLink", { count: files.length })}
              </button>
            </div>

            {/* Viestit */}
            <div className="chat-messages">
              <div className="messages-container">
                {messages.length === 0 ? (
                  <div className="welcome-screen">
                    <div className="welcome-icon">AI</div>
                    <h2>{t("assistant.welcome.title")}</h2>
                    <p>{t("assistant.welcome.description")}</p>
                  </div>
                ) : (
                  <>
                    {messages.map((message, index) => {
                      // DEBUG: Tulosta role konsoliin
                      console.log(
                        `Viesti ${index}: role="${message.role}" (tyyppi: ${typeof message.role})`,
                      );

                      // Safari-optimointi: Käytä sisällön perusteella luotua keyta joka varmistaa re-renderin kun sisältö muuttuu
                      // Yhdistä role, sisältö ja index stabiiliksi keyksi
                      const contentHash = message.content
                        ? message.content.substring(0, 100).replace(/\s/g, "")
                        : "";
                      const messageKey = `${message.role}-${index}-${contentHash}`;

                      return (
                        <div
                          key={messageKey}
                          className={`message ${message.role} ${message.isProcessing ? "processing" : ""}`}
                        >
                          <div
                            className="message-avatar"
                            title={`Role: ${message.role}`}
                          >
                            {message.role === "assistant"
                              ? t("assistant.labels.ai")
                              : t("assistant.labels.me")}
                          </div>
                          <div className="message-content">
                            {message.isProcessing ? (
                              <div className="processing-content">
                                <div className="typing-indicator">
                                  <span></span>
                                  <span></span>
                                  <span></span>
                                </div>
                                <span>{message.content}</span>
                              </div>
                            ) : message.role === "assistant" ? (
                              <ReactMarkdown>{message.content}</ReactMarkdown>
                            ) : (
                              <p>{message.content}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {loading && (
                      <div className="message assistant">
                        <div className="message-avatar">AI</div>
                        <div className="message-content">
                          <div className="typing-indicator">
                            <span></span>
                            <span></span>
                            <span></span>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>
            </div>

            {/* Syöttökenttä */}
            <div className="chat-input-wrapper">
              <form onSubmit={handleSendMessage} className="chat-input-form">
                <button
                  type="button"
                  onClick={handleNewChat}
                  className="new-chat-btn-input"
                  title={t("chat.buttons.newChat")}
                >
                  +
                </button>
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t("assistant.inputPlaceholder")}
                  disabled={loading}
                  className="chat-input"
                  rows={1}
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="send-btn"
                  title={t("assistant.send")}
                >
                  {loading ? "..." : "→"}
                </button>
              </form>
              <p className="input-hint">{t("assistant.hints.enterToSend")}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
