import React, { createContext, useContext, useReducer, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { getUserOrgId } from '../lib/getUserOrgId'

// Initial state
const initialState = {
  posts: [],
  reelsPosts: [],
  socialAccounts: [],
  selectedAccounts: [],
  loading: false,
  reelsLoading: false,
  loadingAccounts: false,
  error: null,
  reelsError: null,
  filters: {
    searchTerm: '',
    statusFilter: '',
    typeFilter: '',
    dataSourceToggle: 'all'
  },
  modals: {
    showCreateModal: false,
    showEditModal: false,
    showPublishModal: false
  },
  editingPost: null,
  publishingPost: null
}

// Action types
const ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_REELS_LOADING: 'SET_REELS_LOADING',
  SET_ACCOUNTS_LOADING: 'SET_ACCOUNTS_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_REELS_ERROR: 'SET_REELS_ERROR',
  SET_POSTS: 'SET_POSTS',
  SET_REELS_POSTS: 'SET_REELS_POSTS',
  SET_SOCIAL_ACCOUNTS: 'SET_SOCIAL_ACCOUNTS',
  SET_SELECTED_ACCOUNTS: 'SET_SELECTED_ACCOUNTS',
  SET_FILTERS: 'SET_FILTERS',
  SET_MODALS: 'SET_MODALS',
  SET_EDITING_POST: 'SET_EDITING_POST',
  SET_PUBLISHING_POST: 'SET_PUBLISHING_POST',
  ADD_POST: 'ADD_POST',
  UPDATE_POST: 'UPDATE_POST',
  DELETE_POST: 'DELETE_POST',
  CLEAR_ERRORS: 'CLEAR_ERRORS'
}

// Reducer
const postsReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload }
    
    case ACTIONS.SET_REELS_LOADING:
      return { ...state, reelsLoading: action.payload }
    
    case ACTIONS.SET_ACCOUNTS_LOADING:
      return { ...state, loadingAccounts: action.payload }
    
    case ACTIONS.SET_ERROR:
      return { ...state, error: action.payload }
    
    case ACTIONS.SET_REELS_ERROR:
      return { ...state, reelsError: action.payload }
    
    case ACTIONS.SET_POSTS:
      return { ...state, posts: action.payload }
    
    case ACTIONS.SET_REELS_POSTS:
      return { ...state, reelsPosts: action.payload }
    
    case ACTIONS.SET_SOCIAL_ACCOUNTS:
      return { ...state, socialAccounts: action.payload }
    
    case ACTIONS.SET_SELECTED_ACCOUNTS:
      return { ...state, selectedAccounts: action.payload }
    
    case ACTIONS.SET_FILTERS:
      return { 
        ...state, 
        filters: { ...state.filters, ...action.payload }
      }
    
    case ACTIONS.SET_MODALS:
      return { 
        ...state, 
        modals: { ...state.modals, ...action.payload }
      }
    
    case ACTIONS.SET_EDITING_POST:
      return { ...state, editingPost: action.payload }
    
    case ACTIONS.SET_PUBLISHING_POST:
      return { ...state, publishingPost: action.payload }
    
    case ACTIONS.ADD_POST:
      return { 
        ...state, 
        posts: [action.payload, ...state.posts]
      }
    
    case ACTIONS.UPDATE_POST:
      return {
        ...state,
        posts: state.posts.map(post => 
          post.id === action.payload.id ? action.payload : post
        )
      }
    
    case ACTIONS.DELETE_POST:
      return {
        ...state,
        posts: state.posts.filter(post => post.id !== action.payload)
      }
    
    case ACTIONS.CLEAR_ERRORS:
      return {
        ...state,
        error: null,
        reelsError: null
      }
    
    default:
      return state
  }
}

// Create context
const PostsContext = createContext()

// Provider component
export const PostsProvider = ({ children }) => {
  const [state, dispatch] = useReducer(postsReducer, initialState)

  // Memoized selectors for better performance
  const filteredPosts = useMemo(() => {
    let filtered = state.posts

    // Apply search filter
    if (state.filters.searchTerm) {
      const searchLower = state.filters.searchTerm.toLowerCase()
      filtered = filtered.filter(post => 
        post.title.toLowerCase().includes(searchLower) ||
        post.caption?.toLowerCase().includes(searchLower)
      )
    }

    // Apply status filter
    if (state.filters.statusFilter) {
      filtered = filtered.filter(post => post.status === state.filters.statusFilter)
    }

    // Apply type filter
    if (state.filters.typeFilter) {
      filtered = filtered.filter(post => post.type === state.filters.typeFilter)
    }

    return filtered
  }, [state.posts, state.filters])

  const postsByStatus = useMemo(() => {
    const grouped = {}
    
    // Erikoiskäsittely Avatar-sarakkeelle
    const avatarPosts = filteredPosts.filter(post => 
      post.status === 'Kesken' && post.source === 'reels' && post.type === 'Avatar'
    )
    
    // Muut postit normaalisti statusin mukaan
    filteredPosts.forEach(post => {
      // Avatar-kuvat menevät Avatar-sarakkeeseen
      if (post.status === 'Kesken' && post.source === 'reels' && post.type === 'Avatar') {
        if (!grouped['Avatar']) {
          grouped['Avatar'] = []
        }
        grouped['Avatar'].push(post)
      }
      // Muut reels-postit menevät Kesken-sarakkeeseen
      else if (post.status === 'Kesken' && post.source === 'reels' && post.type !== 'Avatar') {
        if (!grouped['Kesken']) {
          grouped['Kesken'] = []
        }
        grouped['Kesken'].push(post)
      }
      // Supabase-postit menevät normaalisti statusin mukaan
      else {
        if (!grouped[post.status]) {
          grouped[post.status] = []
        }
        grouped[post.status].push(post)
      }
    })
    
    return grouped
  }, [filteredPosts])

  // Actions
  const setLoading = useCallback((loading) => {
    dispatch({ type: ACTIONS.SET_LOADING, payload: loading })
  }, [])

  const setError = useCallback((error) => {
    dispatch({ type: ACTIONS.SET_ERROR, payload: error })
  }, [])

  const setPosts = useCallback((posts) => {
    dispatch({ type: ACTIONS.SET_POSTS, payload: posts })
  }, [])

  const setFilters = useCallback((filters) => {
    dispatch({ type: ACTIONS.SET_FILTERS, payload: filters })
  }, [])

  const setModals = useCallback((modals) => {
    dispatch({ type: ACTIONS.SET_MODALS, payload: modals })
  }, [])

  const setEditingPost = useCallback((post) => {
    dispatch({ type: ACTIONS.SET_EDITING_POST, payload: post })
  }, [])

  const setPublishingPost = useCallback((post) => {
    dispatch({ type: ACTIONS.SET_PUBLISHING_POST, payload: post })
  }, [])

  const addPost = useCallback((post) => {
    dispatch({ type: ACTIONS.ADD_POST, payload: post })
  }, [])

  const updatePost = useCallback((post) => {
    dispatch({ type: ACTIONS.UPDATE_POST, payload: post })
  }, [])

  const deletePost = useCallback((postId) => {
    dispatch({ type: ACTIONS.DELETE_POST, payload: postId })
  }, [])

  const clearErrors = useCallback(() => {
    dispatch({ type: ACTIONS.CLEAR_ERRORS })
  }, [])

  // Data fetching functions
  const fetchPosts = useCallback(async (userId) => {
    if (!userId) return
    
    try {
      setLoading(true)
      setError(null)
      
      // Hae oikea user_id (organisaation ID kutsutuille käyttäjille)
      const { getUserOrgId } = await import('../lib/getUserOrgId')
      const userDataId = await getUserOrgId(userId)
      
      if (!userDataId) {
        throw new Error('Käyttäjän ID ei löytynyt')
      }
      
      // Haetaan käyttäjän some-sisältö (ei Blog/Newsletter, ei poistettuja)
      const { data, error } = await supabase
        .from('content')
        .select('*')
        .eq('user_id', userDataId)
        .neq('type', 'Blog')
        .neq('type', 'Newsletter')
        .neq('status', 'Deleted')
        .order('created_at', { ascending: false })
      
      if (error) {
        throw error
      }
      
      // Haetaan kaikki segments-data yhdellä kyselyllä
      const carouselContentIds = data.filter(item => item.type === 'Carousel').map(item => item.id)
      
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
      
      // Yhdistetään content ja segments data
      const contentWithSegments = data.map(contentItem => {
        if (contentItem.type === 'Carousel') {
          const itemSegments = segmentsData.filter(segment => segment.content_id === contentItem.id)
          return {
            ...contentItem,
            segments: itemSegments
          }
        }
        return contentItem
      })

      // Transform data to Kanban format
      const transformedData = transformSupabaseData(contentWithSegments)
      setPosts(transformedData || [])
      
    } catch (err) {
      console.error('Virhe datan haussa:', err)
      setError('Datan haku epäonnistui')
    } finally {
      setLoading(false)
    }
  }, [setLoading, setError, setPosts])

  const fetchSocialAccounts = useCallback(async (userId) => {
    if (!userId) return
    
    try {
      dispatch({ type: ACTIONS.SET_ACCOUNTS_LOADING, payload: true })
      
      // Hae organisaation ID (public.users.id)
      const orgId = await getUserOrgId(userId)
      if (!orgId) {
        console.error('Organisaation ID ei löytynyt')
        dispatch({ type: ACTIONS.SET_SOCIAL_ACCOUNTS, payload: [] })
        return
      }
      
      // Käytä user_social_accounts taulua organisaation ID:llä
      try {
        const { data, error } = await supabase
          .from('user_social_accounts')
          .select('*')
          .eq('user_id', orgId) // Käytetään organisaation ID:tä
          .eq('is_authorized', true)
        
        if (error) {
          dispatch({ type: ACTIONS.SET_SOCIAL_ACCOUNTS, payload: [] })
          return
        }
        
        dispatch({ type: ACTIONS.SET_SOCIAL_ACCOUNTS, payload: data || [] })
      } catch (tableError) {
        dispatch({ type: ACTIONS.SET_SOCIAL_ACCOUNTS, payload: [] })
      }
      
    } catch (err) {
      console.error('Virhe sosiaalisten tilien haussa:', err)
      // Älä aseta virhettä, koska taulua ei ole vielä luotu
      dispatch({ type: ACTIONS.SET_SOCIAL_ACCOUNTS, payload: [] })
    } finally {
      dispatch({ type: ACTIONS.SET_ACCOUNTS_LOADING, payload: false })
    }
  }, [])

  const fetchReelsPosts = useCallback(async (userId) => {
    if (!userId) return

    try {
      dispatch({ type: ACTIONS.SET_REELS_LOADING, payload: true })
      dispatch({ type: ACTIONS.SET_REELS_ERROR, payload: null })

      // Hae organisaation ID
      const orgId = await getUserOrgId(userId)

      if (!orgId) {
        throw new Error('Käyttäjän ID ei löytynyt')
      }

      const { data, error } = await supabase
        .from('content')
        .select('*')
        .eq('user_id', orgId)
        .eq('type', 'Reel')
        .order('created_at', { ascending: false })

      if (error) throw error

      const transformedReels = transformReelsData(data || [])
      dispatch({ type: ACTIONS.SET_REELS_POSTS, payload: transformedReels })

    } catch (err) {
      console.error('Virhe reels-datan haussa:', err)
      dispatch({ type: ACTIONS.SET_REELS_ERROR, payload: 'Reels-datan haku epäonnistui' })
    } finally {
      dispatch({ type: ACTIONS.SET_REELS_LOADING, payload: false })
    }
  }, [])

  // Helper functions (moved from component)
  const transformSupabaseData = (supabaseData) => {
    if (!supabaseData || !Array.isArray(supabaseData)) return []
    
    return supabaseData.map(item => {
      const statusMap = {
        'Draft': 'Kesken',
        'In Progress': 'Kesken', 
        'Under Review': 'Tarkistuksessa',
        'Scheduled': 'Aikataulutettu',
        'Done': 'Tarkistuksessa',
        'Published': 'Julkaistu',
        'Deleted': 'Poistettu'
      }
      
      let status = statusMap[item.status] || 'Kesken'
      
      const now = new Date()
      const publishDate = item.publish_date ? new Date(item.publish_date) : null
      
      if (publishDate && publishDate > now && status === 'Julkaistu') {
        status = 'Aikataulutettu'
      }
      
      let thumbnail = null;
      if (item.type === 'Carousel') {
        if (item.segments && item.segments.length > 0) {
          const firstSegment = item.segments.find(seg => seg.slide_no === 1) || item.segments[0];
          thumbnail = firstSegment.media_urls?.[0] || null;
        }
      } else {
        thumbnail = item.media_urls?.[0] || null;
      }
      
      return {
        id: item.id,
        title: item.idea || item.caption || 'Nimetön julkaisu',
        status: status,
        thumbnail: thumbnail,
        caption: item.caption || '',
        type: item.type || 'Post',
        createdAt: item.created_at,
        publishDate: item.publish_date,
        segments: item.segments || [],
        mediaUrls: item.media_urls || [],
        originalData: item
      }
    })
  }

  const transformReelsData = (reelsData) => {
    if (!reelsData || !Array.isArray(reelsData)) return []
    
    return reelsData.map(item => {
      // Tunnista avatar-kuvat "Type (from Variables) (from Companies)" kentän perusteella
      const isAvatar = Array.isArray(item["Type (from Variables) (from Companies)"]) && 
                      item["Type (from Variables) (from Companies)"].includes("Avatar")
      
      return {
        id: item.id,
        title: isAvatar ? `Avatar ${item.id}` : (item.Idea || item.caption || 'Nimetön reel'),
        status: 'Kesken',
        thumbnail: item.media_urls?.[0] || null,
        caption: isAvatar ? `Avatar-kuva ${item.id}` : (item.caption || ''),
        type: isAvatar ? 'Avatar' : 'Reel',
        createdAt: item.createdTime || item.created_at,
        mediaUrls: item.media_urls || [],
        hashtags: item.Hashtags || item.hashtags || [],
        voiceover: item.Voiceover || item.voiceover || '',
        source: 'reels',
        originalData: item
      }
    })
  }

  const value = {
    // State
    ...state,
    filteredPosts,
    postsByStatus,
    
    // Actions
    setLoading,
    setError,
    setPosts,
    setFilters,
    setModals,
    setEditingPost,
    setPublishingPost,
    addPost,
    updatePost,
    deletePost,
    clearErrors,
    
    // Data fetching
    fetchPosts,
    fetchSocialAccounts,
    fetchReelsPosts
  }

  return (
    <PostsContext.Provider value={value}>
      {children}
    </PostsContext.Provider>
  )
}

// Custom hook
export const usePosts = () => {
  const context = useContext(PostsContext)
  if (!context) {
    throw new Error('usePosts must be used within a PostsProvider')
  }
  return context
} 