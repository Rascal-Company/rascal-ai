/**
 * Post data normalization utilities
 * Muuntaa eri lähteiden datan yhtenäiseen muotoon
 * Ratkaisu media_urls -kaaokseen
 */

import { POST_STATUS_MAP } from "../constants/posts";

/**
 * @typedef {'Photo' | 'Carousel' | 'Reels' | 'LinkedIn' | 'Video'} PostType
 * @typedef {'Kesken' | 'Tarkistuksessa' | 'Aikataulutettu' | 'Julkaistu' | 'Deleted'} PostStatus
 * @typedef {'supabase' | 'reels' | 'mixpost'} PostSource
 */

/**
 * Status mapping from Supabase to UI
 * @param {string} status
 * @returns {PostStatus}
 */
const mapSupabaseStatus = (status) => {
  return POST_STATUS_MAP[status] || "Kesken";
};

/**
 * Status mapping from Reels to UI
 * @param {string} [status]
 * @returns {PostStatus}
 */
const mapReelsStatus = (status) => {
  if (!status) return "Kesken";
  const normalized = status.toLowerCase().trim();
  if (normalized.includes("progress")) return "Kesken";
  if (normalized.includes("review") || normalized.includes("pending"))
    return "Tarkistuksessa";
  if (normalized.includes("scheduled")) return "Aikataulutettu";
  if (normalized.includes("published")) return "Julkaistu";
  return "Kesken";
};

/**
 * Status mapping from Mixpost to UI
 * @param {string} status
 * @param {string | null} scheduledAt
 * @param {string | null} publishedAt
 * @returns {PostStatus}
 */
const mapMixpostStatus = (status, scheduledAt, publishedAt) => {
  if (publishedAt) return "Julkaistu";
  if (scheduledAt) return "Aikataulutettu";
  if (status === "draft") return "Kesken";
  return "Tarkistuksessa";
};

/**
 * Extract media URLs from various sources
 * Ratkaisu 5-kohtaiseen if-else -ketjuun
 * @param {any} source
 * @param {PostType} [type]
 * @param {any[]} [segments]
 * @returns {string[]}
 */
const extractMediaUrls = (source, type, segments) => {
  // 1. Array-muoto (Supabase: media_urls)
  if (Array.isArray(source.media_urls) && source.media_urls.length > 0) {
    return source.media_urls;
  }

  // 2. Array-muoto (Reels: mediaUrls)
  if (Array.isArray(source.mediaUrls) && source.mediaUrls.length > 0) {
    return source.mediaUrls;
  }

  // 3. originalData fallback
  if (
    source.originalData?.media_urls &&
    Array.isArray(source.originalData.media_urls) &&
    source.originalData.media_urls.length > 0
  ) {
    return source.originalData.media_urls;
  }

  // 4. Thumbnail fallback
  if (
    source.thumbnail &&
    typeof source.thumbnail === "string" &&
    source.thumbnail.startsWith("http")
  ) {
    return [source.thumbnail];
  }

  // 5. Carousel segments fallback
  if (type === "Carousel" && segments && segments.length > 0) {
    return segments
      .filter((seg) => seg.media_urls && Array.isArray(seg.media_urls))
      .flatMap((seg) => seg.media_urls);
  }

  // 6. Mixpost media array
  if (Array.isArray(source.media) && source.media.length > 0) {
    return source.media.map((m) => m.url).filter(Boolean);
  }

  return [];
};

/**
 * Normalisoi Supabase-postaus
 * @param {any} raw
 * @param {any[]} [segments]
 * @returns {any} Normalized post
 */
export const normalizeSupabasePost = (raw, segments) => {
  const type = raw.type || "Photo";
  const mediaUrls = extractMediaUrls(raw, type, segments);

  return {
    id: raw.id,
    userId: raw.user_id,
    type,
    status: mapSupabaseStatus(raw.status),
    source: "supabase",

    title: raw.idea || null,
    caption: raw.caption || null,
    mediaUrls, // NORMALISOITU

    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
    publishDate: raw.publish_date || null,
    scheduledDate: raw.publish_date
      ? new Date(raw.publish_date).toISOString().split("T")[0]
      : null,

    provider: raw.provider || null,
    thumbnail: mediaUrls[0] || null,
    isGenerated: raw.is_generated ?? false,

    voiceover: raw.voiceover || null,
    voiceoverReady: raw.voiceover_ready ?? false,
    selectedAvatarId: raw.selected_avatar_id || null,

    segments,

    originalData: raw,
  };
};

/**
 * Normalisoi Reels-postaus
 * @param {any} raw
 * @returns {any} Normalized post
 */
export const normalizeReelsPost = (raw) => {
  const fields = raw.Fields || {};
  const mediaUrls = Array.isArray(fields.Media)
    ? fields.Media.filter(Boolean)
    : [];

  return {
    id: raw.id,
    userId: "",
    type: "Reels",
    status: mapReelsStatus(fields.Status),
    source: "reels",

    title: fields.Idea || null,
    caption: fields.Caption || null,
    mediaUrls, // NORMALISOITU

    createdAt: fields["Created at"] || new Date().toISOString(),
    updatedAt: fields["Created at"] || new Date().toISOString(),
    publishDate: null,
    scheduledDate: null,

    provider: "instagram",
    thumbnail: mediaUrls[0] || null,
    isGenerated: false,

    voiceover: fields.Voiceover || null,
    voiceoverReady: fields["Voiceover ready"] ?? false,
    selectedAvatarId: null,

    originalData: raw,
  };
};

/**
 * Normalisoi Mixpost-postaus
 * @param {any} raw
 * @returns {any} Normalized post
 */
export const normalizeMixpostPost = (raw) => {
  const caption = raw.content?.[0]?.body || "";
  const mediaUrls = extractMediaUrls(raw);

  return {
    id: raw.uuid, // Mixpost käyttää UUID:ta
    userId: "",
    type: "Photo", // Default, voidaan päätellä media_urls:sta
    status: mapMixpostStatus(raw.status, raw.scheduled_at, raw.published_at),
    source: "mixpost",

    title: null,
    caption,
    mediaUrls, // NORMALISOITU

    createdAt: raw.created_at,
    updatedAt: raw.created_at,
    publishDate: raw.scheduled_at || raw.published_at || null,
    scheduledDate: raw.scheduled_at
      ? new Date(raw.scheduled_at).toISOString().split("T")[0]
      : null,

    provider: null,
    thumbnail: mediaUrls[0] || null,
    isGenerated: false,

    voiceover: null,
    voiceoverReady: false,
    selectedAvatarId: null,

    originalData: raw,
  };
};

/**
 * Auto-detect source and normalize
 * @param {any} raw
 * @param {any[]} [segments]
 * @returns {any} Normalized post
 */
export const normalizePost = (raw, segments) => {
  // Detect source
  if (raw.source === "reels" || raw.Fields) {
    return normalizeReelsPost(raw);
  }

  if (raw.source === "mixpost" || raw.uuid) {
    return normalizeMixpostPost(raw);
  }

  // Default to Supabase
  return normalizeSupabasePost(raw, segments);
};

/**
 * Batch normalize posts
 * @param {any[]} rawPosts
 * @returns {any[]} Normalized posts
 */
export const normalizePosts = (rawPosts) => {
  return rawPosts.map((raw) => normalizePost(raw));
};
