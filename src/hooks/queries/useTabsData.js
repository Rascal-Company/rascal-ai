import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { getUserOrgId } from "../../lib/getUserOrgId";
import { useAuth } from "../../contexts/AuthContext";
import { useOrgId } from "./useOrgId";

/**
 * UGC posts query
 * Used by UgcTab component
 */
export function useUgcPosts() {
  const { user } = useAuth();
  const { orgId, isLoading: orgLoading } = useOrgId();

  return useQuery({
    queryKey: ["ugcPosts", orgId],
    queryFn: async () => {
      if (!orgId) return [];

      const { data, error } = await supabase
        .from("content")
        .select("*")
        .eq("user_id", orgId)
        .eq("type", "UGC")
        .neq("status", "Deleted")
        .order("created_at", { ascending: false });

      if (error) throw error;

      return data || [];
    },
    enabled: !!orgId && !orgLoading,
    staleTime: 1000 * 60 * 5, // 5 minutes
    placeholderData: [],
  });
}

/**
 * Carousel posts query with segments
 * Used by CarouselsTab component
 */
export function useCarouselPosts() {
  const { user } = useAuth();
  const { orgId, isLoading: orgLoading } = useOrgId();

  return useQuery({
    queryKey: ["carouselPosts", orgId],
    queryFn: async () => {
      if (!orgId) return [];

      // Fetch carousel content
      const { data: contentData, error: contentError } = await supabase
        .from("content")
        .select("*")
        .eq("user_id", orgId)
        .eq("type", "Carousel")
        .neq("status", "Deleted")
        .order("created_at", { ascending: false });

      if (contentError) throw contentError;
      if (!contentData || contentData.length === 0) return [];

      // Fetch segments for all carousels
      const contentIds = contentData.map((item) => item.id);
      const { data: segmentsData, error: segmentsError } = await supabase
        .from("segments")
        .select("*")
        .in("content_id", contentIds);

      if (segmentsError) throw segmentsError;

      // Filter to only show carousels with "In Progress" segments
      const contentIdsWithInProgressSegments = new Set();
      if (segmentsData) {
        segmentsData.forEach((segment) => {
          if (segment.status === "In Progress") {
            contentIdsWithInProgressSegments.add(segment.content_id);
          }
        });
      }

      const filteredContentData = contentData.filter((content) =>
        contentIdsWithInProgressSegments.has(content.id),
      );

      // Group segments by content_id
      const segmentsByContentId = {};
      if (segmentsData) {
        segmentsData.forEach((segment) => {
          const contentId = segment.content_id;
          if (!segmentsByContentId[contentId]) {
            segmentsByContentId[contentId] = [];
          }
          segmentsByContentId[contentId].push({
            recordId: segment.id,
            text: segment.text,
            slideNo: segment.slide_no,
            status: segment.status,
            media_urls: segment.media_urls || [],
          });
        });
      }

      // Sort segments within each content
      Object.keys(segmentsByContentId).forEach((contentId) => {
        segmentsByContentId[contentId].sort((a, b) => {
          const slideA = String(a.slideNo || "0").toLowerCase();
          const slideB = String(b.slideNo || "0").toLowerCase();

          if (slideA === slideB) return 0;

          // Handle 'final' or 'x_final' - always move to end
          const isAFinal = slideA.includes("final");
          const isBFinal = slideB.includes("final");

          if (isAFinal && !isBFinal) return 1;
          if (!isAFinal && isBFinal) return -1;
          if (isAFinal && isBFinal) return slideA.localeCompare(slideB);

          const numA = parseInt(slideA);
          const numB = parseInt(slideB);

          if (isNaN(numA)) return 1;
          if (isNaN(numB)) return -1;

          return numA - numB;
        });
      });

      // Combine content and segments
      return filteredContentData.map((content) => {
        const contentRecordId = content.id;
        const segments = segmentsByContentId[contentRecordId] || [];

        return {
          content: {
            recordId: contentRecordId,
            caption: content.caption,
            idea: content.idea,
            status: content.status,
            type: content.type,
            created: content.created_at,
            hashtags: content.hashtags,
            segments: segments,
          },
        };
      });
    },
    enabled: !!orgId && !orgLoading,
    staleTime: 1000 * 60 * 5, // 5 minutes
    placeholderData: [],
  });
}
