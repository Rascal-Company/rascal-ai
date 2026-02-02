import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getCurrentUser } from "../utils/userApi";
import CallDetailModal from "../components/calls/CallDetailModal";
import { supabase } from "../lib/supabase";
import AddCallTypeModal from "../components/AddCallTypeModal";
import EditCallTypeModal from "../components/EditCallTypeModal";
import EditInboundSettingsModal from "../components/EditInboundSettingsModal";
import CRM from "../components/crm.jsx";
import CallStats from "./CallStats";
import CallsTab from "../components/calls/CallsTab";
import CallLogsTab from "../components/calls/CallLogsTab";
import MessageLogsTab from "../components/calls/MessageLogsTab";
import CallsKnowledgeBaseModal from "../components/calls/CallsKnowledgeBaseModal";
import InboundSettingsModal from "../components/calls/InboundSettingsModal";
import MassCallModal from "../components/calls/MassCallModal";
import SingleCallModal from "../components/calls/SingleCallModal";
import { useTranslation } from "react-i18next";
import Button from "../components/Button";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { getUserOrgId } from "../lib/getUserOrgId";
import axios from "axios";
import PageMeta from "../components/PageMeta";
import { useFeatures } from "../hooks/useFeatures";
import ExportCallLogsModal from "../components/ExportCallLogsModal";

export default function CallPanel() {
  const { user, organization } = useAuth();
  const toast = useToast();
  const { has: hasFeature, crmConnected } = useFeatures();
  const { t } = useTranslation("common");
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Kovakoodatut tarkistukset
  const isMika = user?.email === "mika.jarvinen@kuudesaisti.fi";
  const hasCRM =
    hasFeature("CRM") &&
    (crmConnected === true || Boolean(user?.crm_connected));
  const isAdmin = user?.email === "sami@mak8r.fi";
  const [sheetUrl, setSheetUrl] = useState("");
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [error, setError] = useState("");
  const [singleCallError, setSingleCallError] = useState("");
  const [starting, setStarting] = useState(false);
  const [callStatus, setCallStatus] = useState(null);
  const [polling, setPolling] = useState(false);
  const pollingRef = useRef(null);

  // Uudet state-muuttujat
  const [callType, setCallType] = useState("AI-assarin kartoitus");
  const [script, setScript] = useState(
    "Hei! Soitan [Yritys] puolesta. Meillä on kiinnostava tarjous teille...",
  );
  const [selectedVoice, setSelectedVoice] = useState("rascal-nainen-1");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [name, setName] = useState("");
  const [calling, setCalling] = useState(false);
  const [singleCallSmsFirst, setSingleCallSmsFirst] = useState(false);
  const [singleCallSmsAfterCall, setSingleCallSmsAfterCall] = useState(false);
  const [singleCallSmsMissedCall, setSingleCallSmsMissedCall] = useState(false);
  const [inboundVoice, setInboundVoice] = useState("rascal-nainen-1");
  const [inboundScript, setInboundScript] = useState(
    "Kiitos soitostasi! Olen AI-assistentti ja autan sinua mielellään...",
  );
  const [inboundWelcomeMessage, setInboundWelcomeMessage] = useState(
    "Kiitos soitostasi! Olen AI-assistentti ja autan sinua mielellään...",
  );
  const [inboundSettingsId, setInboundSettingsId] = useState(null);
  const [inboundSettingsLoaded, setInboundSettingsLoaded] = useState(false);
  const [showInboundModal, setShowInboundModal] = useState(false);
  const [showEditInboundModal, setShowEditInboundModal] = useState(false);
  const [editingInboundSettings, setEditingInboundSettings] = useState(null);
  const [aiEnhancementSent, setAiEnhancementSent] = useState(false);
  const [addModalAiEnhancementSent, setAddModalAiEnhancementSent] =
    useState(false);
  const [editModalAiEnhancementSent, setEditModalAiEnhancementSent] =
    useState(false);
  const [currentAudio, setCurrentAudio] = useState(null);
  const [audioInfo, setAudioInfo] = useState("");
  const audioElementsRef = useRef([]);

  // Lue URL-parametri aktiivisen välilehden määrittämiseen
  const tabFromUrl = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(tabFromUrl || "calls");
  const [editingCallType, setEditingCallType] = useState(null);
  const [newCallType, setNewCallType] = useState({
    callType: "",
    label: "",
    description: "",
    identity: "",
    style: "",
    guidelines: "",
    goals: "",
    first_line: "",
    intro: "",
    questions: "",
    outro: "",
    notes: "",
    version: "",
    status: "Active",
    language: "fi", // Kieli: fi, en, sv
    summary: "",
    success_assessment: "",
    first_sms: "", // Uusi kenttä: Ensimmäinen SMS
    after_call_sms: "", // Uusi kenttä: SMS vastatun puhelun jälkeen
    missed_call_sms: "", // Uusi kenttä: SMS kun puheluun ei vastattu
  });
  const [callTypes, setCallTypes] = useState([]);
  const [loadingCallTypes, setLoadingCallTypes] = useState(true);
  const [addTypeLoading, setAddTypeLoading] = useState(false);
  const [addTypeError, setAddTypeError] = useState("");
  const [addTypeSuccess, setAddTypeSuccess] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Puhelulokien state-muuttujat
  const [callLogs, setCallLogs] = useState([]);
  const [loadingCallLogs, setLoadingCallLogs] = useState(false);
  const [callLogsError, setCallLogsError] = useState("");
  const [updatingLogIds, setUpdatingLogIds] = useState({});

  // Tilastot (haetaan erikseen ilman filttereitä)
  const [stats, setStats] = useState({
    answered: 0,
    successful: 0,
    failed: 0,
    pending: 0,
    inProgress: 0,
    totalCalls: 0, // Soittoyritykset (summa attempt_count, ei pending)
    totalLogs: 0, // Yhteensä (kaikki puhelut)
    calledCalls: 0, // Soitetut (vain done)
    outbound: 0,
    inbound: 0,
  });

  // Viestilokin state-muuttujat
  const [messageLogs, setMessageLogs] = useState([]);
  const [loadingMessageLogs, setLoadingMessageLogs] = useState(false);
  const [messageLogsError, setMessageLogsError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Export-modaali
  const [showExportModal, setShowExportModal] = useState(false);

  // Puheluiden tietokanta -modaali
  const [showCallsKnowledgeModal, setShowCallsKnowledgeModal] = useState(false);

  // Pagination ja filtterit
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [callTypeFilter, setCallTypeFilter] = useState("");
  const [directionFilter, setDirectionFilter] = useState("");
  const [wantsContactFilter, setWantsContactFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Järjestämismahdollisuudet
  const [sortField, setSortField] = useState("created_at");
  const [sortDirection, setSortDirection] = useState("desc");

  // Yksityiskohtainen näkymä
  const [selectedLog, setSelectedLog] = useState(null);
  const [showLogDetail, setShowLogDetail] = useState(false);
  const [loadingLogDetail, setLoadingLogDetail] = useState(false);
  const [detailActiveTab, setDetailActiveTab] = useState("summary");
  const [showMoreDetails, setShowMoreDetails] = useState(false);

  const voiceOptions = [
    {
      value: "rascal-nainen-1",
      label: "Aurora (Nainen, Lämmin ja Ammattimainen)",
      id: "GGiK1UxbDRh5IRtHCTlK",
    },
    {
      value: "rascal-nainen-2",
      label: "Lumi (Nainen, Positiivinen ja Ilmeikäs)",
      id: "bEe5jYFAF6J2nz6vM8oo",
    },
    { value: "rascal-nainen-3", label: "Jessica", id: "cgSgspJ2msm6clMCkdW9" },
    {
      value: "rascal-mies-1",
      label: "Kai (Mies, Rauhallinen ja Luottamusta herättävä)",
      id: "waueh7VTxMDDIYKsIaYC",
    },
    {
      value: "rascal-mies-2",
      label: "Veeti (Mies, Nuorekas ja Energinen)",
      id: "s6UtVF1khAck9KlohM9j",
    },
  ];

  // Haetaan käyttäjän oma voice_id public.users-taulusta
  const [userVoiceId, setUserVoiceId] = useState(null);
  const [userVoiceLabel, setUserVoiceLabel] = useState("Oma ääni");

  // Lisätään isPlaying-state äänen toistoa varten
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio, setAudio] = useState(null);
  const [currentlyPlayingVoice, setCurrentlyPlayingVoice] = useState(null);
  const [isStopping, setIsStopping] = useState(false);

  // Mika Special - lomakehaku state-muuttujat
  const [mikaContacts, setMikaContacts] = useState([]);
  const [loadingMikaContacts, setLoadingMikaContacts] = useState(false);
  const [mikaContactsError, setMikaContactsError] = useState("");
  const [mikaSearchName, setMikaSearchName] = useState("");
  const [mikaSearchTitle, setMikaSearchTitle] = useState("");
  const [mikaSearchOrganization, setMikaSearchOrganization] = useState("");
  const [mikaSearchResults, setMikaSearchResults] = useState([]);
  const [mikaSearchLoading, setMikaSearchLoading] = useState(false);

  // Massapuhelumodaalin state-muuttujat
  const [showMassCallModal, setShowMassCallModal] = useState(false);
  const [massCallStep, setMassCallStep] = useState(1); // 1: sheets, 2: settings, 3: schedule
  const [massCallSheetUrl, setMassCallSheetUrl] = useState("");
  const [massCallValidating, setMassCallValidating] = useState(false);
  const [massCallValidationResult, setMassCallValidationResult] =
    useState(null);
  const [massCallError, setMassCallError] = useState("");
  const [massCallCallType, setMassCallCallType] = useState("");
  const [massCallSelectedVoice, setMassCallSelectedVoice] =
    useState("rascal-nainen-1");
  const [massCallScheduledDate, setMassCallScheduledDate] = useState("");
  const [massCallScheduledTime, setMassCallScheduledTime] = useState("");
  const [massCallStarting, setMassCallStarting] = useState(false);
  const [massCallScheduling, setMassCallScheduling] = useState(false);
  const [massCallSmsFirst, setMassCallSmsFirst] = useState(false);
  const [massCallSmsAfterCall, setMassCallSmsAfterCall] = useState(false);
  const [massCallSmsMissedCall, setMassCallSmsMissedCall] = useState(false);
  const [massCallCampaignId, setMassCallCampaignId] = useState("");
  const [massCallSegmentId, setMassCallSegmentId] = useState("");
  const [massCallCampaigns, setMassCallCampaigns] = useState([]);
  const [massCallSegments, setMassCallSegments] = useState([]);

  // Yksittäisen puhelun modaali
  const [showSingleCallModal, setShowSingleCallModal] = useState(false);

  useEffect(() => {
    const fetchUserVoiceId = async () => {
      if (!user?.id) return;
      try {
        // Hae käyttäjätiedot API:n kautta
        const data = await getCurrentUser();

        if (data?.voice_id) {
          setUserVoiceId(data.voice_id);
          setUserVoiceLabel("Oma ääni");
          // Aseta selectedVoice käyttäjän oman äänen voice_id:ksi
          setSelectedVoice(data.voice_id);
        }
      } catch (err) {
        console.error("Error in fetchUserVoiceId:", err);
      }
    };
    fetchUserVoiceId();
  }, [user]);

  // Synkronoi URL-parametri aktiivisen välilehden kanssa (vain jos URL muuttui)
  useEffect(() => {
    const urlTab = searchParams.get("tab") || "calls";
    if (
      ["calls", "logs", "messages", "textmessages", "manage", "mika"].includes(
        urlTab,
      ) &&
      urlTab !== activeTab
    ) {
      setActiveTab(urlTab);
    }
  }, [searchParams]); // Vain searchParams riippuvuus, ei activeTab

  // Päivitä URL kun aktiivinen välilehti muuttuu käyttäjän toimesta (ei URL:sta)
  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    const newSearchParams = new URLSearchParams(searchParams);
    if (newTab === "calls") {
      newSearchParams.delete("tab");
    } else {
      newSearchParams.set("tab", newTab);
    }
    setSearchParams(newSearchParams, { replace: true });
  };

  // Hae puheluloki ja call types kun käyttäjä muuttuu
  useEffect(() => {
    if (user?.id) {
      fetchCallLogs();
      fetchCallTypes();
      // Tilastot lasketaan jatkossa suodatetusta callLogs-datasta
    }
  }, [user?.id]);

  // Helperit tabin avauksiin
  const openMassCallModal = () => setShowMassCallModal(true);
  const openSingleCallModal = () => {
    setShowSingleCallModal(true);
  };

  // Pysäytä kaikki äänielementit
  const stopAllAudio = () => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }

    audioElementsRef.current.forEach((audio) => {
      if (audio && !audio.paused) {
        audio.pause();
        audio.currentTime = 0;
      }
    });

    audioElementsRef.current = [];
    setCurrentAudio(null);
    setIsPlaying(false);
    setCurrentlyPlayingVoice(null);
    setAudioInfo("");
  };

  // Ääninäytteen toisto
  const playVoiceSample = (voiceValue) => {
    if (isPlaying && audio) {
      audio.pause();
      audio.currentTime = 0;
      setIsPlaying(false);
      setAudio(null);
      return;
    }
    const newAudio = new Audio(`/${voiceValue}.mp3`);
    setAudio(newAudio);
    newAudio.play();
    setIsPlaying(true);
    newAudio.onended = () => {
      setIsPlaying(false);
      setAudio(null);
    };
  };

  // Muunna kesto muotoon min:sec
  const formatDuration = (duration) => {
    if (!duration) return "-";

    // Jos duration on jo muodossa "mm:ss", palauta se sellaisenaan
    if (typeof duration === "string" && duration.includes(":")) {
      return duration;
    }

    // Jos duration on sekunneissa (numero tai string), muunna muotoon "mm:ss"
    const seconds = parseInt(duration);
    if (!isNaN(seconds)) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
    }

    // Jos ei voida muuntaa, palauta alkuperäinen arvo
    return duration;
  };

  const handleValidate = async () => {
    setValidating(true);
    setError("");
    setValidationResult(null);
    try {
      // Hae user_id Supabasesta
      const user_id = user?.id;

      const res = await fetch("/api/integrations/validate-sheet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sheetUrl, user_id }),
      });

      const data = await res.json();

      if (data.success) {
        setValidationResult(data);
        setStats({
          totalCount: data.phoneCount || 0,
          calledCount: 0,
          failedCount: 0,
        });
      } else {
        setError(data.error || "Validointi epäonnistui");
      }
    } catch (e) {
      console.error("❌ Validate-sheet virhe:", e);
      console.error("❌ Virheen response:", e.response);
      console.error("❌ Virheen message:", e.message);

      const errorMessage = e.response?.data?.error || "Validointi epäonnistui";
      setError(
        typeof errorMessage === "string"
          ? errorMessage
          : JSON.stringify(errorMessage),
      );
    } finally {
      setValidating(false);
    }
  };

  // Apufunktio puhelinnumeron normalisointiin kansainväliseen muotoon
  const normalizePhoneNumber = (phoneNumber) => {
    if (!phoneNumber) return null;
    let x = String(phoneNumber).trim();
    // Poista välilyönnit ja yhdysmerkit
    x = x.replace(/[\s-]/g, "");

    // Lisää +358 vain 0-alkuisiin numeroihin (suomalaiset)
    if (/^0\d+/.test(x)) {
      return "+358" + x.slice(1);
    }

    // Jos alkaa +:lla, palauta sellaisenaan (kansainväliset numerot)
    if (x.startsWith("+")) {
      return x;
    }

    // Kaikki muut hylätään (ei maakoodia)
    return null;
  };

  const handleStartCalls = async () => {
    setStarting(true);
    setError("");
    try {
      // Tarkista onko kyseessä Mika Special -data
      const isMikaSpecialData =
        validationResult?.data &&
        Array.isArray(validationResult.data) &&
        validationResult.data.length > 0;

      if (isMikaSpecialData) {
        // Käytä Mika Special mass-call v2 API:a

        const response = await fetch("/api/calls/mass", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(session?.access_token
              ? { Authorization: `Bearer ${session.access_token}` }
              : {}),
          },
          body: JSON.stringify({
            source: "contacts",
            contacts: validationResult.data,
            callType: callType,
            script: script,
            voice_id: selectedVoice,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Mika mass-call epäonnistui");
        }

        setPolling(true);
        toast.success(
          `Mass-call käynnistetty! Aloitettu: ${result.startedCalls} puhelua, Ohitettu: ${result.failedCalls} kontakti`,
        );
      } else {
        // Käytä normaalia mass-call API:a Google Sheets -datalle

        // Hae user_id Supabasesta
        const user_id = user?.id;

        // Hae organisaation ID (public.users.id)
        const publicUserId = await getUserOrgId(user_id);
        if (!publicUserId) {
          throw new Error("Organisaation ID ei löytynyt");
        }

        // Hae call_type_id call_types taulusta
        const { data: callTypeData, error: callTypeError } = await supabase
          .from("call_types")
          .select("id")
          .eq("name", callType)
          .eq("user_id", publicUserId) // Käytetään organisaation ID:tä
          .single();

        if (callTypeError || !callTypeData) {
          throw new Error("Puhelun tyyppiä ei löytynyt");
        }

        const call_type_id = callTypeData.id;

        // Käytä validationResult.rows dataa ja lisää jokainen suoraan Supabaseen
        if (!validationResult || !validationResult.rows) {
          throw new Error("Validointi pitää suorittaa ensin");
        }

        const callLogs = [];
        let successCount = 0;
        let errorCount = 0;

        // Etsi sarakkeiden otsikot ensin
        let nameColumn = null;
        let phoneColumn = null;
        let emailColumn = null;

        // Etsi nimisarakkeen otsikko
        for (const columnName of validationResult.columns || []) {
          if (
            columnName.toLowerCase().includes("name") ||
            columnName.toLowerCase().includes("nimi") ||
            columnName.toLowerCase().includes("etunimi") ||
            columnName.toLowerCase().includes("sukunimi")
          ) {
            nameColumn = columnName;
            break;
          }
        }

        // Etsi puhelinnumerosarakkeen otsikko
        for (const columnName of validationResult.columns || []) {
          if (
            columnName.toLowerCase().includes("phone") ||
            columnName.toLowerCase().includes("puhelin") ||
            columnName.toLowerCase().includes("numero") ||
            columnName.toLowerCase().includes("tel")
          ) {
            phoneColumn = columnName;
            break;
          }
        }

        // Etsi sähköpostisarakkeen otsikko (tiukempi tunnistus)
        for (const columnName of validationResult.columns || []) {
          const lower = String(columnName).toLowerCase().trim();
          if (
            lower === "email" ||
            lower === "e-mail" ||
            lower.includes("email") ||
            lower.includes("sähköposti") ||
            lower.includes("sahkoposti")
          ) {
            emailColumn = columnName;
            break;
          }
        }

        if (!nameColumn || !phoneColumn) {
          throw new Error(
            "Vaadittuja sarakkeita ei löytynyt. Tarvitaan sekä nimisarakke että puhelinnumerosarakke.",
          );
        }

        for (const [rowIndex, row] of (validationResult.rows || []).entries()) {
          // Hae arvot sarakkeiden otsikoiden perusteella
          const phoneNumber = normalizePhoneNumber(row[phoneColumn]);
          const name = row[nameColumn] ? row[nameColumn].trim() : null;
          // Ota CRM-kontaktin id Mika Special -datasta, jos saatavilla
          const crmId =
            Array.isArray(validationResult.data) &&
            validationResult.data[rowIndex] &&
            validationResult.data[rowIndex].id
              ? String(validationResult.data[rowIndex].id)
              : row.id
                ? String(row.id)
                : null;

          // Lisää vain jos on sekä selkeä nimi että puhelinnumero
          if (
            name &&
            phoneNumber &&
            name.trim() !== "" &&
            phoneNumber.trim() !== "" &&
            phoneNumber.startsWith("+358")
          ) {
            // Ota sähköposti sarakkeesta, validoi ja fallbackaa jos otsikkoa ei löytynyt
            const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/i;
            let emailValue = null;
            if (emailColumn) {
              const raw = row[emailColumn];
              if (raw && emailRegex.test(String(raw).trim())) {
                emailValue = String(raw).trim().toLowerCase().substring(0, 120);
              }
            } else {
              // Fallback: etsi mikä tahansa sähköpostin näköinen arvo riviltä
              for (const key of Object.keys(row)) {
                const val = row[key];
                if (val && emailRegex.test(String(val).trim())) {
                  emailValue = String(val)
                    .trim()
                    .toLowerCase()
                    .substring(0, 120);
                  break;
                }
              }
            }
            // Hae valitun äänen id
            const selectedVoiceObj = getVoiceOptions().find(
              (v) => v.value === selectedVoice,
            );
            const voiceId = selectedVoiceObj?.id;

            callLogs.push({
              user_id: publicUserId,
              customer_name: name.trim().substring(0, 100), // Rajaa 100 merkkiin (tietokannan rajoitus)
              phone_number: phoneNumber.trim().substring(0, 20), // Rajaa 20 merkkiin
              email: emailValue,
              call_type: callType.substring(0, 50), // Rajaa 50 merkkiin
              call_type_id: call_type_id,
              voice_id: voiceId, // Lisätty voice_id
              call_date: new Date().toISOString(),
              call_status: "pending",
              campaign_id: `mass-call-${Date.now()}`.substring(0, 100), // Rajaa 100 merkkiin
              summary: `Mass-call: ${script.trim().substring(0, 100)}...`,
              crm_id: crmId || null,
            });
          } else {
            errorCount++;
          }
        }

        if (callLogs.length === 0) {
          throw new Error(
            "Kelvollisia rivejä ei löytynyt. Varmista että riveillä on sekä nimi että kelvollinen suomalainen puhelinnumero.",
          );
        }

        // Lisää kaikki call_logs tauluun
        const { data: insertedLogs, error: insertError } = await supabase
          .from("call_logs")
          .insert(callLogs)
          .select();

        if (insertError) {
          throw new Error(
            "Virhe call_logs kirjoittamisessa: " + insertError.message,
          );
        }

        successCount = insertedLogs.length;

        setPolling(true);
        toast.success(
          `Mass-call käynnistetty! Aloitettu: ${successCount} puhelua, Ohitettu: ${errorCount} riviä`,
        );
      }
    } catch (e) {
      const errorMessage = e.message || "Soittojen käynnistys epäonnistui";
      setError(
        typeof errorMessage === "string"
          ? errorMessage
          : JSON.stringify(errorMessage),
      );
    } finally {
      setStarting(false);
    }
  };

  const handleSingleCall = async () => {
    setCalling(true);
    setSingleCallError("");
    try {
      // Normalisoi puhelinnumero
      const normalizedPhoneNumber = normalizePhoneNumber(phoneNumber);

      if (!normalizedPhoneNumber || !normalizedPhoneNumber.startsWith("+")) {
        setSingleCallError(
          "Kelvollinen puhelinnumero maakoodilla vaaditaan (esim. +358401234567)",
        );
        setCalling(false);
        return;
      }

      // Etsi valitun puhelun tyypin call_type_id
      const selectedCallType = callTypes.find(
        (type) => type.value === callType,
      );
      const call_type_id = selectedCallType?.id;

      if (!call_type_id) {
        setSingleCallError("Puhelun tyypin tunniste ei löytynyt");
        setCalling(false);
        return;
      }

      // Hae valitun äänen id
      const selectedVoiceObj = getVoiceOptions().find(
        (v) => v.value === selectedVoice,
      );
      let voiceId = selectedVoiceObj?.id;

      // Jos voiceId ei löytynyt, käytä selectedVoice suoraan (voi olla käyttäjän oma ääni UUID)
      if (!voiceId && selectedVoice) {
        // Tarkista onko selectedVoice jo UUID-muodossa (oma ääni)
        // UUID-muoto: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
        const uuidRegex =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(selectedVoice)) {
          voiceId = selectedVoice;
        } else {
          // Jos ei UUID, etsi id:llä
          const voiceById = getVoiceOptions().find(
            (v) => v.id === selectedVoice,
          );
          voiceId = voiceById?.id || selectedVoice;
        }
      }

      if (!voiceId) {
        setSingleCallError("Äänen tunniste ei löytynyt");
        setCalling(false);
        return;
      }

      const response = await axios.post("/api/calls/single", {
        phoneNumber: normalizedPhoneNumber,
        name,
        callType,
        callTypeId: call_type_id,
        script,
        voiceId: voiceId,
        userId: user?.id,
        sms_first: singleCallSmsFirst === true,
        sms_after_call: singleCallSmsAfterCall === true,
        sms_missed_call: singleCallSmsMissedCall === true,
      });

      const result = response.data;

      if (result.success) {
        alert(`✅ ${result.message}`);
        setPhoneNumber("");
        setName("");
      } else {
        const errorMsg = result.error || "Puhelun käynnistys epäonnistui";
        setSingleCallError(
          typeof errorMsg === "string" ? errorMsg : JSON.stringify(errorMsg),
        );
      }
    } catch (e) {
      console.error("Single call error:", e);
      const errorMessage =
        e.response?.data?.error || "Yksittäisen puhelun aloitus epäonnistui";
      setSingleCallError(
        typeof errorMessage === "string"
          ? errorMessage
          : JSON.stringify(errorMessage),
      );
    } finally {
      setCalling(false);
    }
  };

  const handleSaveInboundSettings = async () => {
    setError("");
    try {
      const inboundVoiceObj = getVoiceOptions().find(
        (v) => v.value === inboundVoice,
      );
      const inboundVoiceId = inboundVoiceObj?.id;

      // Hae käyttäjän tiedot API:n kautta
      const userProfile = await getCurrentUser();

      if (!userProfile) {
        setError("Käyttäjää ei löytynyt");
        return;
      }

      // Käytä uutta API endpointia webhook-integraatiolla
      const response = await fetch("/api/calls/inbound-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          voiceId: inboundVoiceId,
          script: inboundScript,
          welcomeMessage: inboundWelcomeMessage,
          userId: user.id, // auth_user_id
          userEmail: userProfile.contact_email,
          userName: userProfile.contact_person,
          companyName: userProfile.company_name,
          vapiInboundAssistantId: userProfile.vapi_inbound_assistant_id,
          inboundSettingsId: inboundSettingsId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        // Tarkista onko kyseessä N8N workflow virhe
        if (
          result.error &&
          result.error.includes("N8N workflow ei ole aktiivinen")
        ) {
          alert(t("alerts.success.inboundSettingsSaved"));
        } else {
          throw new Error(
            result.error || "Inbound-asetusten tallennus epäonnistui",
          );
        }
      } else {
        alert("✅ Inbound-asetukset tallennettu onnistuneesti!");
      }
    } catch (e) {
      console.error("Inbound settings error:", e);
      setError("Inbound-asetusten tallennus epäonnistui: " + (e.message || e));
    }
  };

  const handleSaveEditInboundSettings = async () => {
    setError("");
    try {
      if (!editingInboundSettings) return;

      const inboundVoiceObj = getVoiceOptions().find(
        (v) => v.value === editingInboundSettings.voice,
      );
      const inboundVoiceId = inboundVoiceObj?.id;

      // Hae käyttäjän tiedot API:n kautta
      const userProfile = await getCurrentUser();

      if (!userProfile) {
        setError("Käyttäjää ei löytynyt");
        return;
      }

      // Käytä uutta API endpointia webhook-integraatiolla
      const response = await fetch("/api/calls/inbound-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          voiceId: inboundVoiceId,
          script: editingInboundSettings.script,
          welcomeMessage: editingInboundSettings.welcomeMessage,
          userId: user.id, // auth_user_id
          userEmail: userProfile.contact_email,
          userName: userProfile.contact_person,
          companyName: userProfile.company_name,
          vapiInboundAssistantId: userProfile.vapi_inbound_assistant_id,
          inboundSettingsId: inboundSettingsId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        // Tarkista onko kyseessä N8N workflow virhe
        if (
          result.error &&
          result.error.includes("N8N workflow ei ole aktiivinen")
        ) {
          alert(t("alerts.success.inboundSettingsSaved"));
        } else {
          throw new Error(
            result.error || "Inbound-asetusten tallennus epäonnistui",
          );
        }
      } else {
        // Päivitä paikalliset state-muuttujat
        setInboundVoice(editingInboundSettings.voice);
        setInboundScript(editingInboundSettings.script);
        setInboundWelcomeMessage(editingInboundSettings.welcomeMessage);
        alert("✅ Inbound-asetukset tallennettu onnistuneesti!");
      }
    } catch (e) {
      console.error("Inbound settings error:", e);
      setError("Inbound-asetusten tallennus epäonnistui: " + (e.message || e));
    }
  };

  // Puhelun tyyppien hallinta - N8N-integraatio
  const handleSaveCallType = async () => {
    try {
      // Validoi että editingCallType ja sen ID on olemassa
      if (!editingCallType || !editingCallType.id) {
        toast.error(
          t("alerts.error.callTypeIdMissing", "Puhelutyypin ID puuttuu"),
        );
        return;
      }

      // Päivitä olemassa oleva puhelutyyppi Supabase-tietokannassa
      const fields = {
        name: editingCallType.name || editingCallType.callType,
        agent_name: editingCallType.agent_name || "",
        target_audience: editingCallType.target_audience || "",
        identity: editingCallType.identity || "",
        style: editingCallType.style || "",
        guidelines: editingCallType.guidelines || "",
        goals: editingCallType.goals || "",
        first_line: editingCallType.first_line || "",
        intro: editingCallType.intro || "",
        questions: editingCallType.questions || "",
        outro: editingCallType.outro || "",
        notes: editingCallType.notes || "",
        version: editingCallType.version || "v1.0",
        status: editingCallType.status || "Active",
        language: editingCallType.language || "fi",
        summary: editingCallType.summary || "",
        success_assessment: editingCallType.success_assessment || "",
        action: editingCallType.action || "", // Action-kenttä
        first_sms: editingCallType.first_sms || "", // Uusi kenttä
        after_call_sms: editingCallType.after_call_sms || "", // Uusi kenttä
        missed_call_sms: editingCallType.missed_call_sms || "", // Uusi kenttä
      };

      const { error } = await supabase
        .from("call_types")
        .update(fields)
        .eq("id", editingCallType.id);

      if (!error) {
        toast.success(t("alerts.success.callTypeUpdated"));
        fetchCallTypes(); // Päivitä lista
        setEditingCallType(null);
        setShowEditModal(false);
      } else {
        throw new Error("Päivitys epäonnistui");
      }
    } catch (error) {
      console.error("Puhelun tyypin tallennus epäonnistui:", error);
      toast.error(
        t("alerts.error.callTypeSaveFailed", { error: error.message || error }),
      );
    }
  };

  const [deletingCallTypes, setDeletingCallTypes] = useState(new Set());

  const handleDeleteCallType = async (recordId) => {
    if (!confirm("Haluatko varmasti poistaa tämän puhelun tyypin?")) {
      return;
    }

    // Estetään useita poistoja samalle tyypille
    if (deletingCallTypes.has(recordId)) {
      return;
    }

    setDeletingCallTypes((prev) => new Set(prev).add(recordId));

    try {
      const { error } = await supabase
        .from("call_types")
        .delete()
        .eq("id", recordId);
      if (!error) {
        // Käytä toast-viestiä alertin sijaan
        setSuccessMessage("Puhelun tyyppi poistettu onnistuneesti!");
        setTimeout(() => setSuccessMessage(""), 3000);
        fetchCallTypes();
      } else {
        throw new Error("Poisto epäonnistui");
      }
    } catch (error) {
      console.error("Puhelun tyypin poisto epäonnistui:", error);
      setErrorMessage(
        "Puhelun tyypin poisto epäonnistui: " + (error.message || error),
      );
      setTimeout(() => setErrorMessage(""), 5000);
    } finally {
      setDeletingCallTypes((prev) => {
        const newSet = new Set(prev);
        newSet.delete(recordId);
        return newSet;
      });
    }
  };

  // Päivitä skripti kun puhelutyyppi muuttuu
  const updateScriptFromCallType = (selectedCallType) => {
    const selectedType = callTypes.find(
      (type) => type.value === selectedCallType,
    );
    if (selectedType) {
      // Käytä intro-kenttää skriptinä, koska se on puhelun aloitus
      if (selectedType.intro) {
        setScript(selectedType.intro);
      } else {
        setScript("");
      }
    }
  };

  // Hae puhelun tyypit komponentin latauksen yhteydessä
  const fetchCallTypes = async () => {
    setLoadingCallTypes(true);
    try {
      if (!user?.id) {
        setCallTypes([]);
        return;
      }

      // Hae organisaation ID (public.users.id)
      const orgId = await getUserOrgId(user.id);
      if (!orgId) {
        setCallTypes([]);
        return;
      }

      // Hae call_types käyttäen organisaation ID:tä
      const { data, error } = await supabase
        .from("call_types")
        .select("*")
        .eq("user_id", orgId) // Käytetään organisaation ID:tä
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formattedCallTypes = data.map((record) => ({
        value: record.name,
        label: record.name,
        id: record.id,
        ...record,
      }));
      setCallTypes(formattedCallTypes);
    } catch (e) {
      console.error("Error fetching call types:", e);
      setCallTypes([]);
    } finally {
      setLoadingCallTypes(false);
    }
  };

  // Lisätään uusi useEffect, joka varmistaa että callType on aina valittuna
  useEffect(() => {
    if (callTypes.length > 0) {
      const exists = callTypes.some((type) => type.value === callType);
      if (!callType || !exists) {
        setCallType(callTypes[0].value);
        updateScriptFromCallType(callTypes[0].value);
      }
    }
  }, [callTypes]);

  // Lisää uusi useEffect, joka varmistaa että callType on aina valittuna
  useEffect(() => {
    fetchCallTypes();
    fetchInboundSettings();
    // eslint-disable-next-line
  }, [user]);

  // Lisää uusi useEffect, joka varmistaa että callType on aina valittuna
  useEffect(() => {
    if (callTypes.length > 0) {
      const exists = callTypes.some((type) => type.value === callType);
      if (!callType || !exists) {
        setCallType(callTypes[0].value);
        updateScriptFromCallType(callTypes[0].value);
      }
    }
  }, [callTypes]);

  // Hae inbound-asetukset Supabaseesta
  const fetchInboundSettings = async () => {
    try {
      if (!user?.id || inboundSettingsLoaded) {
        return;
      }

      // Käytä organisaatiotietoja suoraan AuthContextista tai hae ID
      let orgId = organization?.id;

      if (!orgId) {
        // Fallback jos organization context ei ole valmis
        orgId = await getUserOrgId(user.id);
      }

      if (!orgId) {
        setInboundCallTypes([]);
        return;
      }

      const { data: inboundData, error: inboundError } = await supabase
        .from("inbound_call_types")
        .select("*")
        .eq("user_id", orgId) // Käytetään organisaation ID:tä
        .eq("is_active", true)
        .single();

      if (inboundError && inboundError.code !== "PGRST116") {
        console.error("Error fetching inbound settings:", inboundError);
        return;
      }

      if (inboundData) {
        // Aseta inbound-asetukset
        setInboundSettingsId(inboundData.id);
        if (inboundData.voice_id) {
          // Etsi äänen nimi voice_id:n perusteella
          const voiceOption = getVoiceOptions().find(
            (v) => v.id === inboundData.voice_id,
          );
          if (voiceOption) {
            setInboundVoice(voiceOption.value);
          }
        }
        if (inboundData.script) {
          setInboundScript(inboundData.script);
        }
        if (inboundData.welcome_message) {
          setInboundWelcomeMessage(inboundData.welcome_message);
        }
      }
      setInboundSettingsLoaded(true);
    } catch (e) {
      console.error("Error fetching inbound settings:", e);
      setInboundSettingsLoaded(true);
    }
  };

  const handleAddCallType = async () => {
    setAddTypeLoading(true);
    setAddTypeError("");
    setAddTypeSuccess("");
    try {
      if (!user?.id) {
        setAddTypeError("Käyttäjän tunniste puuttuu!");
        setAddTypeLoading(false);
        return;
      }

      // Hae organisaation ID (public.users.id)
      const orgId = await getUserOrgId(user.id);
      if (!orgId) {
        setAddTypeError("Organisaation ID ei löytynyt!");
        setAddTypeLoading(false);
        return;
      }

      const insertData = {
        user_id: orgId, // Käytetään organisaation ID:tä
        name: newCallType.callType,
        agent_name: newCallType.agent_name || "",
        target_audience: newCallType.target_audience || "",
        identity: newCallType.identity || "",
        style: newCallType.style || "",
        guidelines: newCallType.guidelines || "",
        goals: newCallType.goals || "",
        first_line: newCallType.first_line || "",
        intro: newCallType.intro || "",
        questions: newCallType.questions || "",
        outro: newCallType.outro || "",
        notes: newCallType.notes || "",
        version: newCallType.version || "v1.0",
        status: newCallType.status || "Active",
        language: newCallType.language || "fi",
        summary: newCallType.summary || "",
        success_assessment: newCallType.success_assessment || "",
        action: newCallType.action || "", // Action-kenttä
        first_sms: newCallType.first_sms || "", // Uusi kenttä
        after_call_sms: newCallType.after_call_sms || "", // Uusi kenttä
        missed_call_sms: newCallType.missed_call_sms || "", // Uusi kenttä
      };
      const { data: newCallTypeData, error } = await supabase
        .from("call_types")
        .insert([insertData])
        .select()
        .single();
      if (error) throw error;
      setAddTypeSuccess("Puhelutyyppi lisätty!");

      // Aseta ID takaisin newCallType objektiin AI-parannusta varten
      setNewCallType((prev) => ({ ...prev, id: newCallTypeData.id }));

      fetchCallTypes(); // Päivitä lista
    } catch (e) {
      setAddTypeError("Lisäys epäonnistui: " + (e.message || e));
    } finally {
      setAddTypeLoading(false);
    }
  };

  const closeModals = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setEditingCallType(null);
    setNewCallType({
      callType: "",
      label: "",
      description: "",
      identity: "",
      style: "",
      guidelines: "",
      goals: "",
      first_line: "",
      intro: "",
      questions: "",
      outro: "",
      notes: "",
      version: "",
      status: "Active",
      summary: "",
      success_assessment: "",
      first_sms: "", // Uusi kenttä
    });
    setAddTypeError("");
    setAddTypeSuccess("");
  };

  const openEditModal = (callType) => {
    setEditingCallType(callType);
    setShowEditModal(true);
    setEditModalAiEnhancementSent(false); // Reset flag kun modaali avataan
  };

  const openAddModal = () => {
    setShowAddModal(true);
    setAddModalAiEnhancementSent(false); // Reset flag kun modaali avataan
  };

  const openEditInboundModal = (inboundSettings) => {
    setEditingInboundSettings(inboundSettings);
    setShowEditInboundModal(true);
    setAiEnhancementSent(false); // Reset flag kun modaali avataan
  };

  // Lähetä inbound-asetukset AI-parannukseen
  const handleInboundAIEnhancement = async () => {
    try {
      if (!inboundSettingsId) {
        alert(t("calls.alerts.saveInboundFirst"));
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();
      const response = await fetch("/api/calls/type-improvement", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token
            ? { Authorization: `Bearer ${session.access_token}` }
            : {}),
        },
        body: JSON.stringify({
          inbound_settings_id: inboundSettingsId,
        }),
      });

      if (!response.ok) {
        // Tarkista onko vastaus JSON vai HTML
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Lähetys epäonnistui");
        } else {
          // Jos vastaus on HTML (404-sivu), endpoint ei löydy
          throw new Error(
            `API endpoint ei löydy (${response.status}). Tarkista että /api/calls/type-improvement on olemassa.`,
          );
        }
      }

      const result = await response.json();
      alert(t("alerts.success.aiEnhancementSent"));
      // Merkitse että AI-parannus on lähetetty
      setAiEnhancementSent(true);
      // Sulje modaali onnistuneen lähetyksen jälkeen
      setShowEditInboundModal(false);
      setEditingInboundSettings(null);
    } catch (error) {
      console.error("AI-parannuksen lähetys epäonnistui:", error);
      alert(
        t("alerts.error.aiEnhancementFailed", {
          error: error.message || error,
        }),
      );
    }
  };

  // Hae puheluloki N8N:n kautta - hakee kaikki rivit paginationilla
  // Hae tilastot erikseen (ilman filttereitä)
  const fetchStats = async () => {
    try {
      if (!user?.id) return;

      // Hae organisaation ID (public.users.id)
      const orgId = await getUserOrgId(user.id);
      if (!orgId) return;

      // Helper-funktio filttereiden soveltamiseen
      // HUOM: statusFilter ei vaikuta tilastoihin, vaan vain listan näyttämiseen
      const applyFilters = (query) => {
        // call_type filtteri (ei 'successful', koska se on erityinen filtteri)
        if (callTypeFilter && callTypeFilter !== "successful") {
          query = query.eq("call_type", callTypeFilter);
        }
        // direction filtteri
        if (directionFilter) {
          query = query.eq("direction", directionFilter);
        }
        // wants_contact filtteri
        if (wantsContactFilter !== "") {
          if (wantsContactFilter === "true") {
            query = query.eq("wants_contact", true);
          } else if (wantsContactFilter === "false") {
            query = query.eq("wants_contact", false);
          }
        }
        // Päivämäärä filtterit
        if (dateFrom) {
          query = query.gte("call_date", dateFrom);
        }
        if (dateTo) {
          const dateToEndOfDay = `${dateTo}T23:59:59.999Z`;
          query = query.lte("call_date", dateToEndOfDay);
        }
        return query;
      };

      // Hae tilastot COUNT-kyselyillä (paljon tehokkaampi kuin kaikkien rivien haku)
      // HUOM: Tilastot lasketaan filtteröidystä datasta (paitsi statusFilter, koska se määrittää mitä tilastoa näytetään)

      // Soittoyritykset: summa attempt_count-arvot (NULL = 1), ei pending-statusta
      // HUOM: Käytetään paginationia, koska Supabase palauttaa vain 1000 riviä oletuksena
      let attemptCountsBaseQuery = supabase
        .from("call_logs")
        .select("*", { count: "exact", head: true })
        .eq("user_id", orgId) // Käytetään organisaation ID:tä
        .neq("call_status", "pending"); // Ei pending-statusta

      // Sovella filtterit (paitsi statusFilter, koska se määrittää mitä tilastoa näytetään)
      attemptCountsBaseQuery = applyFilters(attemptCountsBaseQuery);

      // Hae ensin rivien kokonaismäärä
      const { count: attemptCountsTotal, error: countError } =
        await attemptCountsBaseQuery;

      let totalCalls = 0;
      let totalError = countError;

      if (countError) {
        console.error(
          "Soittoyritykset: Rivien määrän haku epäonnistui:",
          countError,
        );
      } else if (attemptCountsTotal && attemptCountsTotal > 0) {
        // Hae kaikki rivit erissä (1000 riviä per sivu)
        const pageSize = 1000;
        const totalPages = Math.ceil(attemptCountsTotal / pageSize);
        let allAttemptCounts = [];

        for (let page = 1; page <= totalPages; page++) {
          const startIndex = (page - 1) * pageSize;
          const endIndex = Math.min(
            startIndex + pageSize - 1,
            attemptCountsTotal - 1,
          );

          let attemptCountsQuery = supabase
            .from("call_logs")
            .select("attempt_count")
            .eq("user_id", orgId)
            .neq("call_status", "pending");
          attemptCountsQuery = applyFilters(attemptCountsQuery);
          attemptCountsQuery = attemptCountsQuery.range(startIndex, endIndex);

          const { data: pageAttemptCounts, error: pageError } =
            await attemptCountsQuery;

          if (pageError) {
            console.error(
              `Soittoyritykset: Sivun ${page} haku epäonnistui:`,
              pageError,
            );
            totalError = pageError;
            break;
          }

          allAttemptCounts = allAttemptCounts.concat(pageAttemptCounts || []);
        }

        // Laske summa
        totalCalls = allAttemptCounts.reduce((sum, log) => {
          // Jos attempt_count on NULL tai undefined, lasketaan 1
          const attempts =
            log.attempt_count != null ? Number(log.attempt_count) : 1;
          return sum + attempts;
        }, 0);
      }

      // Vastatut (done + answered)
      let answeredQuery = supabase
        .from("call_logs")
        .select("*", { count: "exact", head: true })
        .eq("user_id", orgId) // Käytetään organisaation ID:tä
        .eq("call_status", "done")
        .eq("answered", true);
      answeredQuery = applyFilters(answeredQuery);
      const { count: answered, error: answeredError } = await answeredQuery;

      // Onnistuneet: status === 'done' && answered === true && (outcome === 'success' || outcome === 'successful')
      // Sama logiikka kuin Kampanja-sivulla (api/campaigns.js)
      let successfulQuery = supabase
        .from("call_logs")
        .select("*", { count: "exact", head: true })
        .eq("user_id", orgId) // Käytetään organisaation ID:tä
        .eq("call_status", "done")
        .eq("answered", true)
        .or("call_outcome.eq.success,call_outcome.eq.successful");
      successfulQuery = applyFilters(successfulQuery);
      const { count: successful, error: successfulError } =
        await successfulQuery;

      // Epäonnistuneet: vastatut puhelut (answered=true) joilla call_outcome ei ole 'success' tai 'successful'
      // Tämä sisältää: failed, voice mail, ja muut epäonnistuneet tulokset
      // HUOM: Supabase ei tue .not('call_outcome', 'in', ...) suoraan, joten haetaan kaikki vastatut
      // ja suodatetaan ne joilla call_outcome ei ole 'success' tai 'successful'
      let failedQuery = supabase
        .from("call_logs")
        .select("call_outcome")
        .eq("user_id", orgId) // Käytetään organisaation ID:tä
        .eq("call_status", "done")
        .eq("answered", true);
      failedQuery = applyFilters(failedQuery);
      const { data: failedLogs, error: failedError } = await failedQuery;

      // Suodata client-puolella: poista ne joilla call_outcome on 'success' tai 'successful'
      const failed =
        failedLogs?.filter((log) => {
          const outcome = (log.call_outcome || "").toLowerCase();
          return outcome !== "success" && outcome !== "successful";
        }).length || 0;

      // Aikataulutettu
      let pendingQuery = supabase
        .from("call_logs")
        .select("*", { count: "exact", head: true })
        .eq("user_id", orgId) // Käytetään organisaation ID:tä
        .eq("call_status", "pending");
      pendingQuery = applyFilters(pendingQuery);
      const { count: pending, error: pendingError } = await pendingQuery;

      // Jonossa
      let inProgressQuery = supabase
        .from("call_logs")
        .select("*", { count: "exact", head: true })
        .eq("user_id", orgId) // Käytetään organisaation ID:tä
        .eq("call_status", "in progress");
      inProgressQuery = applyFilters(inProgressQuery);
      const { count: inProgress, error: inProgressError } =
        await inProgressQuery;

      if (
        totalError ||
        answeredError ||
        successfulError ||
        failedError ||
        pendingError ||
        inProgressError
      ) {
        console.error("Tilastojen haku epäonnistui:", {
          totalError,
          answeredError,
          successfulError,
          failedError,
          pendingError,
          inProgressError,
        });
        return;
      }

      // Laske outbound/inbound tilastot
      // HUOM: Käytetään paginationia, koska Supabase palauttaa vain 1000 riviä oletuksena
      let directionCountQuery = supabase
        .from("call_logs")
        .select("*", { count: "exact", head: true })
        .eq("user_id", orgId);
      directionCountQuery = applyFilters(directionCountQuery);
      const { count: directionTotal, error: directionCountError } =
        await directionCountQuery;

      let outbound = 0;
      let inbound = 0;
      let directionError = directionCountError;

      if (directionCountError) {
        console.error(
          "Lähtevät/Saapuvat: Rivien määrän haku epäonnistui:",
          directionCountError,
        );
      } else if (directionTotal && directionTotal > 0) {
        // Hae kaikki rivit erissä (1000 riviä per sivu)
        const pageSize = 1000;
        const totalPages = Math.ceil(directionTotal / pageSize);
        let allDirectionLogs = [];

        for (let page = 1; page <= totalPages; page++) {
          const startIndex = (page - 1) * pageSize;
          const endIndex = Math.min(
            startIndex + pageSize - 1,
            directionTotal - 1,
          );

          let directionQuery = supabase
            .from("call_logs")
            .select("direction")
            .eq("user_id", orgId);
          directionQuery = applyFilters(directionQuery);
          directionQuery = directionQuery.range(startIndex, endIndex);

          const { data: pageDirectionLogs, error: pageError } =
            await directionQuery;

          if (pageError) {
            console.error(
              `Lähtevät/Saapuvat: Sivun ${page} haku epäonnistui:`,
              pageError,
            );
            directionError = pageError;
            break;
          }

          allDirectionLogs = allDirectionLogs.concat(pageDirectionLogs || []);
        }

        // Laske outbound/inbound
        outbound =
          allDirectionLogs.filter((log) => log.direction === "outbound")
            .length || 0;
        inbound =
          allDirectionLogs.filter((log) => log.direction === "inbound")
            .length || 0;
      }

      // Yhteensä: kaikki puhelut (sama logiikka kuin Kampanjat-sivulla)
      let totalLogsQuery = supabase
        .from("call_logs")
        .select("*", { count: "exact", head: true })
        .eq("user_id", orgId);
      totalLogsQuery = applyFilters(totalLogsQuery);
      const { count: totalLogs, error: totalLogsError } = await totalLogsQuery;

      // Soitetut: vain valmiit (done) - sama logiikka kuin Kampanjat-sivulla
      let calledCallsQuery = supabase
        .from("call_logs")
        .select("*", { count: "exact", head: true })
        .eq("user_id", orgId)
        .eq("call_status", "done");
      calledCallsQuery = applyFilters(calledCallsQuery);
      const { count: calledCalls, error: calledCallsError } =
        await calledCallsQuery;

      if (totalLogsError || calledCallsError) {
        console.error("Tilastojen haku epäonnistui:", {
          totalLogsError,
          calledCallsError,
        });
      }

      setStats({
        answered: answered || 0,
        successful: successful || 0,
        failed: failed || 0,
        pending: pending || 0,
        inProgress: inProgress || 0,
        totalCalls: totalCalls || 0, // Soittoyritykset
        totalLogs: totalLogs || 0, // Yhteensä (kaikki puhelut)
        calledCalls: calledCalls || 0, // Soitetut (vain done)
        outbound: outbound,
        inbound: inbound,
      });
    } catch (error) {
      console.error("Tilastojen haku epäonnistui:", error);
    }
  };

  const fetchCallLogs = async (page = currentPage) => {
    try {
      setLoadingCallLogs(true);
      setCallLogsError("");

      if (!user?.id) {
        setCallLogsError("Käyttäjän tunniste puuttuu!");
        return;
      }

      // Hae organisaation ID (public.users.id)
      const orgId = await getUserOrgId(user.id);
      if (!orgId) {
        setCallLogsError("Organisaation ID ei löytynyt!");
        return;
      }

      // Hae ensin rivien kokonaismäärä
      let countQuery = supabase
        .from("call_logs")
        .select("*", { count: "exact", head: true })
        .eq("user_id", orgId); // Käytetään organisaation ID:tä

      // Lisää suodattimet count-kyselyyn
      if (searchTerm) {
        // Escapetaan erikoismerkit SQL LIKE -kyselyissä (%, _, \)
        const escapedSearchTerm = searchTerm.replace(/[%_\\]/g, "\\$&");
        countQuery = countQuery.or(
          `customer_name.ilike.%${escapedSearchTerm}%,phone_number.ilike.%${escapedSearchTerm}%,email.ilike.%${escapedSearchTerm}%`,
        );
      }
      if (statusFilter) {
        if (statusFilter === "success") {
          // Vastatut: done + answered (sama kuin tilastoissa)
          countQuery = countQuery
            .eq("call_status", "done")
            .eq("answered", true);
        } else if (statusFilter === "successful") {
          // Onnistuneet: status === 'done' && answered === true && (outcome === 'success' || outcome === 'successful')
          // Sama logiikka kuin Kampanja-sivulla (api/campaigns.js)
          countQuery = countQuery
            .eq("call_status", "done")
            .eq("answered", true)
            .or("call_outcome.eq.success,call_outcome.eq.successful");
        } else if (statusFilter === "failed") {
          // Epäonnistuneet: done + !answered (sama kuin tilastoissa)
          countQuery = countQuery
            .eq("call_status", "done")
            .eq("answered", false);
        } else if (statusFilter === "voice_mail") {
          countQuery = countQuery
            .eq("call_status", "done")
            .eq("call_outcome", "voice mail");
        } else if (statusFilter === "pending") {
          // Aikataulutettu: pending (sama kuin tilastoissa)
          countQuery = countQuery.eq("call_status", "pending");
        } else if (statusFilter === "in_progress") {
          // Jonossa: in progress (sama kuin tilastoissa)
          countQuery = countQuery.eq("call_status", "in progress");
        }
      }
      if (callTypeFilter) {
        if (callTypeFilter === "successful") {
          // Onnistuneet: status === 'done' && answered === true && (outcome === 'success' || outcome === 'successful')
          // Sama logiikka kuin Kampanja-sivulla (api/campaigns.js)
          countQuery = countQuery
            .eq("call_status", "done")
            .eq("answered", true)
            .or("call_outcome.eq.success,call_outcome.eq.successful");
        } else {
          countQuery = countQuery.eq("call_type", callTypeFilter);
        }
      }
      if (directionFilter) {
        countQuery = countQuery.eq("direction", directionFilter);
      }
      if (wantsContactFilter !== "") {
        if (wantsContactFilter === "true") {
          countQuery = countQuery.eq("wants_contact", true);
        } else if (wantsContactFilter === "false") {
          countQuery = countQuery.eq("wants_contact", false);
        }
      }
      if (dateFrom) {
        // dateFrom: alkaen 00:00:00
        countQuery = countQuery.gte("call_date", dateFrom);
      }
      if (dateTo) {
        // dateTo: asti 23:59:59.999 (koko päivä)
        const dateToEndOfDay = `${dateTo}T23:59:59.999Z`;
        countQuery = countQuery.lte("call_date", dateToEndOfDay);
      }

      const { count: totalCount, error: countError } = await countQuery;

      if (countError) {
        throw new Error("Rivien laskenta epäonnistui: " + countError.message);
      }

      // Jos ei ole rivejä, palauta tyhjä lista
      if (totalCount === 0) {
        setCallLogs([]);
        setCurrentPage(1);
        setTotalCount(0);
        setTotalPages(1);
        return;
      }

      // Laske sivujen määrä (1000 riviä per sivu)
      const pageSize = 1000;
      const totalPages = Math.ceil(totalCount / pageSize);
      setTotalPages(totalPages);

      // Hae kaikki rivit erissä
      let allLogs = [];
      let currentPageNum = 1;

      while (currentPageNum <= totalPages) {
        const startIndex = (currentPageNum - 1) * pageSize;
        const endIndex = Math.min(startIndex + pageSize - 1, totalCount - 1);

        let query = supabase
          .from("call_logs")
          .select("*")
          .eq("user_id", orgId) // Käytetään organisaation ID:tä
          .range(startIndex, endIndex);

        // Lisää järjestäminen
        if (sortField === "duration") {
          query = query.order("duration", {
            ascending: sortDirection === "asc",
          });
        } else if (sortField === "call_date") {
          query = query.order("call_date", {
            ascending: sortDirection === "asc",
          });
        } else if (sortField === "call_status") {
          query = query.order("call_status", {
            ascending: sortDirection === "asc",
          });
        } else {
          // Oletusjärjestys: created_at
          query = query.order("created_at", {
            ascending: sortDirection === "asc",
          });
        }

        // Lisää suodattimet
        if (searchTerm) {
          // Escapetaan erikoismerkit SQL LIKE -kyselyissä (%, _, \)
          const escapedSearchTerm = searchTerm.replace(/[%_\\]/g, "\\$&");
          query = query.or(
            `customer_name.ilike.%${escapedSearchTerm}%,phone_number.ilike.%${escapedSearchTerm}%,email.ilike.%${escapedSearchTerm}%`,
          );
        }
        if (statusFilter) {
          if (statusFilter === "success") {
            // Vastatut: done + answered (sama kuin tilastoissa)
            query = query.eq("call_status", "done").eq("answered", true);
          } else if (statusFilter === "successful") {
            // Onnistuneet: status === 'done' && answered === true && (outcome === 'success' || outcome === 'successful')
            // Sama logiikka kuin Kampanja-sivulla (api/campaigns.js)
            query = query
              .eq("call_status", "done")
              .eq("answered", true)
              .or("call_outcome.eq.success,call_outcome.eq.successful");
          } else if (statusFilter === "failed") {
            // Epäonnistuneet: done + !answered (sama kuin tilastoissa)
            query = query.eq("call_status", "done").eq("answered", false);
          } else if (statusFilter === "voice_mail") {
            query = query
              .eq("call_status", "done")
              .eq("call_outcome", "voice mail");
          } else if (statusFilter === "pending") {
            // Aikataulutettu: pending (sama kuin tilastoissa)
            query = query.eq("call_status", "pending");
          } else if (statusFilter === "in_progress") {
            // Jonossa: in progress (sama kuin tilastoissa)
            query = query.eq("call_status", "in progress");
          }
        }
        if (callTypeFilter) {
          if (callTypeFilter === "successful") {
            // Onnistuneet: status === 'done' && answered === true && (outcome === 'success' || outcome === 'successful')
            // Sama logiikka kuin Kampanja-sivulla (api/campaigns.js)
            query = query
              .eq("call_status", "done")
              .eq("answered", true)
              .or("call_outcome.eq.success,call_outcome.eq.successful");
          } else {
            query = query.eq("call_type", callTypeFilter);
          }
        }
        if (directionFilter) {
          query = query.eq("direction", directionFilter);
        }
        if (wantsContactFilter !== "") {
          if (wantsContactFilter === "true") {
            query = query.eq("wants_contact", true);
          } else if (wantsContactFilter === "false") {
            query = query.eq("wants_contact", false);
          }
        }
        if (dateFrom) {
          // dateFrom: alkaen 00:00:00
          query = query.gte("call_date", dateFrom);
        }
        if (dateTo) {
          // dateTo: asti 23:59:59.999 (koko päivä)
          const dateToEndOfDay = `${dateTo}T23:59:59.999Z`;
          query = query.lte("call_date", dateToEndOfDay);
        }

        const { data: pageLogs, error } = await query;

        if (error) {
          throw new Error(
            `Puhelulokin haku sivulla ${currentPageNum} epäonnistui: ` +
              error.message,
          );
        }

        allLogs = allLogs.concat(pageLogs || []);
        currentPageNum++;
      }

      setCallLogs(allLogs);
      // Älä päivitä tilastoja filtteröidystä datasta - käytetään aina fetchStats() funktiosta saatuja tilastoja
      // Tämä varmistaa että tilastot näyttävät oikeat luvut ilman filttereitä
      setCurrentPage(page);
      setTotalCount(totalCount);
    } catch (error) {
      console.error("Puhelulokin haku epäonnistui:", error);
      setCallLogsError(
        "Puhelulokin haku epäonnistui: " + (error.message || error),
      );
    } finally {
      setLoadingCallLogs(false);
    }
  };

  useEffect(() => {
    if (user?.id && activeTab === "logs") {
      fetchStats(); // Hae tilastot filttereiden kanssa
      fetchCallLogs();
    }
  }, [
    user,
    activeTab,
    sortField,
    sortDirection,
    callTypeFilter,
    directionFilter,
    wantsContactFilter,
    dateFrom,
    dateTo,
  ]); // Suoritetaan kun user, activeTab, sortField, sortDirection tai filtterit muuttuvat

  // Hae viestiloki
  const fetchMessageLogs = async () => {
    try {
      setLoadingMessageLogs(true);
      setMessageLogsError("");

      if (!user?.id) {
        setMessageLogsError("Käyttäjän tunniste puuttuu!");
        return;
      }

      // Hae organisaation ID (public.users.id)
      const orgId = await getUserOrgId(user.id);
      if (!orgId) {
        setMessageLogsError("Organisaation ID ei löytynyt!");
        return;
      }

      const { data: logs, error } = await supabase
        .from("message_logs")
        .select("*")
        .eq("user_id", orgId) // Käytetään organisaation ID:tä
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error("Viestilokin haku epäonnistui: " + error.message);
      }

      setMessageLogs(logs || []);
    } catch (error) {
      console.error("Viestilokin haku epäonnistui:", error);
      setMessageLogsError(
        "Viestilokin haku epäonnistui: " + (error.message || error),
      );
    } finally {
      setLoadingMessageLogs(false);
    }
  };

  useEffect(() => {
    if (user?.id && activeTab === "messages") {
      fetchMessageLogs();
    }
  }, [user, activeTab]);

  // Hae yksityiskohtaiset tiedot puhelusta
  const fetchLogDetail = async (log) => {
    try {
      setLoadingLogDetail(true);
      setSelectedLog(log);
      setShowLogDetail(true);
      setDetailActiveTab("summary");
      setShowMoreDetails(false);

      // Käytä log-objektia suoraan, koska se sisältää kaikki tiedot
    } catch (error) {
      console.error("Yksityiskohtien haku epäonnistui:", error);
    } finally {
      setLoadingLogDetail(false);
    }
  };

  // ESC-näppäimen kuuntelija modaalin sulkemiseen
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === "Escape" && showLogDetail) {
        setShowLogDetail(false);
      }
    };

    if (showLogDetail) {
      document.addEventListener("keydown", handleEscKey);
    }

    return () => {
      document.removeEventListener("keydown", handleEscKey);
    };
  }, [showLogDetail]);

  // Modaalin sulkeminen taustan klikkauksesta
  const handleModalBackgroundClick = (event) => {
    if (event.target === event.currentTarget) {
      setShowLogDetail(false);
    }
  };

  // Päivitä pending-puhelun tyyppi
  const handleUpdateCallType = async (log, newType) => {
    try {
      if (!log?.id) return;
      setUpdatingLogIds((prev) => ({ ...prev, [log.id]: true }));
      const selectedType = callTypes.find(
        (t) => t.name === newType || t.value === newType,
      );
      const call_type_id = selectedType?.id || null;
      const { error } = await supabase
        .from("call_logs")
        .update({ call_type: newType, call_type_id })
        .eq("id", log.id)
        .eq("call_status", "pending");
      if (error) throw error;
      await fetchCallLogs(currentPage);
    } catch (e) {
      alert(t("alerts.error.callTypeChangeFailed", { error: e.message || e }));
    } finally {
      setUpdatingLogIds((prev) => ({ ...prev, [log.id]: false }));
    }
  };

  // Peruuta pending-puhelu (poista rivi)
  const handleCancelCall = async (log) => {
    try {
      if (!log?.id) return;
      if (!confirm("Peruutetaanko tämä puhelu?")) return;
      setUpdatingLogIds((prev) => ({ ...prev, [log.id]: true }));
      const { error } = await supabase
        .from("call_logs")
        .delete()
        .eq("id", log.id)
        .eq("call_status", "pending");
      if (error) throw error;
      await fetchCallLogs(currentPage);
    } catch (e) {
      alert(t("alerts.error.callCancelFailed", { error: e.message || e }));
    } finally {
      setUpdatingLogIds((prev) => ({ ...prev, [log.id]: false }));
    }
  };

  // Kopioi puhelun tyyppi
  const handleCopyCallType = async (type) => {
    try {
      if (!type?.id) {
        setErrorMessage("Puhelun tyyppiä ei voi kopioida");
        return;
      }

      if (!user?.id) {
        setErrorMessage("Käyttäjän tunniste puuttuu!");
        return;
      }

      // Hae organisaation ID (public.users.id)
      const orgId = await getUserOrgId(user.id);
      if (!orgId) {
        setErrorMessage("Organisaation ID ei löytynyt!");
        return;
      }

      // Luo kopio alkuperäisestä tyypistä
      const insertData = {
        user_id: orgId, // Käytetään organisaation ID:tä
        name: `${type.name || type.label || "Kopio"} (Kopio)`,
        agent_name: type.agent_name || "",
        target_audience: type.target_audience || "",
        identity: type.identity || "",
        style: type.style || "",
        guidelines: type.guidelines || "",
        goals: type.goals || "",
        first_line: type.first_line || "",
        intro: type.intro || "",
        questions: type.questions || "",
        outro: type.outro || "",
        notes: type.notes || "",
        version: type.version || "v1.0",
        status: type.status === "Draft" ? "Draft" : "Draft", // Kopio aloitetaan luonnoksena
        language: type.language || "fi",
        summary: type.summary || "",
        success_assessment: type.success_assessment || "",
        action: type.action || "",
        first_sms: type.first_sms || "",
        after_call_sms: type.after_call_sms || "",
        missed_call_sms: type.missed_call_sms || "",
      };

      const { data: newCallTypeData, error } = await supabase
        .from("call_types")
        .insert([insertData])
        .select()
        .single();

      if (error) {
        console.error("Error copying call type:", error);
        setErrorMessage(
          "Puhelun tyypin kopiointi epäonnistui: " + (error.message || error),
        );
        return;
      }

      setSuccessMessage("Puhelun tyyppi kopioitu onnistuneesti!");
      fetchCallTypes(); // Päivitä lista

      // Poista success-viesti 3 sekunnin kuluttua
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (e) {
      console.error("Puhelun tyypin kopiointi epäonnistui:", e);
      setErrorMessage(
        "Puhelun tyypin kopiointi epäonnistui: " + (e.message || e),
      );
    }
  };

  // Export puheluloki CSV-muodossa — käytä näkyvää, suodatettua callLogs-dataa

  // Järjestämisfunktio
  const handleSort = (field) => {
    if (sortField === field) {
      // Jos sama kenttä, vaihda suuntaa
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // Jos uusi kenttä, aseta nouseva järjestys
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Filtteröinti ja haku
  const handleSearch = () => {
    setCurrentPage(1); // Palaa ensimmäiselle sivulle
    fetchCallLogs(1);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    fetchCallLogs(newPage);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
    setCallTypeFilter("");
    setDirectionFilter("");
    setWantsContactFilter("");
    setDateFrom("");
    setDateTo("");
    setSortField("created_at");
    setSortDirection("desc");
    setCurrentPage(1);
    fetchCallLogs(1);
  };

  // Polling-logiikka poistettu - ei tarvita

  // Cleanup äänet komponentin purkautuessa
  useEffect(() => {
    return () => {
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }
      audioElementsRef.current.forEach((audio) => {
        if (audio && !audio.paused) {
          audio.pause();
          audio.currentTime = 0;
        }
      });
      audioElementsRef.current = [];
    };
  }, []);

  // Ei erillistä auto-resizea; käytetään lohkoa, jossa maxHeight ja sisäinen scroll

  // Responsiivinen apu
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const isTablet =
    typeof window !== "undefined" &&
    window.innerWidth >= 768 &&
    window.innerWidth < 1200;
  let gridCols = "1fr";
  if (isTablet) gridCols = "1fr 1fr";
  if (!isMobile && !isTablet) gridCols = "1fr 1fr 1fr";

  // Tilastojen laskenta poistettu - käytetään callLogs dataa suoraan

  // Päivitetään voiceOptions dynaamisesti
  const getVoiceOptions = () => {
    let options = [...voiceOptions];
    if (userVoiceId && !options.some((v) => v.id === userVoiceId)) {
      options = [
        {
          value: userVoiceId,
          label: userVoiceLabel + " (oma)",
          id: userVoiceId,
        },
        ...options,
      ];
    }
    return options;
  };

  const openCallsKnowledgeModal = () => setShowCallsKnowledgeModal(true);

  const handleCreateCallsKnowledgeBase = async () => {
    setCallsKnowledgeError("");
    setCallsKnowledgeLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Ei aktiivista sessiota");

      const resp = await axios.post(
        "/api/calls/knowledge-base",
        { action: "create" },
        { headers: { Authorization: `Bearer ${session.access_token}` } },
      );

      const newId = resp?.data?.vector_store_id;
      if (!newId)
        throw new Error("Tietokannan luonti epäonnistui (ID puuttuu)");

      setCallsKnowledgeId(newId);
      toast.success("Tietokanta luotu");
    } catch (e) {
      setCallsKnowledgeError(
        e?.response?.data?.error ||
          e?.message ||
          "Tietokannan luonti epäonnistui",
      );
    } finally {
      setCallsKnowledgeLoading(false);
    }
  };

  // Mika Special - lomakehakufunktiot
  const fetchMikaContacts = async () => {
    setLoadingMikaContacts(true);
    setMikaContactsError("");

    try {
      // TODO: Mika Special contacts endpoint on vanhentunut - korvaa tarvittaessa
      throw new Error("Mika Special contacts endpoint on vanhentunut");
    } catch (error) {
      console.error("Frontend: Error fetching Mika Special contacts:", error);
      setMikaContactsError(error.message);
    } finally {
      setLoadingMikaContacts(false);
    }
  };

  const handleMikaSearch = async () => {
    // Tarkista että vähintään yksi hakukenttä on täytetty
    if (
      !mikaSearchName.trim() &&
      !mikaSearchTitle.trim() &&
      !mikaSearchOrganization.trim()
    ) {
      setMikaSearchResults([]);
      return;
    }

    setMikaSearchLoading(true);

    try {
      // Lähetä webhook-kutsu N8N:ään hakusanoilla
      // TODO: Mika Special contacts endpoint on vanhentunut - korvaa tarvittaessa
      throw new Error("Mika Special contacts endpoint on vanhentunut");
    } catch (error) {
      console.error("Frontend: Error searching Mika contacts:", error);
      setMikaSearchResults([]);
    } finally {
      setMikaSearchLoading(false);
    }
  };

  const handleMikaMassCall = async (contact) => {
    try {
      // Muodosta Google Sheets URL kontaktidatasta
      const contactData = {
        id: contact.id || null,
        name: contact.name,
        phone: contact.phones && contact.phones[0] ? contact.phones[0] : "",
        email:
          contact.primary_email || (contact.emails && contact.emails[0]) || "",
        company: contact.organization?.name || "",
        title:
          contact.custom_fields && contact.custom_fields[0]
            ? contact.custom_fields[0]
            : "",
        address: contact.organization?.address || "",
      };

      // Muodosta Google Sheets -yhteensopiva data-rakenne
      const columns = ["name", "phone", "email", "company", "title", "address"];
      const rows = [
        [
          contactData.name,
          contactData.phone,
          contactData.email,
          contactData.company,
          contactData.title,
          contactData.address,
        ],
      ];

      // Aseta kontaktidata mass-calls -kenttiin
      setSheetUrl(""); // Tyhjennä Google Sheets URL
      setValidationResult({
        phoneCount: 1,
        success: true,
        columns: columns,
        rows: rows,
        data: [contactData],
      });

      // Siirry mass-calls -välilehdelle
      setActiveTab("calls");

      // Näytä ilmoitus
      alert(t("alerts.success.contactAdded", { name: contact.name }));
    } catch (error) {
      console.error("Frontend: Error starting mass calls:", error);
      alert(t("alerts.error.massCallsInitFailed"));
    }
  };

  const handleMikaSingleCall = async (contact) => {
    try {
      // Aseta kontaktidata yksittäiseen soittoon
      setPhoneNumber(
        contact.phones && contact.phones[0] ? contact.phones[0] : "",
      );
      setName(contact.name || "");

      // Siirry mass-calls -välilehdelle
      setActiveTab("calls");

      // Näytä ilmoitus
      alert(t("alerts.success.contactAddedSingle", { name: contact.name }));
    } catch (error) {
      console.error("Frontend: Error starting single call:", error);
      alert(t("alerts.error.singleCallInitFailed"));
    }
  };

  const handleMikaMassCallAll = async () => {
    // Tämä funktio ei enää tarvita, koska se on siirretty MikaSpecialTab-komponenttiin
  };

  // Lisää useita Mika Special -valittuja kontakteja mass-calls -palikkaan
  const handleMikaMassCallSelected = (selectedContacts) => {
    try {
      const columns = ["name", "phone", "email", "company", "title", "address"];
      const rows = selectedContacts.map((c) => [
        c.name || "",
        c.phone || "",
        c.email || "",
        c.company || "",
        c.title || "",
        c.address || "",
      ]);

      // Korvaa nykyinen mass-calls data
      setSheetUrl("");
      setValidationResult({
        phoneCount: rows.length,
        success: true,
        columns,
        rows,
        data: selectedContacts,
      });

      // Siirry mass-calls -välilehdelle
      setActiveTab("calls");
    } catch (error) {
      console.error(
        "Virhe valittujen kontaktien lisäämisessä mass-calls -palikkaan:",
        error,
      );
      alert(t("alerts.error.contactsAddFailed"));
    }
  };

  // Hae kontakteja kun Mika Special -välilehti avataan
  useEffect(() => {
    if (activeTab === "mika" && mikaContacts.length === 0) {
      fetchMikaContacts();
    }
  }, [activeTab]);

  // Alusta massCallCallType kun callTypes ladataan
  useEffect(() => {
    if (callTypes.length > 0 && !massCallCallType) {
      setMassCallCallType(callTypes[0].value);
    }
  }, [callTypes, massCallCallType]);

  // Lataa kampanjat ja segmentit mass-call valitsimiin
  useEffect(() => {
    let mounted = true;
    async function loadLists() {
      try {
        const session = await supabase.auth.getSession();
        const token = session?.data?.session?.access_token;
        const [cRes, sRes] = await Promise.all([
          fetch(`/api/campaigns?user_id=${encodeURIComponent(user?.id)}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }),
          fetch(`/api/segments?user_id=${encodeURIComponent(user?.id)}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }),
        ]);
        const [camps, segs] = await Promise.all([cRes.json(), sRes.json()]);
        if (mounted) {
          setMassCallCampaigns(Array.isArray(camps) ? camps : []);
          setMassCallSegments(Array.isArray(segs) ? segs : []);
        }
      } catch (e) {}
    }
    if (user?.id) loadLists();
    return () => {
      mounted = false;
    };
  }, [user?.id]);

  // Massapuhelumodaalin funktiot
  const handleMassCallValidate = async () => {
    setMassCallValidating(true);
    setMassCallError("");
    setMassCallValidationResult(null);
    try {
      const user_id = user?.id;

      const res = await fetch("/api/integrations/validate-sheet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sheetUrl: massCallSheetUrl, user_id }),
      });

      const data = await res.json();

      if (data.success) {
        setMassCallValidationResult(data);
        setMassCallStep(2); // Siirry seuraavalle sivulle
      } else {
        setMassCallError(data.error || "Validointi epäonnistui");
      }
    } catch (e) {
      console.error("❌ Mass call validate-sheet virhe:", e);
      const errorMessage = e.response?.data?.error || "Validointi epäonnistui";
      setMassCallError(
        typeof errorMessage === "string"
          ? errorMessage
          : JSON.stringify(errorMessage),
      );
    } finally {
      setMassCallValidating(false);
    }
  };

  const handleMassCallStart = async () => {
    setMassCallStarting(true);
    setMassCallError("");
    try {
      // Käytä backendin APIa massapuhelujen luontiin (ei suoria Supabase-kutsuja frontendista)
      if (!massCallSheetUrl) throw new Error("Google Sheets URL puuttuu");
      if (!massCallCallType) throw new Error("Puhelun tyyppi puuttuu");

      const selectedVoiceObj = getVoiceOptions().find(
        (v) => v.value === massCallSelectedVoice,
      );
      const session = await supabase.auth.getSession();
      const token = session?.data?.session?.access_token;

      // Debug: tarkista kampanja ennen lähetystä
      console.log("🔍 Frontend - sending campaign ID:", {
        massCallCampaignId,
        type: typeof massCallCampaignId,
        isEmpty: !massCallCampaignId || massCallCampaignId === "",
        campaigns: massCallCampaigns.map((c) => ({ id: c.id, name: c.name })),
      });

      const res = await fetch("/api/calls/mass", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          sheetUrl: massCallSheetUrl,
          callType: massCallCallType,
          voice: massCallSelectedVoice,
          voice_id: selectedVoiceObj?.id,
          user_id: user?.id,
          sms_first: massCallSmsFirst === true,
          sms_after_call: massCallSmsAfterCall === true,
          sms_missed_call: massCallSmsMissedCall === true,
          newCampaignId:
            massCallCampaignId && massCallCampaignId.trim()
              ? massCallCampaignId.trim()
              : null,
          contactSegmentId:
            massCallSegmentId && massCallSegmentId.trim()
              ? massCallSegmentId.trim()
              : null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Massapuhelujen aloitus epäonnistui");
      }

      alert(
        t("alerts.success.massCallsStarted", {
          count: data.startedCalls ?? data.totalCalls ?? "",
        }),
      );
      setShowMassCallModal(false);
      setMassCallStep(1);
      setMassCallSheetUrl("");
      setMassCallValidationResult(null);
      setMassCallCallType("");
      setMassCallSelectedVoice("rascal-nainen-1");
      setMassCallSmsFirst(false);
      setMassCallSmsAfterCall(false);
      setMassCallSmsMissedCall(false);
      fetchCallLogs();
      return;
      // Käytä normaalia mass-call API:a Google Sheets -datalle
      const user_id = user?.id;

      // Hae organisaation ID (public.users.id)
      const publicUserId = await getUserOrgId(user_id);
      if (!publicUserId) {
        throw new Error("Organisaation ID ei löytynyt");
      }

      // Hae call_type_id call_types taulusta
      const { data: callTypeData, error: callTypeError } = await supabase
        .from("call_types")
        .select("id")
        .eq("name", massCallCallType)
        .eq("user_id", publicUserId) // Käytetään organisaation ID:tä
        .single();

      if (callTypeError || !callTypeData) {
        throw new Error("Puhelun tyyppiä ei löytynyt");
      }

      const call_type_id = callTypeData.id;

      // Käytä massCallValidationResult.rows dataa ja lisää jokainen suoraan Supabaseen
      if (!massCallValidationResult || !massCallValidationResult.rows) {
        throw new Error("Validointi pitää suorittaa ensin");
      }

      const callLogs = [];
      let successCount = 0;
      let errorCount = 0;

      // Etsi sarakkeiden otsikot ensin
      let nameColumn = null;
      let phoneColumn = null;
      let emailColumn = null;

      // Etsi nimisarakkeen otsikko
      for (const columnName of massCallValidationResult.columns || []) {
        if (
          columnName.toLowerCase().includes("name") ||
          columnName.toLowerCase().includes("nimi") ||
          columnName.toLowerCase().includes("etunimi") ||
          columnName.toLowerCase().includes("sukunimi")
        ) {
          nameColumn = columnName;
          break;
        }
      }

      // Etsi puhelinnumerosarakkeen otsikko
      for (const columnName of massCallValidationResult.columns || []) {
        if (
          columnName.toLowerCase().includes("phone") ||
          columnName.toLowerCase().includes("puhelin") ||
          columnName.toLowerCase().includes("numero") ||
          columnName.toLowerCase().includes("tel")
        ) {
          phoneColumn = columnName;
          break;
        }
      }

      // Etsi sähköpostisarakkeen otsikko (tiukempi tunnistus)
      for (const columnName of massCallValidationResult.columns || []) {
        const lower = String(columnName).toLowerCase().trim();
        if (
          lower === "email" ||
          lower === "e-mail" ||
          lower.includes("email") ||
          lower.includes("sähköposti") ||
          lower.includes("sahkoposti")
        ) {
          emailColumn = columnName;
          break;
        }
      }

      if (!nameColumn || !phoneColumn) {
        throw new Error(
          "Vaadittuja sarakkeita ei löytynyt. Tarvitaan sekä nimisarakke että puhelinnumerosarakke.",
        );
      }

      for (const [rowIndex, row] of (
        massCallValidationResult.rows || []
      ).entries()) {
        // Hae arvot sarakkeiden otsikoiden perusteella
        const phoneNumber = normalizePhoneNumber(row[phoneColumn]);
        const name = row[nameColumn] ? row[nameColumn].trim() : null;

        // Lisää vain jos on sekä selkeä nimi että puhelinnumero
        if (
          name &&
          phoneNumber &&
          name.trim() !== "" &&
          phoneNumber.trim() !== "" &&
          phoneNumber.startsWith("+358")
        ) {
          // Ota sähköposti sarakkeesta, validoi ja fallbackaa jos otsikkoa ei löytynyt
          const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/i;
          let emailValue = null;
          if (emailColumn) {
            const raw = row[emailColumn];
            if (raw && emailRegex.test(String(raw).trim())) {
              emailValue = String(raw).trim().toLowerCase().substring(0, 120);
            }
          } else {
            // Fallback: etsi mikä tahansa sähköpostin näköinen arvo riviltä
            for (const key of Object.keys(row)) {
              const val = row[key];
              if (val && emailRegex.test(String(val).trim())) {
                emailValue = String(val).trim().toLowerCase().substring(0, 120);
                break;
              }
            }
          }
          // Hae valitun äänen id
          const selectedVoiceObj = getVoiceOptions().find(
            (v) => v.value === massCallSelectedVoice,
          );
          const voiceId = selectedVoiceObj?.id;

          callLogs.push({
            user_id: publicUserId,
            call_type_id: call_type_id,
            customer_name: name,
            phone_number: phoneNumber,
            email: emailValue,
            voice_id: voiceId,
            call_status: "pending",
            call_date: new Date().toISOString().split("T")[0],
            call_time: new Date().toLocaleTimeString("fi-FI", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            answered: false,
            duration: null,
            summary: `Mass-call: ${massCallCallType}`, // Käytä summary saraketta notes sijaan
            created_at: new Date().toISOString(),
            sms_first: massCallSmsFirst === true,
            after_call_sms_sent: massCallSmsAfterCall === true,
            missed_call_sms_sent: massCallSmsMissedCall === true,
          });
        }
      }

      if (callLogs.length === 0) {
        throw new Error("Ei kelvollisia puhelinnumeroita löytynyt");
      }

      // Lisää kaikki call_logs Supabaseen
      const { error: insertError } = await supabase
        .from("call_logs")
        .insert(callLogs);

      if (insertError) {
        throw new Error(
          "Puhelulokien lisäys epäonnistui: " + insertError.message,
        );
      }

      successCount = callLogs.length;

      // Näytä onnistumisviesti ja sulje modaali
      alert(t("alerts.success.massCallsStarted", { count: successCount }));
      setShowMassCallModal(false);
      setMassCallStep(1);
      setMassCallSheetUrl("");
      setMassCallValidationResult(null);
      setMassCallCallType("");
      setMassCallSelectedVoice("rascal-nainen-1");
      setMassCallSmsFirst(false);
      setMassCallSmsAfterCall(false);
      setMassCallSmsMissedCall(false);

      // Päivitä puheluloki
      fetchCallLogs();
    } catch (error) {
      console.error("Mass call start error:", error);
      setMassCallError(error.message);
    } finally {
      setMassCallStarting(false);
    }
  };

  const handleMassCallSchedule = async () => {
    setMassCallScheduling(true);
    setMassCallError("");
    try {
      // Käytä backendin APIa ja välitä ajastus
      if (!massCallSheetUrl) throw new Error("Google Sheets URL puuttuu");
      if (!massCallCallType) throw new Error("Puhelun tyyppi puuttuu");
      if (!massCallScheduledDate || !massCallScheduledTime)
        throw new Error("Ajastuksen päivä ja aika vaaditaan");

      const selectedVoiceObj2 = getVoiceOptions().find(
        (v) => v.value === massCallSelectedVoice,
      );
      const session2 = await supabase.auth.getSession();
      const token2 = session2?.data?.session?.access_token;
      // Debug: tarkista kampanja ennen lähetystä (ajastus)
      console.log("🔍 Frontend - sending campaign ID (schedule):", {
        massCallCampaignId,
        type: typeof massCallCampaignId,
        isEmpty: !massCallCampaignId || massCallCampaignId === "",
        campaigns: massCallCampaigns.map((c) => ({ id: c.id, name: c.name })),
      });

      const res = await fetch("/api/calls/mass", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token2 ? { Authorization: `Bearer ${token2}` } : {}),
        },
        body: JSON.stringify({
          sheetUrl: massCallSheetUrl,
          callType: massCallCallType,
          voice: massCallSelectedVoice,
          voice_id: selectedVoiceObj2?.id,
          user_id: user?.id,
          scheduledDate: massCallScheduledDate,
          scheduledTime: massCallScheduledTime,
          sms_first: massCallSmsFirst === true,
          sms_after_call: massCallSmsAfterCall === true,
          sms_missed_call: massCallSmsMissedCall === true,
          newCampaignId:
            massCallCampaignId && massCallCampaignId.trim()
              ? massCallCampaignId.trim()
              : null,
          contactSegmentId:
            massCallSegmentId && massCallSegmentId.trim()
              ? massCallSegmentId.trim()
              : null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Ajastuksen tallennus epäonnistui");
      }

      alert(
        t("alerts.success.callsScheduled", {
          date: massCallScheduledDate,
          time: massCallScheduledTime,
          count: data.startedCalls ?? data.totalCalls ?? "",
        }),
      );
      setShowMassCallModal(false);
      setMassCallStep(1);
      setMassCallSheetUrl("");
      setMassCallValidationResult(null);
      setMassCallCallType("");
      setMassCallSelectedVoice("rascal-nainen-1");
      setMassCallScheduledDate("");
      setMassCallScheduledTime("");
      setMassCallSmsFirst(false);
      setMassCallSmsAfterCall(false);
      setMassCallSmsMissedCall(false);
      fetchCallLogs();
      return;
      // Tallenna ajastetut puhelut call_logs tauluun
      const user_id = user?.id;

      // Hae organisaation ID (public.users.id)
      const publicUserId = await getUserOrgId(user_id);
      if (!publicUserId) {
        throw new Error("Organisaation ID ei löytynyt");
      }

      // Hae call_type_id call_types taulusta
      const { data: callTypeData, error: callTypeError } = await supabase
        .from("call_types")
        .select("id")
        .eq("name", massCallCallType)
        .eq("user_id", publicUserId) // Käytetään organisaation ID:tä
        .single();

      if (callTypeError || !callTypeData) {
        throw new Error("Puhelun tyyppiä ei löytynyt");
      }

      const call_type_id = callTypeData.id;

      // Käytä massCallValidationResult.rows dataa ja lisää jokainen suoraan Supabaseen
      if (!massCallValidationResult || !massCallValidationResult.rows) {
        throw new Error("Validointi pitää suorittaa ensin");
      }

      const scheduledCallLogs = [];
      let successCount = 0;

      // Etsi sarakkeiden otsikot ensin
      let nameColumn = null;
      let phoneColumn = null;
      let emailColumn = null;

      // Etsi nimisarakkeen otsikko
      for (const columnName of massCallValidationResult.columns || []) {
        if (
          columnName.toLowerCase().includes("name") ||
          columnName.toLowerCase().includes("nimi") ||
          columnName.toLowerCase().includes("etunimi") ||
          columnName.toLowerCase().includes("sukunimi")
        ) {
          nameColumn = columnName;
          break;
        }
      }

      // Etsi puhelinnumerosarakkeen otsikko
      for (const columnName of massCallValidationResult.columns || []) {
        if (
          columnName.toLowerCase().includes("phone") ||
          columnName.toLowerCase().includes("puhelin") ||
          columnName.toLowerCase().includes("numero") ||
          columnName.toLowerCase().includes("tel")
        ) {
          phoneColumn = columnName;
          break;
        }
      }

      // Etsi sähköpostisarakkeen otsikko (tiukempi tunnistus)
      for (const columnName of massCallValidationResult.columns || []) {
        const lower = String(columnName).toLowerCase().trim();
        if (
          lower === "email" ||
          lower === "e-mail" ||
          lower.includes("email") ||
          lower.includes("sähköposti") ||
          lower.includes("sahkoposti")
        ) {
          emailColumn = columnName;
          break;
        }
      }

      if (!nameColumn || !phoneColumn) {
        throw new Error(
          "Vaadittuja sarakkeita ei löytynyt. Tarvitaan sekä nimisarakke että puhelinnumerosarakke.",
        );
      }

      for (const [rowIndex, row] of (
        massCallValidationResult.rows || []
      ).entries()) {
        // Hae arvot sarakkeiden otsikoiden perusteella
        const phoneNumber = normalizePhoneNumber(row[phoneColumn]);
        const name = row[nameColumn] ? row[nameColumn].trim() : null;

        // Lisää vain jos on sekä selkeä nimi että puhelinnumero
        if (
          name &&
          phoneNumber &&
          name.trim() !== "" &&
          phoneNumber.trim() !== "" &&
          phoneNumber.startsWith("+358")
        ) {
          // Ota sähköposti sarakkeesta, validoi ja fallbackaa jos otsikkoa ei löytynyt
          const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/i;
          let emailValue = null;
          if (emailColumn) {
            const raw = row[emailColumn];
            if (raw && emailRegex.test(String(raw).trim())) {
              emailValue = String(raw).trim().toLowerCase().substring(0, 120);
            }
          } else {
            // Fallback: etsi mikä tahansa sähköpostin näköinen arvo riviltä
            for (const key of Object.keys(row)) {
              const val = row[key];
              if (val && emailRegex.test(String(val).trim())) {
                emailValue = String(val).trim().toLowerCase().substring(0, 120);
                break;
              }
            }
          }
          // Hae valitun äänen id
          const selectedVoiceObj = getVoiceOptions().find(
            (v) => v.value === massCallSelectedVoice,
          );
          const voiceId = selectedVoiceObj?.id;

          scheduledCallLogs.push({
            user_id: publicUserId,
            call_type_id: call_type_id,
            customer_name: name,
            phone_number: phoneNumber,
            email: emailValue,
            voice_id: voiceId,
            call_status: "pending",
            call_date: massCallScheduledDate, // AJASTETTU päivämäärä
            call_time: massCallScheduledTime, // AJASTETTU kellonaika
            answered: false,
            duration: null,
            summary: `Scheduled mass-call: ${massCallCallType}`, // Käytä summary saraketta notes sijaan
            created_at: new Date().toISOString(),
            sms_first: massCallSmsFirst === true,
            after_call_sms_sent: massCallSmsAfterCall === true,
            missed_call_sms_sent: massCallSmsMissedCall === true,
          });
        }
      }

      if (scheduledCallLogs.length === 0) {
        throw new Error("Ei kelvollisia puhelinnumeroita löytynyt");
      }

      // Lisää kaikki ajastetut puhelut call_logs tauluun
      const { error: insertError } = await supabase
        .from("call_logs")
        .insert(scheduledCallLogs);

      if (insertError) {
        throw new Error(
          "Ajastettujen puhelujen lisäys epäonnistui: " + insertError.message,
        );
      }

      successCount = scheduledCallLogs.length;

      // Näytä onnistumisviesti ja sulje modaali
      alert(
        t("alerts.success.callsScheduled", {
          date: massCallScheduledDate,
          time: massCallScheduledTime,
          count: successCount,
        }),
      );
      setShowMassCallModal(false);
      setMassCallStep(1);
      setMassCallSheetUrl("");
      setMassCallValidationResult(null);
      setMassCallCallType("");
      setMassCallSelectedVoice("rascal-nainen-1");
      setMassCallScheduledDate("");
      setMassCallScheduledTime("");
      setMassCallSmsFirst(false);
      setMassCallSmsAfterCall(false);
      setMassCallSmsMissedCall(false);

      // Päivitä puheluloki
      fetchCallLogs();
    } catch (error) {
      console.error("Mass call schedule error:", error);
      setMassCallError(error.message);
    } finally {
      setMassCallScheduling(false);
    }
  };

  const resetMassCallModal = () => {
    setShowMassCallModal(false);
    setMassCallStep(1);
    setMassCallSheetUrl("");
    setMassCallValidationResult(null);
    setMassCallError("");
    setMassCallCallType(callTypes.length > 0 ? callTypes[0].value : "");
    setMassCallSelectedVoice("rascal-nainen-1");
    setMassCallScheduledDate("");
    setMassCallScheduledTime("");
    setMassCallSmsFirst(false);
    setMassCallSmsAfterCall(false);
    setMassCallSmsMissedCall(false);
  };

  return (
    <>
      <PageMeta
        title="Puhelut - Rascal AI"
        description="Automatisoi puhelut ja seuraa puhelulokeja Rascal AI:ssä. Älykäs puhelinmarkkinointi ja asiakaspalvelu."
        image="/hero.png"
      />
      <div className="callpanel-container">
        <div className="callpanel-wrapper">
          <div className="callpanel-root w-full max-w-none">
            {/* Tabs (3 per rivi) */}
            <div className="callpanel-tabs callpanel-tabs-grid">
              <div className="callpanel-tabs-row">
                <Button
                  onClick={() => handleTabChange("calls")}
                  variant={activeTab === "calls" ? "primary" : "secondary"}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="callpanel-icon"
                  >
                    <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                  </svg>
                  {t("calls.tabs.calls")}
                </Button>
                <Button
                  onClick={() => handleTabChange("logs")}
                  variant={activeTab === "logs" ? "primary" : "secondary"}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="callpanel-icon"
                  >
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" />
                  </svg>
                  {t("calls.tabs.logs")}
                </Button>
                <Button
                  onClick={() => handleTabChange("messages")}
                  variant={activeTab === "messages" ? "primary" : "secondary"}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="callpanel-icon"
                  >
                    <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM9 11H7V9h2v2zm4 0h-2V9h2v2zm4 0h-2V9h2v2z" />
                  </svg>
                  {t("calls.tabs.messages")}
                </Button>
              </div>
              <div className="callpanel-tabs-row">
                <Button
                  onClick={() => handleTabChange("textmessages")}
                  variant={
                    activeTab === "textmessages" ? "primary" : "secondary"
                  }
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="callpanel-icon"
                  >
                    <path d="M17 1.01L3 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H3V5h14v14z" />
                    <path d="M7 7h10v2H7zM7 11h7v2H7z" />
                  </svg>
                  {t("calls.tabs.textmessages")}
                </Button>
                <Button
                  onClick={() => handleTabChange("manage")}
                  variant={activeTab === "manage" ? "primary" : "secondary"}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="callpanel-icon"
                  >
                    <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z" />
                  </svg>
                  {t("calls.tabs.manage")}
                </Button>
                {hasCRM ? (
                  <Button
                    onClick={() => handleTabChange("mika")}
                    variant={activeTab === "mika" ? "primary" : "secondary"}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="callpanel-icon"
                    >
                      <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z" />
                    </svg>
                    {t("calls.tabs.crm")}
                  </Button>
                ) : (
                  <span />
                )}
              </div>
            </div>

            {/* Sisältö */}
            {activeTab === "calls" && (
              <CallsTab
                openMassCallModal={openMassCallModal}
                openSingleCallModal={openSingleCallModal}
                setActiveTab={setActiveTab}
                callType={callType}
                setCallType={setCallType}
                loadingCallTypes={loadingCallTypes}
                callTypes={callTypes}
                updateScriptFromCallType={updateScriptFromCallType}
                selectedVoice={selectedVoice}
                setSelectedVoice={setSelectedVoice}
                isPlaying={isPlaying}
                playVoiceSample={playVoiceSample}
                getVoiceOptions={getVoiceOptions}
                script={script}
                setShowInboundModal={setShowInboundModal}
                inboundVoice={inboundVoice}
                setInboundVoice={setInboundVoice}
                inboundWelcomeMessage={inboundWelcomeMessage}
                setInboundWelcomeMessage={setInboundWelcomeMessage}
                inboundScript={inboundScript}
                setInboundScript={setInboundScript}
                handleSaveInboundSettings={handleSaveInboundSettings}
                openEditInboundModal={openEditInboundModal}
                openCallsKnowledgeModal={openCallsKnowledgeModal}
              />
            )}

            {activeTab === "logs" && (
              <div className="callpanel-card">
                <div className="callpanel-card-header">
                  <h2 className="callpanel-card-title">
                    {t("calls.tabs.logs")}
                  </h2>
                  <div className="callpanel-card-actions">
                    <button
                      type="button"
                      onClick={() => setShowExportModal(true)}
                      className="callpanel-btn-export"
                    >
                      Export CSV
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        fetchCallLogs();
                      }}
                      disabled={loadingCallLogs}
                      className="callpanel-btn-refresh"
                    >
                      {loadingCallLogs
                        ? t("calls.logsTab.buttons.refreshing")
                        : t("calls.logsTab.buttons.refresh")}
                    </button>
                  </div>
                </div>

                {/* Filtterit */}
                <div className="callpanel-filters">
                  <h3 className="callpanel-filters-title">
                    {t("calls.logsTab.filters.title")}
                  </h3>

                  <div className="callpanel-filters-grid">
                    <div className="callpanel-filter-group">
                      <label className="callpanel-filter-label">
                        {t("calls.logsTab.filters.searchLabel")}
                      </label>
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder={t(
                          "calls.logsTab.filters.searchPlaceholder",
                        )}
                        className="callpanel-filter-input"
                      />
                    </div>

                    <div className="callpanel-filter-group">
                      <label className="callpanel-filter-label">
                        {t("calls.logsTab.filters.statusLabel")}
                      </label>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="callpanel-filter-select"
                      >
                        <option value="">
                          {t("calls.logsTab.filters.all")}
                        </option>
                        <option value="success">
                          {t("calls.logsTab.filters.statusOptions.success")}
                        </option>
                        <option value="successful">
                          {t("calls.logsTab.filters.statusOptions.successful")}
                        </option>
                        <option value="failed">
                          {t("calls.logsTab.filters.statusOptions.failed")}
                        </option>
                        <option value="voice_mail">
                          {t("calls.logsTab.filters.statusOptions.voiceMail")}
                        </option>
                        <option value="pending">
                          {t("calls.logsTab.filters.statusOptions.pending")}
                        </option>
                        <option value="in_progress">
                          {t("calls.logsTab.filters.statusOptions.inProgress")}
                        </option>
                      </select>
                    </div>

                    <div>
                      <label
                        className="callpanel-filter-label"
                      >
                        {t("calls.logsTab.filters.typeLabel")}
                      </label>
                      <select
                        value={callTypeFilter}
                        onChange={(e) => setCallTypeFilter(e.target.value)}
                        className="callpanel-filter-select"
                      >
                        <option value="">
                          {t("calls.logsTab.filters.all")}
                        </option>
                        {callTypes.map((type) => (
                          <option key={type.id} value={type.name}>
                            {type.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label
                        className="callpanel-filter-label"
                      >
                        {t("calls.messagesTab.table.direction")}
                      </label>
                      <select
                        value={directionFilter}
                        onChange={(e) => setDirectionFilter(e.target.value)}
                        className="callpanel-filter-select"
                      >
                        <option value="">
                          {t("calls.logsTab.filters.all")}
                        </option>
                        <option value="outbound">
                          {t("calls.messagesTab.direction.outbound")}
                        </option>
                        <option value="inbound">
                          {t("calls.messagesTab.direction.inbound")}
                        </option>
                      </select>
                    </div>

                    <div>
                      <label
                        className="callpanel-filter-label"
                      >
                        {t("calls.logsTab.filters.wantsContactLabel")}
                      </label>
                      <select
                        value={wantsContactFilter}
                        onChange={(e) => setWantsContactFilter(e.target.value)}
                        className="callpanel-filter-select"
                      >
                        <option value="">
                          {t("calls.logsTab.filters.all")}
                        </option>
                        <option value="true">
                          {t("calls.logsTab.filters.wantsContactOptions.yes")}
                        </option>
                        <option value="false">
                          {t("calls.logsTab.filters.wantsContactOptions.no")}
                        </option>
                      </select>
                    </div>
                  </div>

                  <div
                    className="callpanel-filters-grid"
                  >
                    <div>
                      <label
                        className="callpanel-filter-label"
                      >
                        {t("calls.logsTab.filters.dateFrom")}
                      </label>
                      <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="callpanel-filter-select"
                      />
                    </div>

                    <div>
                      <label
                        className="callpanel-filter-label"
                      >
                        {t("calls.logsTab.filters.dateTo")}
                      </label>
                      <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="callpanel-filter-select"
                      />
                    </div>
                  </div>

                  <div className="callpanel-flex-row">
                    <Button
                      onClick={handleSearch}
                      disabled={loadingCallLogs}
                      className="callpanel-search-btn"
                    >
                      {t("calls.logsTab.filters.searchButton")}
                    </Button>
                    <Button
                      onClick={clearFilters}
                      className="callpanel-clear-btn"
                      variant="secondary"
                    >
                      🗑️ {t("calls.logsTab.filters.clearButton")}
                    </Button>
                  </div>
                </div>

                {/* Tilastot */}
                <div
                  className="callpanel-stats-grid"
                >
                  {/* Soittoyritykset - ensimmäinen kortti */}
                  <div className="callpanel-stat-card">
                    <div className="callpanel-stat-value indigo">{stats.totalCalls}</div>
                    <div className="callpanel-stat-label">{t("dashboard.campaigns.stats.calledCalls")}</div>
                  </div>

                  <div className="callpanel-stat-card">
                    <div className="callpanel-stat-value green">{stats.answered}</div>
                    <div className="callpanel-stat-label">{t("calls.logsTab.filters.statusOptions.success")}</div>
                  </div>

                  <div className="callpanel-stat-card">
                    <div className="callpanel-stat-value emerald">{stats.successful}</div>
                    <div className="callpanel-stat-label">{t("calls.logsTab.filters.statusOptions.successful")}</div>
                  </div>

                  <div className="callpanel-stat-card">
                    <div className="callpanel-stat-value red">{stats.failed}</div>
                    <div className="callpanel-stat-label">{t("calls.logsTab.filters.statusOptions.failed")}</div>
                  </div>

                  <div className="callpanel-stat-card">
                    <div className="callpanel-stat-value amber">{stats.pending}</div>
                    <div className="callpanel-stat-label">{t("calls.logsTab.filters.statusOptions.pending")}</div>
                  </div>

                  <div className="callpanel-stat-card">
                    <div className="callpanel-stat-value blue">{stats.inProgress}</div>
                    <div className="callpanel-stat-label">{t("calls.logsTab.filters.statusOptions.inProgress")}</div>
                  </div>

                  <div className="callpanel-stat-card">
                    <div className="callpanel-stat-value indigo">{stats.totalLogs}</div>
                    <div className="callpanel-stat-label">{t("calls.callPanel.stats.totalLogs")}</div>
                  </div>

                  {/* Outbound/Inbound tilastot */}
                  <div className="callpanel-stat-card">
                    <div className="callpanel-stat-value blue">{stats.outbound}</div>
                    <div className="callpanel-stat-label">{t("calls.messagesTab.direction.outbound")}</div>
                  </div>

                  <div className="callpanel-stat-card">
                    <div className="callpanel-stat-value amber">{stats.inbound}</div>
                    <div className="callpanel-stat-label">{t("calls.messagesTab.direction.inbound")}</div>
                  </div>

                  {/* Hinta-tilastot */}
                  <div className="callpanel-stat-card">
                    <div className="callpanel-stat-value emerald">
                      €{callLogs.reduce((total, log) => total + (parseFloat(log.price) || 0), 0).toFixed(2)}
                    </div>
                    <div className="callpanel-stat-label">{t("calls.callPanel.stats.totalPrice")}</div>
                  </div>
                </div>

                {/* Virheviesti */}
                {callLogsError && (
                  <div className="callpanel-toast error">
                    ❌ {callLogsError}
                  </div>
                )}

                {/* Puheluloki lista */}
                <div>
                  <div className="callpanel-section-header">
                    <h3 className="callpanel-section-title">
                      {t("calls.callPanel.history.title")}
                    </h3>
                    {totalCount > 0 && (
                      <div className="callpanel-stat-label">
                        {t("calls.callPanel.history.totalCalls", {
                          count: totalCount,
                        })}
                      </div>
                    )}
                  </div>

                  {loadingCallLogs ? (
                    <div className="callpanel-empty-state">
                      {t("calls.callPanel.history.loading")}
                    </div>
                  ) : callLogs.length === 0 ? (
                    <div className="callpanel-empty-state">
                      {t("calls.callPanel.history.empty")}
                    </div>
                  ) : (
                    <div className="callpanel-table-wrapper">
                      <table className="callpanel-table">
                        <thead>
                          <tr>
                            <th>{t("calls.callPanel.table.name")}</th>
                            <th>{t("calls.callPanel.table.phoneNumber")}</th>
                            <th>{t("calls.callPanel.table.email")}</th>
                            <th>{t("calls.callPanel.table.summary")}</th>
                            <th>{t("calls.callPanel.table.callType")}</th>
                            <th
                              className="sortable"
                              onClick={() => handleSort("call_date")}
                              title={t("accessibility.sortByDate")}
                            >
                              {t("calls.callPanel.table.date")}
                              {sortField === "call_date" && (
                                <span className="sort-indicator">
                                  {sortDirection === "asc" ? "↑" : "↓"}
                                </span>
                              )}
                            </th>
                            <th>{t("calls.callPanel.table.answered")}</th>
                            <th>{t("calls.callPanel.table.wantsContact")}</th>
                            <th>{t("calls.messagesTab.table.direction")}</th>
                            <th
                              className="sortable"
                              onClick={() => handleSort("duration")}
                              title={t("accessibility.sortByDuration")}
                            >
                              {t("calls.callPanel.table.duration")}
                              {sortField === "duration" && (
                                <span className="sort-indicator">
                                  {sortDirection === "asc" ? "↑" : "↓"}
                                </span>
                              )}
                            </th>
                            <th
                              className="sortable text-center"
                              onClick={() => handleSort("call_status")}
                              title={t("accessibility.sortByStatus")}
                            >
                              {t("calls.callPanel.table.status")}
                              {sortField === "call_status" && (
                                <span className="sort-indicator">
                                  {sortDirection === "asc" ? "↑" : "↓"}
                                </span>
                              )}
                            </th>
                            <th className="text-right">
                              {t("calls.callPanel.table.attempts")}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {callLogs.map((log, index) => (
                            <tr
                              key={`${log.id}-${index}`}
                              onClick={() => fetchLogDetail(log)}
                            >
                              <td className="name-cell">
                                {log.customer_name ||
                                  t("calls.callPanel.unknownName")}
                              </td>
                              <td>{log.phone_number || "-"}</td>
                              <td>{log.email || "-"}</td>
                              <td className="summary-cell">
                                {log.summary
                                  ? log.summary.length > 50
                                    ? log.summary.substring(0, 50) + "..."
                                    : log.summary
                                  : "-"}
                              </td>
                              <td>{log.call_type || "-"}</td>
                              <td>
                                {log.call_date
                                  ? new Date(log.call_date).toLocaleDateString(
                                      "fi-FI",
                                    ) +
                                    " " +
                                    (log.call_time
                                      ? log.call_time
                                      : new Date(
                                          log.call_date,
                                        ).toLocaleTimeString("fi-FI", {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        }))
                                  : "-"}
                              </td>
                              <td>
                                {log.answered
                                  ? t("calls.callPanel.badges.answered.yes")
                                  : t("calls.callPanel.badges.answered.no")}
                              </td>
                              <td className="text-center">
                                {log.wants_contact === true ? (
                                  <span className="callpanel-badge success">
                                    ✅{" "}
                                    {t(
                                      "calls.callPanel.badges.wantsContact.yes",
                                    )}
                                  </span>
                                ) : log.wants_contact === false ? (
                                  <span className="callpanel-badge danger">
                                    ❌{" "}
                                    {t(
                                      "calls.callPanel.badges.wantsContact.no",
                                    )}
                                  </span>
                                ) : (
                                  <span className="callpanel-badge neutral">
                                    ⚪{" "}
                                    {t(
                                      "calls.callPanel.badges.wantsContact.undefined",
                                    )}
                                  </span>
                                )}
                              </td>
                              <td className="text-center">
                                <span
                                  className={`callpanel-badge ${log.direction === "outbound" ? "info" : "warning"}`}
                                >
                                  {log.direction === "outbound"
                                    ? t(
                                        "calls.callPanel.badges.direction.outbound",
                                      )
                                    : t(
                                        "calls.callPanel.badges.direction.inbound",
                                      )}
                                </span>
                              </td>
                              <td>
                                {log.duration
                                  ? formatDuration(log.duration)
                                  : "-"}
                              </td>
                              <td className="text-center">
                                <span
                                  className={`callpanel-badge ${
                                    log.call_date && log.call_time && log.call_status === "pending"
                                      ? "info"
                                      : log.call_status === "done" && log.call_outcome === "cancelled"
                                        ? "danger"
                                        : log.call_status === "done" && log.call_outcome === "voice mail"
                                          ? "warning"
                                          : log.call_status === "done" && log.answered
                                            ? "success"
                                            : log.call_status === "pending"
                                              ? "neutral"
                                              : log.call_status === "in progress"
                                                ? "info"
                                                : "danger"
                                  }`}
                                >
                                  {log.call_date &&
                                  log.call_time &&
                                  log.call_status === "pending"
                                    ? t(
                                        "calls.callPanel.badges.status.scheduled",
                                      )
                                    : log.call_status === "done" &&
                                        log.call_outcome === "cancelled"
                                      ? t(
                                          "calls.callPanel.badges.status.cancelled",
                                        )
                                      : log.call_status === "done" &&
                                          log.call_outcome === "voice mail"
                                        ? t(
                                            "calls.callPanel.badges.status.voicemail",
                                          )
                                        : log.call_status === "done" &&
                                            log.answered
                                          ? t(
                                              "calls.callPanel.badges.status.success",
                                            )
                                          : log.call_status === "done" &&
                                              !log.answered
                                            ? t(
                                                "calls.callPanel.badges.status.failed",
                                              )
                                            : log.call_status === "pending"
                                              ? t(
                                                  "calls.callPanel.badges.status.pending",
                                                )
                                              : log.call_status ===
                                                  "in progress"
                                                ? t(
                                                    "calls.callPanel.badges.status.inProgress",
                                                  )
                                                : t(
                                                    "calls.callPanel.badges.status.unknown",
                                                  )}
                                </span>
                              </td>
                              <td className="text-right">
                                {log.call_status === "pending" ? (
                                  <span className="callpanel-text-muted">—</span>
                                ) : (
                                  <span className="callpanel-attempt-count">
                                    {log.attempt_count != null
                                      ? log.attempt_count
                                      : 1}
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "manage" && (
              <div className="callpanel-card">
                {/* Toast-viestit */}
                {successMessage && (
                  <div className="callpanel-toast success">
                    <span>✅ {successMessage}</span>
                    <button
                      onClick={() => setSuccessMessage("")}
                      className="callpanel-toast-close"
                    >
                      ×
                    </button>
                  </div>
                )}

                {errorMessage && (
                  <div className="callpanel-toast error">
                    <span>❌ {errorMessage}</span>
                    <button
                      onClick={() => setErrorMessage("")}
                      className="callpanel-toast-close"
                    >
                      ×
                    </button>
                  </div>
                )}
                <div className="callpanel-manage-header">
                  <h2 className="callpanel-manage-title">
                    {t("calls.manageTab.header.title")}
                  </h2>
                  <Button
                    type="button"
                    onClick={openAddModal}
                    variant="primary"
                  >
                    {t("calls.manageTab.cta.addNew")}
                  </Button>
                </div>

                {/* Olemassa olevat puhelun tyypit */}
                <div>
                  <h3 className="callpanel-section-title">
                    {t("calls.manageTab.existing.title")}
                  </h3>

                  {loadingCallTypes ? (
                    <div className="callpanel-empty-state">
                      {t("calls.manageTab.loading")}
                    </div>
                  ) : callTypes.length === 0 ? (
                    <div className="callpanel-empty-state">
                      {t("calls.manageTab.empty")}
                    </div>
                  ) : (
                    <>
                      <div className="mb-4">
                        <div className="callpanel-sort-controls">
                          <span>{t("calls.manageTab.sort.label")}</span>
                          <button
                            onClick={() =>
                              setCallTypes(
                                [...callTypes].sort((a, b) =>
                                  a.status === "Active"
                                    ? -1
                                    : b.status === "Active"
                                      ? 1
                                      : 0,
                                ),
                              )
                            }
                            className="callpanel-sort-btn"
                          >
                            {t("calls.manageTab.sort.byStatus")}
                          </button>
                          <button
                            onClick={() =>
                              setCallTypes(
                                [...callTypes].sort((a, b) =>
                                  a.label.localeCompare(b.label),
                                ),
                              )
                            }
                            className="callpanel-sort-btn"
                          >
                            🔤 {t("calls.manageTab.sort.byName")}
                          </button>
                        </div>
                      </div>
                      <div className="callpanel-types-grid">
                        {callTypes.map((type, index) => (
                          <div
                            key={type.id || index}
                            onClick={() => openEditModal(type)}
                            className="callpanel-type-card"
                          >
                            <div>
                              <div className="callpanel-type-name">
                                {type.label}
                              </div>
                              <div className="callpanel-text-small">
                                {t("calls.manageTab.item.identifier")}{" "}
                                <code className="callpanel-code">
                                  {type.value}
                                </code>
                                <span
                                  className={`callpanel-type-status-inline ${
                                    type.status === "Active"
                                      ? "active"
                                      : type.status === "Draft"
                                        ? "draft"
                                        : "inactive"
                                  }`}
                                >
                                  {type.status === "Active"
                                    ? t("calls.manageTab.item.statusActive")
                                    : type.status === "Draft"
                                      ? t("calls.manageTab.item.statusDraft")
                                      : t("calls.manageTab.item.statusUnknown")}
                                </span>
                              </div>
                              {type.description && (
                                <div className="callpanel-text-small">
                                  {type.description}
                                </div>
                              )}
                            </div>
                            <div className="callpanel-type-actions">
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopyCallType(type);
                                }}
                                variant="secondary"
                                className="callpanel-copy-btn"
                                title="Kopioi puhelun tyyppi"
                              >
                                Kopioi
                              </Button>
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteCallType(type.id);
                                }}
                                disabled={deletingCallTypes.has(type.id)}
                                variant="secondary"
                                className={`callpanel-delete-btn ${deletingCallTypes.has(type.id) ? "disabled" : ""}`}
                                title={
                                  deletingCallTypes.has(type.id)
                                    ? t("calls.manageTab.item.deletingTitle")
                                    : t("calls.manageTab.item.deleteTitle")
                                }
                              >
                                {deletingCallTypes.has(type.id) ? (
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                ) : (
                                  t("calls.manageTab.item.delete")
                                )}
                              </Button>
                            </div>
                            <div className="callpanel-text-muted">
                              {t("calls.manageTab.item.edit")}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {activeTab === "messages" && (
              <MessageLogsTab
                fetchMessageLogs={fetchMessageLogs}
                loadingMessageLogs={loadingMessageLogs}
                messageLogsError={messageLogsError}
                messageLogs={messageLogs}
              />
            )}

            {activeTab === "textmessages" && (
              <div className="callpanel-card">
                <div className="callpanel-manage-header">
                  <h2 className="callpanel-manage-title">
                    {t("calls.textMessagesTab.header")}
                  </h2>
                  <div className="callpanel-flex-row">
                    <Button
                      type="button"
                      onClick={() => fetchCallTypes()}
                      disabled={loadingCallTypes}
                      variant="secondary"
                      className={`callpanel-refresh-btn ${loadingCallTypes ? "disabled" : ""}`}
                    >
                      {loadingCallTypes
                        ? t("calls.textMessagesTab.buttons.refreshing")
                        : t("calls.textMessagesTab.buttons.refresh")}
                    </Button>
                  </div>
                </div>

                {/* Tekstiviestit lista */}
                <div>
                  <div className="callpanel-section-header">
                    <h3 className="callpanel-section-title">
                      {t("calls.textMessagesTab.sectionTitle")}
                    </h3>
                    {callTypes.length > 0 && (
                      <div className="callpanel-stat-label">
                        {t("calls.textMessagesTab.showingCount", {
                          count: callTypes.length,
                        })}
                      </div>
                    )}
                  </div>

                  {loadingCallTypes ? (
                    <div className="callpanel-empty-state">
                      {t("calls.textMessagesTab.loadingTypes")}
                    </div>
                  ) : callTypes.length === 0 ? (
                    <div className="callpanel-empty-state">
                      {t("calls.textMessagesTab.empty")}
                    </div>
                  ) : (
                    <div className="callpanel-types-grid">
                      {callTypes.map((type, index) => (
                        <div
                          key={type.id || index}
                          className="callpanel-sms-card"
                        >
                          <div className="callpanel-sms-header">
                            <div>
                              <h4 className="callpanel-sms-title">
                                {type.label ||
                                  type.name ||
                                  type.callType ||
                                  t("calls.textMessagesTab.card.unnamed")}
                              </h4>
                              <div className="callpanel-sms-meta">
                                <span
                                  className={`callpanel-type-status-inline ${
                                    type.status === "Active"
                                      ? "active"
                                      : type.status === "Draft"
                                        ? "draft"
                                        : "inactive"
                                  }`}
                                >
                                  {type.status === "Active"
                                    ? t(
                                        "calls.textMessagesTab.card.statusActive",
                                      )
                                    : type.status === "Draft"
                                      ? t(
                                          "calls.textMessagesTab.card.statusDraft",
                                        )
                                      : t(
                                          "calls.textMessagesTab.card.statusUnknown",
                                        )}
                                </span>
                                <span className="callpanel-text-small">
                                  {t("calls.textMessagesTab.card.identifier")}{" "}
                                  <code className="callpanel-code">
                                    {type.value || type.callType}
                                  </code>
                                </span>
                              </div>
                            </div>
                            <Button
                              onClick={() => {
                                setEditingCallType(type);
                                setShowEditModal(true);
                              }}
                              variant="secondary"
                              className="callpanel-edit-btn"
                            >
                              {t("calls.textMessagesTab.card.edit")}
                            </Button>
                          </div>

                          <div className="callpanel-sms-form-group">
                            <label className="callpanel-sms-label">
                              {t("calls.textMessagesTab.card.messageLabel")}
                            </label>
                            <textarea
                              value={type.first_sms || ""}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value.length <= 160) {
                                  const updatedType = {
                                    ...type,
                                    first_sms: value,
                                  };
                                  setEditingCallType(updatedType);
                                  const updatedCallTypes = callTypes.map((t) =>
                                    t.id === type.id ? updatedType : t,
                                  );
                                  setCallTypes(updatedCallTypes);
                                }
                              }}
                              placeholder={t(
                                "calls.textMessagesTab.card.placeholder",
                              )}
                              rows={4}
                              maxLength={160}
                              className="callpanel-sms-textarea"
                            />
                            <div className="callpanel-sms-counter">
                              <span className="callpanel-text-muted">
                                {type.first_sms
                                  ? `${type.first_sms.length}/160 ${t("calls.textMessagesTab.card.counterSuffix")}`
                                  : `0/160 ${t("calls.textMessagesTab.card.counterSuffix")}`}
                              </span>
                              {type.first_sms &&
                                type.first_sms.length > 140 && (
                                  <span className="callpanel-text-warning">
                                    {t("calls.textMessagesTab.card.longHint", {
                                      parts:
                                        type.first_sms.length > 150 ? 2 : 1,
                                    })}
                                  </span>
                                )}
                            </div>
                          </div>

                          <div className="callpanel-sms-footer">
                            <div className="callpanel-sms-stats">
                              {type.first_sms ? (
                                <span className="callpanel-text-success">
                                  {t("calls.textMessagesTab.card.defined")}
                                </span>
                              ) : (
                                <span className="callpanel-text-danger">
                                  {t("calls.textMessagesTab.card.notDefined")}
                                </span>
                              )}
                            </div>
                            <Button
                              onClick={async () => {
                                try {
                                  const { error } = await supabase
                                    .from("call_types")
                                    .update({ first_sms: type.first_sms })
                                    .eq("id", type.id);
                                  if (error) throw error;
                                  setSuccessMessage(
                                    t("calls.textMessagesTab.card.save"),
                                  );
                                  setTimeout(() => setSuccessMessage(""), 3000);
                                } catch (error) {
                                  console.error(
                                    "SMS-viestin tallennus epäonnistui:",
                                    error,
                                  );
                                  setErrorMessage(
                                    "SMS-viestin tallennus epäonnistui: " +
                                      (error.message || error),
                                  );
                                  setTimeout(() => setErrorMessage(""), 5000);
                                }
                              }}
                              disabled={
                                !type.first_sms || type.first_sms.trim() === ""
                              }
                              variant="primary"
                              className={`callpanel-sms-save-btn ${!type.first_sms || type.first_sms.trim() === "" ? "disabled" : ""}`}
                            >
                              {t("calls.textMessagesTab.card.save")}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "mika" && (
              <CRM
                user={user}
                callTypes={callTypes}
                selectedVoice={selectedVoice}
                mikaSearchResults={mikaSearchResults}
                mikaSearchName={mikaSearchName}
                setMikaSearchName={setMikaSearchName}
                mikaSearchTitle={mikaSearchTitle}
                setMikaSearchTitle={setMikaSearchTitle}
                mikaSearchOrganization={mikaSearchOrganization}
                setMikaSearchOrganization={setMikaSearchOrganization}
                mikaSearchLoading={mikaSearchLoading}
                loadingMikaContacts={loadingMikaContacts}
                mikaContactsError={mikaContactsError}
                handleMikaSearch={handleMikaSearch}
                handleMikaMassCall={handleMikaMassCall}
                handleMikaSingleCall={handleMikaSingleCall}
                handleMikaMassCallAll={handleMikaMassCallAll}
                handleMikaMassCallSelected={handleMikaMassCallSelected}
              />
            )}
          </div>
        </div>

        {/* Yksityiskohtainen näkymä modal */}
        {showLogDetail && selectedLog && (
          <CallDetailModal
            selectedLog={selectedLog}
            loading={loadingLogDetail}
            onClose={() => setShowLogDetail(false)}
            onBackgroundClick={handleModalBackgroundClick}
            formatDuration={formatDuration}
            detailActiveTab={detailActiveTab}
            setDetailActiveTab={setDetailActiveTab}
            showMoreDetails={showMoreDetails}
            setShowMoreDetails={setShowMoreDetails}
          />
        )}

        <AddCallTypeModal
          showModal={showAddModal}
          onClose={() => {
            closeModals();
            setAddModalAiEnhancementSent(false);
          }}
          onCancel={() => {
            closeModals();
            setAddModalAiEnhancementSent(false);
          }}
          newCallType={newCallType}
          setNewCallType={setNewCallType}
          onAdd={handleAddCallType}
          loading={addTypeLoading}
          error={addTypeError}
          success={addTypeSuccess}
          onAIEnhancementSent={() => setAddModalAiEnhancementSent(true)}
        />
        <EditCallTypeModal
          showModal={showEditModal}
          onClose={() => {
            closeModals();
            setEditModalAiEnhancementSent(false);
          }}
          onCancel={() => {
            closeModals();
            setEditModalAiEnhancementSent(false);
          }}
          editingCallType={editingCallType}
          setEditingCallType={setEditingCallType}
          onSave={handleSaveCallType}
          onAIEnhancementSent={() => setEditModalAiEnhancementSent(true)}
        />

        <EditInboundSettingsModal
          showModal={showEditInboundModal}
          onClose={async (opts) => {
            const save = opts?.save !== false;
            if (save && !aiEnhancementSent) {
              await handleSaveEditInboundSettings();
            }
            setShowEditInboundModal(false);
            setEditingInboundSettings(null);
            setAiEnhancementSent(false); // Reset flag
          }}
          editingInboundSettings={editingInboundSettings}
          setEditingInboundSettings={setEditingInboundSettings}
          onSave={handleSaveEditInboundSettings}
          getVoiceOptions={getVoiceOptions}
          playVoiceSample={playVoiceSample}
          onAIEnhancement={handleInboundAIEnhancement}
        />

        <CallsKnowledgeBaseModal
          open={showCallsKnowledgeModal}
          onClose={() => setShowCallsKnowledgeModal(false)}
        />

        {/* Inbound-asetukset modaali */}
        <InboundSettingsModal
          open={showInboundModal}
          onClose={() => setShowInboundModal(false)}
          inboundVoice={inboundVoice}
          setInboundVoice={setInboundVoice}
          inboundWelcomeMessage={inboundWelcomeMessage}
          setInboundWelcomeMessage={setInboundWelcomeMessage}
          inboundScript={inboundScript}
          setInboundScript={setInboundScript}
          handleSaveInboundSettings={handleSaveInboundSettings}
          getVoiceOptions={getVoiceOptions}
          playVoiceSample={playVoiceSample}
        />

        <MassCallModal
          open={showMassCallModal}
          onClose={resetMassCallModal}
          massCallStep={massCallStep}
          setMassCallStep={setMassCallStep}
          massCallSheetUrl={massCallSheetUrl}
          setMassCallSheetUrl={setMassCallSheetUrl}
          massCallValidating={massCallValidating}
          massCallValidationResult={massCallValidationResult}
          massCallError={massCallError}
          handleMassCallValidate={handleMassCallValidate}
          massCallCallType={massCallCallType}
          setMassCallCallType={setMassCallCallType}
          massCallSelectedVoice={massCallSelectedVoice}
          setMassCallSelectedVoice={setMassCallSelectedVoice}
          massCallSmsFirst={massCallSmsFirst}
          setMassCallSmsFirst={setMassCallSmsFirst}
          massCallSmsAfterCall={massCallSmsAfterCall}
          setMassCallSmsAfterCall={setMassCallSmsAfterCall}
          massCallSmsMissedCall={massCallSmsMissedCall}
          setMassCallSmsMissedCall={setMassCallSmsMissedCall}
          massCallCampaignId={massCallCampaignId}
          setMassCallCampaignId={setMassCallCampaignId}
          massCallCampaigns={massCallCampaigns}
          callTypes={callTypes}
          getVoiceOptions={getVoiceOptions}
          massCallScheduledDate={massCallScheduledDate}
          setMassCallScheduledDate={setMassCallScheduledDate}
          massCallScheduledTime={massCallScheduledTime}
          setMassCallScheduledTime={setMassCallScheduledTime}
          massCallStarting={massCallStarting}
          massCallScheduling={massCallScheduling}
          handleMassCallStart={handleMassCallStart}
          handleMassCallSchedule={handleMassCallSchedule}
        />

        <SingleCallModal
          open={showSingleCallModal}
          onClose={() => setShowSingleCallModal(false)}
          callType={callType}
          setCallType={setCallType}
          selectedVoice={selectedVoice}
          setSelectedVoice={setSelectedVoice}
          name={name}
          setName={setName}
          phoneNumber={phoneNumber}
          setPhoneNumber={setPhoneNumber}
          singleCallSmsFirst={singleCallSmsFirst}
          setSingleCallSmsFirst={setSingleCallSmsFirst}
          singleCallSmsAfterCall={singleCallSmsAfterCall}
          setSingleCallSmsAfterCall={setSingleCallSmsAfterCall}
          singleCallSmsMissedCall={singleCallSmsMissedCall}
          setSingleCallSmsMissedCall={setSingleCallSmsMissedCall}
          callTypes={callTypes}
          getVoiceOptions={getVoiceOptions}
          script={script}
          calling={calling}
          singleCallError={singleCallError}
          handleSingleCall={handleSingleCall}
          updateScriptFromCallType={updateScriptFromCallType}
        />

        {/* Export Modal */}
        <ExportCallLogsModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          callLogs={callLogs}
          formatDuration={formatDuration}
          onSuccess={(message) => {
            setSuccessMessage(message);
            setTimeout(() => setSuccessMessage(""), 3000);
          }}
          onError={(message) => {
            setErrorMessage(message);
            setTimeout(() => setErrorMessage(""), 3000);
          }}
        />
      </div>
    </>
  );
}
