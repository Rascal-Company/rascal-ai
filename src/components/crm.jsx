import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Button from "./Button.jsx";
import { supabase } from "../lib/supabase";

const CRM = ({
  user,
  callTypes,
  selectedVoice,
  mikaSearchResults,
  mikaSearchName,
  setMikaSearchName,
  mikaSearchTitle,
  setMikaSearchTitle,
  mikaSearchOrganization,
  setMikaSearchOrganization,
  mikaSearchLoading,
  loadingMikaContacts,
  mikaContactsError,
  handleMikaSearch,
  handleMikaMassCall,
  handleMikaSingleCall,
  handleMikaMassCallAll,
  handleMikaMassCallSelected,
}) => {
  const [showCallTypeModal, setShowCallTypeModal] = useState(false);
  const [selectedCallTypeForMika, setSelectedCallTypeForMika] = useState("");
  const [selectedVoiceForMika, setSelectedVoiceForMika] = useState(
    selectedVoice || "rascal-nainen-1",
  );
  const [mikaCallTypeLoading, setMikaCallTypeLoading] = useState(false);
  const [selectedContactIds, setSelectedContactIds] = useState(new Set());
  const [selectedContactsForModal, setSelectedContactsForModal] = useState([]);

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

  // Normalisoi puhelinnumerot kansainväliseen muotoon +[maakoodi]...
  const normalizePhoneNumber = (phoneNumber) => {
    if (!phoneNumber) return null;
    let cleaned = phoneNumber.toString().replace(/[\s-]/g, "");

    // Lisää +358 vain 0-alkuisiin numeroihin (suomalaiset)
    if (/^0\d+/.test(cleaned)) {
      return "+358" + cleaned.slice(1);
    }

    // Jos alkaa +:lla, palauta sellaisenaan (kansainväliset numerot)
    if (cleaned.startsWith("+")) {
      return cleaned;
    }

    // Kaikki muut hylätään (ei maakoodia)
    return null;
  };

  const handleMikaMassCallAllWithType = async () => {
    if (!selectedCallTypeForMika) {
      alert("Valitse puhelun tyyppi!");
      return;
    }
    if (!selectedVoiceForMika) {
      alert("Valitse ääni!");
      return;
    }
    setMikaCallTypeLoading(true);
    try {
      const sourceContacts =
        selectedContactsForModal && selectedContactsForModal.length > 0
          ? selectedContactsForModal
          : mikaSearchResults;
      const allContactsData = sourceContacts
        .map((contact) => {
          const computedId =
            contact.id ??
            contact.contact_id ??
            contact.person_id ??
            contact.external_id ??
            contact.crm_id ??
            null;
          return {
            id: computedId,
            name: contact.name,
            phone: contact.phones && contact.phones[0] ? contact.phones[0] : "",
            email:
              contact.primary_email ||
              (contact.emails && contact.emails[0]) ||
              "",
            company: contact.organization?.name || "",
            title:
              contact.custom_fields && contact.custom_fields[0]
                ? contact.custom_fields[0]
                : "",
            address: contact.organization?.address || "",
          };
        })
        .filter((contact) => contact.phone);
      if (allContactsData.length === 0) {
        alert("Ei kontakteja puhelinnumerolla!");
        return;
      }
      const selectedCallTypeData = callTypes.find(
        (type) => type.value === selectedCallTypeForMika,
      );
      if (!selectedCallTypeData) {
        throw new Error("Valittua puhelun tyyppiä ei löytynyt");
      }
      const script = selectedCallTypeData?.intro || "Hei! Soitan sinulle...";
      const callTypeId =
        selectedCallTypeData.id || "ef0ae790-b6c0-4264-a798-a913549ef8ea";
      // Hae oikea user_id (organisaation ID kutsutuille käyttäjille)
      const { getUserOrgId } = await import("../lib/getUserOrgId");
      const userId = await getUserOrgId(user?.id);
      if (!userId) {
        throw new Error("Käyttäjää ei löytynyt");
      }
      const callLogs = [];
      let startedCalls = 0;
      let failedCalls = 0;
      for (const contact of allContactsData) {
        try {
          let phoneNumber =
            contact.phone ||
            (contact.phones && contact.phones[0]) ||
            contact.phone_number ||
            contact.tel;
          let name =
            contact.name ||
            contact.customer_name ||
            `${contact.first_name || ""} ${contact.last_name || ""}`.trim();
          if (!name) {
            const possibleNameFields = [
              "title",
              "company",
              "organization",
              "email",
            ];
            for (const field of possibleNameFields) {
              if (contact[field]) {
                name = contact[field];
                break;
              }
            }
          }
          if (!name) {
            name = `Asiakas ${startedCalls + 1}`;
          }
          if (phoneNumber) {
            const normalizedPhoneNumber = normalizePhoneNumber(phoneNumber);
            const selectedVoiceObj = voiceOptions.find(
              (v) => v.value === selectedVoiceForMika,
            );
            const voiceId = selectedVoiceObj?.id || selectedVoiceForMika;
            callLogs.push({
              user_id: userId,
              customer_name: name,
              phone_number: normalizedPhoneNumber,
              call_type: selectedCallTypeForMika,
              call_type_id: callTypeId,
              voice_id: voiceId,
              call_date: new Date().toISOString(),
              call_status: "pending",
              campaign_id: `mika-mass-call-${Date.now()}`,
              summary: `Mika Special mass-call: ${script.trim().substring(0, 100)}...`,
              crm_id: contact.id || null,
            });
            startedCalls++;
          } else {
            failedCalls++;
          }
        } catch {
          failedCalls++;
        }
      }
      if (callLogs.length === 0) {
        throw new Error("Puhelinnumeroita ei löytynyt kontaktidatasta");
      }
      const { data: insertedLogs, error: insertError } = await supabase
        .from("call_logs")
        .insert(callLogs)
        .select();
      if (insertError) {
        throw new Error(
          `Virhe call_logs kirjoittamisessa: ${insertError.message}`,
        );
      }
      setShowCallTypeModal(false);
      setSelectedCallTypeForMika("");
      setSelectedContactsForModal([]);
      setSelectedContactIds(new Set());
      alert(
        `✅ Massapuhelut aloitettu!\n\nAloitettu: ${insertedLogs.length} puhelua`,
      );
    } catch (error) {
      alert(`Virhe mass-call käynnistyksessä: ${error.message}`);
    } finally {
      setMikaCallTypeLoading(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-2xl shadow-md p-8 w-full">
        <h2 className="m-0 text-2xl font-bold text-gray-800 mb-6">
          Kontaktihaku
        </h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleMikaSearch();
          }}
          className="flex flex-col gap-4 mb-6"
        >
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Nimi
              </label>
              <input
                type="text"
                value={mikaSearchName}
                onChange={(e) => setMikaSearchName(e.target.value)}
                placeholder="Syötä nimi..."
                className="w-full p-3 border border-gray-300 rounded-lg text-base"
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Tehtävänimike
              </label>
              <input
                type="text"
                value={mikaSearchTitle}
                onChange={(e) => setMikaSearchTitle(e.target.value)}
                placeholder="Syötä tehtävänimike..."
                className="w-full p-3 border border-gray-300 rounded-lg text-base"
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Organisaatio
              </label>
              <input
                type="text"
                value={mikaSearchOrganization}
                onChange={(e) => setMikaSearchOrganization(e.target.value)}
                placeholder="Syötä organisaatio..."
                className="w-full p-3 border border-gray-300 rounded-lg text-base"
              />
            </div>
          </div>
          <Button
            type="submit"
            variant="primary"
            className="py-3 px-6 text-base font-semibold self-start"
            disabled={mikaSearchLoading || loadingMikaContacts}
          >
            {mikaSearchLoading ? "Haetaan..." : "Hae"}
          </Button>
        </form>
        {loadingMikaContacts && (
          <div className="text-center text-gray-500 mb-4">
            Ladataan kontakteja...
          </div>
        )}
        {mikaContactsError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm mb-4">
            ❌ {mikaContactsError}
          </div>
        )}
        {mikaSearchResults.length > 0 ? (
          <div className="mt-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-700 m-0">
                Hakutulokset ({mikaSearchResults.length})
              </h3>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    const selectedRaw = mikaSearchResults
                      .map((c, idx) => ({ c, key: c.id || idx }))
                      .filter(({ key }) => selectedContactIds.has(key))
                      .map(({ c }) => c)
                      .filter((c) => c.phones && c.phones[0]);
                    if (selectedRaw.length === 0) {
                      alert(
                        "Valitse vähintään yksi kontakti, jolla on puhelinnumero",
                      );
                      return;
                    }
                    setSelectedContactsForModal(selectedRaw);
                    setShowCallTypeModal(true);
                  }}
                  variant="secondary"
                  disabled={selectedContactIds.size === 0}
                  className="py-2.5 px-4 text-sm font-semibold"
                >
                  Lisää valitut massapuheluihin
                </Button>
                <Button
                  onClick={() => setShowCallTypeModal(true)}
                  variant="primary"
                  className="py-2.5 px-5 text-sm font-semibold bg-emerald-500 text-white border-none rounded-md cursor-pointer"
                >
                  Aloitetaan puhelut ({mikaSearchResults.length})
                </Button>
              </div>
            </div>
            <div className="grid gap-4">
              {mikaSearchResults.map((contact, idx) => (
                <div
                  key={contact.id || idx}
                  className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex flex-col gap-2"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedContactIds.has(contact.id || idx)}
                      onChange={(e) => {
                        const next = new Set(selectedContactIds);
                        const key = contact.id || idx;
                        if (e.target.checked) next.add(key);
                        else next.delete(key);
                        setSelectedContactIds(next);
                      }}
                    />
                    <div className="font-semibold text-base">
                      {contact.name || "Nimetön"}
                    </div>
                  </div>
                  <div className="text-gray-500 text-sm">
                    <strong>Tehtävänimike:</strong>{" "}
                    {contact.custom_fields && contact.custom_fields[0]
                      ? contact.custom_fields[0]
                      : "Ei määritelty"}
                  </div>
                  <div className="text-gray-500 text-sm">
                    <strong>Organisaatio:</strong>{" "}
                    {contact.organization?.name || "Ei määritelty"}
                  </div>
                  <div className="text-gray-500 text-sm">
                    <strong>Osoite:</strong>{" "}
                    {contact.organization?.address || "Ei määritelty"}
                  </div>
                  <div className="text-gray-500 text-sm">
                    <strong>Sähköposti:</strong>{" "}
                    {contact.primary_email ||
                      (contact.emails && contact.emails[0]) ||
                      "-"}
                  </div>
                  <div className="text-gray-500 text-sm">
                    <strong>Puhelin:</strong>{" "}
                    {contact.phones && contact.phones[0]
                      ? contact.phones[0]
                      : "-"}
                  </div>
                  {contact.result_score && (
                    <div className="text-emerald-600 text-xs italic">
                      Hakupisteet: {Math.round(contact.result_score * 100)}%
                    </div>
                  )}
                  <div className="mt-2 flex gap-2">
                    <Button
                      onClick={() => {
                        handleMikaMassCall(contact);
                      }}
                      variant="primary"
                      className="py-2 px-4 text-sm font-semibold bg-blue-500 text-white border-none rounded-md cursor-pointer"
                      disabled={!contact.phones || contact.phones.length === 0}
                    >
                      Lisää massapuheluihin
                    </Button>
                    <Button
                      onClick={() => handleMikaSingleCall(contact)}
                      variant="secondary"
                      className="py-2 px-4 text-sm font-semibold bg-gray-100 text-gray-700 border border-gray-300 rounded-md cursor-pointer"
                      disabled={!contact.phones || contact.phones.length === 0}
                    >
                      Yksittäinen soitto
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-gray-500 text-[15px] mt-6">
            {(mikaSearchName || mikaSearchTitle || mikaSearchOrganization) &&
              !mikaSearchLoading &&
              "Ei tuloksia haulla."}
            {!mikaSearchName &&
              !mikaSearchTitle &&
              !mikaSearchOrganization &&
              "Syötä vähintään yksi hakukenttä ja paina Hae."}
          </div>
        )}
      </div>

      {showCallTypeModal &&
        createPortal(
          <div
            onClick={() => setShowCallTypeModal(false)}
            className="modal-overlay modal-overlay--dark"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="modal-container max-w-[500px]"
            >
              <div className="modal-header">
                <h2 className="modal-title text-xl">
                  Valitse puhelun tyyppi ja ääni
                </h2>
                <Button
                  onClick={() => setShowCallTypeModal(false)}
                  variant="secondary"
                  className="modal-close-btn"
                >
                  ✕
                </Button>
              </div>
              <div className="modal-body">
                <p className="mb-4 text-gray-500">
                  Valitse puhelun tyyppi ja ääni{" "}
                  {selectedContactsForModal.length > 0
                    ? selectedContactsForModal.length
                    : mikaSearchResults.length}{" "}
                  kontaktille:
                </p>
                <label className="label">Puhelun tyyppi</label>
                <select
                  value={selectedCallTypeForMika}
                  onChange={(e) => setSelectedCallTypeForMika(e.target.value)}
                  className="select w-full mb-4"
                >
                  <option value="">Valitse puhelun tyyppi...</option>
                  {callTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                <label className="label">Ääni</label>
                <select
                  value={selectedVoiceForMika}
                  onChange={(e) => setSelectedVoiceForMika(e.target.value)}
                  className="select w-full mb-4"
                >
                  {voiceOptions.map((voice) => (
                    <option key={voice.value} value={voice.value}>
                      {voice.label}
                    </option>
                  ))}
                </select>
                <div className="flex gap-2 justify-end">
                  <Button
                    onClick={() => setShowCallTypeModal(false)}
                    variant="secondary"
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </Button>
                  <Button
                    onClick={handleMikaMassCallAllWithType}
                    variant="primary"
                    disabled={
                      !selectedCallTypeForMika ||
                      !selectedVoiceForMika ||
                      mikaCallTypeLoading
                    }
                  >
                    {mikaCallTypeLoading ? "Käsitellään..." : "Aloita soitot"}
                  </Button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
};

export default CRM;
