/**
 * Transform Supabase data to the format expected by blog/newsletter components
 */
export const transformSupabaseData = (supabaseData, t) => {
  if (!supabaseData || !Array.isArray(supabaseData)) {
    return [];
  }

  const transformed = supabaseData.map((item) => {
    // Map Supabase status with translations
    const statusMap = {
      Draft: t("status.draft"),
      "In Progress": t("status.inProgress"),
      "Under Review": t("status.underReview"),
      Scheduled: t("status.scheduled"),
      Done: t("status.done"),
      Published: t("status.published"),
      Deleted: t("status.deleted"),
      Archived: t("status.archived"),
    };

    let status = statusMap[item.status] || t("status.draft");

    // If status is "Done" but publish_date is in the future, it's "Scheduled"
    const now = new Date();
    const publishDate = item.publish_date ? new Date(item.publish_date) : null;

    if (publishDate && publishDate > now && status === t("status.published")) {
      status = t("status.scheduled");
    }

    // Use placeholder image if media_urls is not available or empty
    const thumbnail =
      item.media_urls && item.media_urls.length > 0 && item.media_urls[0]
        ? item.media_urls[0]
        : "/placeholder.png";

    const transformedItem = {
      id: item.id,
      title: item.idea || item.caption || t("general.untitledContent"),
      status: status,
      thumbnail: thumbnail,
      caption: item.caption || item.idea || t("general.noDescription"),
      type: item.type || t("general.blog"),
      idea: item.idea || "",
      blog_post: item.blog_post || "",
      meta_description: item.meta_description || "",
      createdAt: item.created_at
        ? new Date(item.created_at).toISOString().split("T")[0]
        : null,
      scheduledDate:
        item.publish_date && publishDate > now
          ? new Date(item.publish_date).toISOString().split("T")[0]
          : null,
      publishedAt:
        item.publish_date && publishDate <= now
          ? new Date(item.publish_date).toISOString().split("T")[0]
          : null,
      publishDate: item.publish_date
        ? new Date(item.publish_date).toISOString().slice(0, 16)
        : null,
      mediaUrls: item.media_urls || [],
      hashtags: item.hashtags || [],
      voiceover: item.voiceover || "",
      voiceoverReady: item.voiceover_ready || false,
      originalData: item,
      source: "supabase",
    };

    return transformedItem;
  });

  return transformed;
};
