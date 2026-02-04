import { useState, useRef, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { getUserOrgId } from "../lib/getUserOrgId";

const DEFAULT_VOICE_OPTIONS = [
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

export function useVoicePlayback(user, onUserVoiceLoaded) {
  const [userVoiceId, setUserVoiceId] = useState(null);
  const [userVoiceLabel, setUserVoiceLabel] = useState("Oma ääni");
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio, setAudio] = useState(null);
  const [currentlyPlayingVoice, setCurrentlyPlayingVoice] = useState(null);
  const [isStopping, setIsStopping] = useState(false);
  const [currentAudio, setCurrentAudio] = useState(null);
  const [audioInfo, setAudioInfo] = useState("");
  const audioElementsRef = useRef([]);

  useEffect(() => {
    const fetchUserVoiceId = async () => {
      if (!user?.id) return;
      try {
        const orgId = await getUserOrgId(user.id);
        if (!orgId) return;

        const { data, error } = await supabase
          .from("users")
          .select("voice_id")
          .eq("id", orgId)
          .single();

        if (error) throw error;

        if (data?.voice_id) {
          setUserVoiceId(data.voice_id);
          setUserVoiceLabel("Oma ääni");
          if (onUserVoiceLoaded) {
            onUserVoiceLoaded(data.voice_id);
          }
        }
      } catch (err) {
        console.error("Error in fetchUserVoiceId:", err);
      }
    };
    fetchUserVoiceId();
  }, [user]);

  const stopAllAudio = () => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }

    audioElementsRef.current.forEach((audioEl) => {
      if (audioEl && !audioEl.paused) {
        audioEl.pause();
        audioEl.currentTime = 0;
      }
    });

    audioElementsRef.current = [];
    setCurrentAudio(null);
    setIsPlaying(false);
    setCurrentlyPlayingVoice(null);
    setAudioInfo("");
  };

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

  const getVoiceOptions = () => {
    let options = [...DEFAULT_VOICE_OPTIONS];
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

  return {
    userVoiceId,
    userVoiceLabel,
    isPlaying,
    currentlyPlayingVoice,
    currentAudio,
    audioInfo,
    stopAllAudio,
    playVoiceSample,
    getVoiceOptions,
  };
}
