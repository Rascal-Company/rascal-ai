import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { getCurrentUser } from '../../utils/userApi'
import { useOrgId } from './useOrgId'
import axios from 'axios'
import { POST_STATUS_MAP, MIXPOST_STATUS_MAP } from '../../constants/posts'

const transformSupabaseData = (supabaseData, t) => {
  if (!supabaseData || !Array.isArray(supabaseData)) return []

  return supabaseData.map((item) => {
    let status = POST_STATUS_MAP[item.status] || 'Kesken'
    const now = new Date()
    const publishDate = item.publish_date ? new Date(item.publish_date) : null

    if (publishDate && publishDate > now && status === 'Julkaistu') {
      status = 'Aikataulutettu'
    }

    let thumbnail = null
    if (item.type === 'Carousel') {
      if (item.segments && item.segments.length > 0) {
        const firstSegment = item.segments.find((seg) => seg.slide_no === 1) || item.segments[0]
        thumbnail = firstSegment.media_urls?.[0] || null
      }
    } else {
      thumbnail = item.media_urls?.[0] || null
    }

    return {
      id: item.id,
      title: item.idea || item.caption || (t ? t('posts.statuses.untitled') : 'Nimetön'),
      status,
      thumbnail,
      caption: item.caption || item.idea || 'Ei kuvausta',
      type: item.type || 'Photo',
      provider: item.provider || null,
      createdAt: item.created_at ? new Date(item.created_at).toISOString().split('T')[0] : null,
      scheduledDate: item.publish_date && publishDate > now ? new Date(item.publish_date).toISOString().split('T')[0] : null,
      publishedAt: item.publish_date && publishDate <= now ? new Date(item.publish_date).toISOString().split('T')[0] : null,
      publishDate: item.publish_date ? new Date(item.publish_date).toISOString().slice(0, 16) : null,
      mediaUrls: item.media_urls || [],
      media_urls: item.media_urls || [],
      hashtags: item.hashtags || [],
      voiceover: item.voiceover || '',
      voiceoverReady: item.voiceover_ready || false,
      segments: item.segments || [],
      originalData: { ...item, media_urls: item.media_urls || [] },
      source: 'supabase',
    }
  })
}

const transformReelsData = (reelsData, t) => {
  if (!reelsData || !Array.isArray(reelsData)) return []

  return reelsData.map((item) => {
    const status = item.status || 'Kesken'
    const isAvatar =
      Array.isArray(item['Type (from Variables) (from Companies)']) &&
      item['Type (from Variables) (from Companies)'].includes('Avatar')

    return {
      id: item.id,
      title: item.Idea || item.caption || (t ? t('posts.statuses.untitledReels') : 'Nimetön Reels'),
      status,
      thumbnail: item.media_urls?.[0] || null,
      caption: item.caption || 'Ei kuvausta',
      type: isAvatar ? 'Avatar' : 'Reel',
      createdAt: item.createdTime || item.created_at ? new Date(item.createdTime || item.created_at).toISOString().split('T')[0] : null,
      scheduledDate: null,
      publishedAt: null,
      mediaUrls: item.media_urls || [],
      hashtags: item.Hashtags || item.hashtags || [],
      voiceover: item.Voiceover || item.voiceover || '',
      originalData: item,
      source: 'reels',
    }
  })
}

async function fetchPostsData(orgId, t) {
  if (!orgId) return []

  const { data, error } = await supabase
    .from('content')
    .select('*')
    .eq('user_id', orgId)
    .neq('type', 'Blog')
    .neq('type', 'Newsletter')
    .neq('status', 'Deleted')
    .order('created_at', { ascending: false })

  if (error) throw error

  const carouselContentIds = data.filter((item) => item.type === 'Carousel').map((item) => item.id)

  let segmentsData = []
  if (carouselContentIds.length > 0) {
    const { data: segments, error: segmentsError } = await supabase
      .from('segments')
      .select('*')
      .in('content_id', carouselContentIds)
      .order('slide_no', { ascending: true })

    if (!segmentsError && segments) {
      segmentsData = segments
    }
  }

  const contentWithSegments = data.map((contentItem) => {
    if (contentItem.type === 'Carousel') {
      const itemSegments = segmentsData.filter((segment) => segment.content_id === contentItem.id)
      return { ...contentItem, segments: itemSegments }
    }
    return contentItem
  })

  return transformSupabaseData(contentWithSegments, t)
}

async function fetchReelsData(companyId, t) {
  if (!companyId) return []

  const response = await fetch(`/api/social/reels/list?companyId=${companyId}`)
  if (!response.ok) return []

  const data = await response.json()
  return transformReelsData(data, t)
}

async function fetchMixpostData() {
  const session = await supabase.auth.getSession()
  const token = session.data.session?.access_token

  if (!token) return []

  const response = await axios.get('/api/integrations/mixpost/posts', {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })

  return response.data.map((post) => {
    let thumbnail = null
    let mediaUrls = []

    if (post.versions && post.versions.length > 0) {
      const firstVersion = post.versions[0]
      if (firstVersion.content && firstVersion.content.length > 0) {
        const firstContent = firstVersion.content[0]
        if (firstContent.media && firstContent.media.length > 0) {
          const firstMedia = firstContent.media[0]
          thumbnail = firstMedia.thumb_url || firstMedia.url || null
          mediaUrls = firstContent.media.map((media) => media.thumb_url || media.url).filter(Boolean)
        }
      }
    }

    return {
      ...post,
      status: MIXPOST_STATUS_MAP[post.status] || post.status,
      thumbnail,
      mediaUrls,
      media_urls: mediaUrls,
      versions: post.versions || [],
    }
  })
}

async function fetchSocialAccountsData(orgId) {
  if (!orgId) return []

  const { data, error } = await supabase
    .from('user_social_accounts')
    .select('mixpost_account_uuid, provider, account_name, profile_image_url, username')
    .eq('user_id', orgId)
    .eq('is_authorized', true)
    .order('last_synced_at', { ascending: false })

  if (error) {
    console.error('Error fetching social accounts:', error)
    return []
  }

  return data || []
}

export function usePostsQuery(user, t) {
  const { orgId, isLoading: orgLoading } = useOrgId()
  const queryClient = useQueryClient()

  const postsQuery = useQuery({
    queryKey: ['posts', orgId],
    queryFn: () => fetchPostsData(orgId, t),
    enabled: !!orgId && !orgLoading,
    staleTime: 1000 * 60 * 2,
    placeholderData: [],
  })

  const reelsQuery = useQuery({
    queryKey: ['reels', user?.company_id],
    queryFn: async () => {
      const userData = await getCurrentUser()
      if (!userData?.company_id) return []
      return fetchReelsData(userData.company_id, t)
    },
    enabled: !!user && !orgLoading,
    staleTime: 1000 * 60 * 2,
    placeholderData: [],
  })

  const mixpostQuery = useQuery({
    queryKey: ['mixpost'],
    queryFn: fetchMixpostData,
    enabled: !!user && !orgLoading,
    staleTime: 1000 * 60 * 2,
    placeholderData: [],
  })

  const socialAccountsQuery = useQuery({
    queryKey: ['socialAccounts', orgId],
    queryFn: () => fetchSocialAccountsData(orgId),
    enabled: !!orgId && !orgLoading,
    staleTime: 1000 * 60 * 5,
    placeholderData: [],
  })

  const allPosts = useMemo(() => {
    return [...(postsQuery.data || []), ...(reelsQuery.data || []), ...(mixpostQuery.data || [])]
  }, [postsQuery.data, reelsQuery.data, mixpostQuery.data])

  const refetchAll = useCallback(() => {
    postsQuery.refetch()
    reelsQuery.refetch()
    mixpostQuery.refetch()
  }, [postsQuery, reelsQuery, mixpostQuery])

  return {
    posts: postsQuery.data,
    reelsPosts: reelsQuery.data,
    mixpostPosts: mixpostQuery.data,
    allPosts,
    socialAccounts: socialAccountsQuery.data,

    loading: postsQuery.isLoading || orgLoading,
    reelsLoading: reelsQuery.isLoading,
    mixpostLoading: mixpostQuery.isLoading,
    loadingAccounts: socialAccountsQuery.isLoading,
    currentLoading: postsQuery.isLoading || reelsQuery.isLoading || mixpostQuery.isLoading || orgLoading,

    error: postsQuery.error,
    reelsError: reelsQuery.error,
    currentError: postsQuery.error || reelsQuery.error,

    fetchPosts: postsQuery.refetch,
    fetchReelsPosts: reelsQuery.refetch,
    fetchMixpostPosts: mixpostQuery.refetch,
    fetchSocialAccounts: socialAccountsQuery.refetch,
    refetchAll,

    setPosts: (newPosts) => queryClient.setQueryData(['posts', orgId], newPosts),
    setReelsPosts: (newPosts) => queryClient.setQueryData(['reels', user?.company_id], newPosts),
    setMixpostPosts: (newPosts) => queryClient.setQueryData(['mixpost'], newPosts),

    transformSupabaseData: useCallback((data) => transformSupabaseData(data, t), [t]),
    transformReelsData: useCallback((data) => transformReelsData(data, t), [t]),
  }
}
