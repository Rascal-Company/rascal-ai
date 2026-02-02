import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "./queryKeys";

function extractAudioFiles(apiData) {
  if (!Array.isArray(apiData)) return [];

  const audioFiles = [];
  for (const record of apiData) {
    if (record["Voice ID"]) {
      const voiceIds = Array.isArray(record["Voice ID"])
        ? record["Voice ID"]
        : [record["Voice ID"]];

      for (const voiceId of voiceIds) {
        if (voiceId) {
          audioFiles.push({
            url: null,
            id: voiceId,
            filename: "Voice Clone",
            fileType: "audio",
            voiceId: record["Variable ID"] || record.id,
            isPlaceholder: true,
          });
        }
      }
    }
    if (audioFiles.length >= 1) break;
  }
  return audioFiles.slice(0, 1);
}

async function fetchVoiceStatus(companyId) {
  if (!companyId) return [];

  const res = await fetch("/api/avatars/status", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ companyId }),
  });

  if (!res.ok) {
    throw new Error("Failed to fetch voice status");
  }

  const data = await res.json();
  return extractAudioFiles(data);
}

async function uploadVoiceFile({ file, companyId }) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("companyId", companyId);

  const res = await fetch("/api/avatars/upload", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Failed to upload voice file");
  }

  return res.json();
}

export function useVoiceStatus(companyId, options = {}) {
  const { enabled = true } = options;

  return useQuery({
    queryKey: queryKeys.voice.status(companyId),
    queryFn: () => fetchVoiceStatus(companyId),
    enabled: enabled && !!companyId,
    staleTime: 1000 * 60 * 5, // 5 min
    gcTime: 1000 * 60 * 30, // 30 min
  });
}

export function useVoiceUpload(companyId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file) => uploadVoiceFile({ file, companyId }),
    onSuccess: () => {
      setTimeout(() => {
        queryClient.invalidateQueries({
          queryKey: queryKeys.voice.status(companyId),
        });
      }, 3000);
    },
  });
}

export function useInvalidateVoiceStatus() {
  const queryClient = useQueryClient();

  return (companyId) => {
    queryClient.invalidateQueries({
      queryKey: queryKeys.voice.status(companyId),
    });
  };
}
