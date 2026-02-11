// Apufunktiot inaktiivisuuden tunnistamiseen ja timeout-hallintaan

// Debounce-funktio aktiviteetin tunnistamiseen
export const debounce = (func, wait) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// Aktiviteetin tunnistamiseen käytettävät eventit
export const ACTIVITY_EVENTS = [
  'mousemove',
  'mousedown',
  'keydown',
  'scroll',
  'touchstart',
  'touchmove',
  'click',
  'focus'
]

// Sivukohtaiset timeout-asetukset (minuutteina)
export const CONTEXT_TIMEOUTS = {
  '/dashboard': 20,
  '/posts': 45,
  '/blog-newsletter': 45,
  '/strategy': 45,
  '/ai-chat': 15,
  '/calls': 15,
  '/settings': 15,
  '/admin': 15,
  '/help': 20
}

// Oletusarvoinen timeout
export const DEFAULT_TIMEOUT = 20

// Varoituksen näyttöaika ennen logoutia (minuutteina)
export const WARNING_TIME = 5

// Aktiviteetin tunnistus debounce-ajalla (millisekunteina)
export const ACTIVITY_DEBOUNCE = 1000

// Timeout-asetukset käyttäjälle (labelit käännetään komponentissa)
export const TIMEOUT_OPTIONS = [
  { value: 15 },
  { value: 20 },
  { value: 30 },
  { value: 45 }
]

// LocalStorage avaimet
export const STORAGE_KEYS = {
  TIMEOUT_PREFERENCE: 'rascal_auto_logout_timeout',
  LAST_ACTIVITY: 'rascal_last_activity'
}

// Aktiviteetin tallentaminen localStorageen
export const updateLastActivity = () => {
  localStorage.setItem(STORAGE_KEYS.LAST_ACTIVITY, Date.now().toString())
}

// Viimeisen aktiviteetin haku
export const getLastActivity = () => {
  const lastActivity = localStorage.getItem(STORAGE_KEYS.LAST_ACTIVITY)
  if (!lastActivity) {
    // Jos ei ole tallennettua aktiviteettiä, alusta se nykyisellä ajalla
    updateLastActivity()
    return Date.now()
  }
  return parseInt(lastActivity, 10)
}

// Timeout-asetuksen tallentaminen
export const saveTimeoutPreference = (timeout) => {
  localStorage.setItem(STORAGE_KEYS.TIMEOUT_PREFERENCE, timeout.toString())
}

// Timeout-asetuksen haku
export const getTimeoutPreference = () => {
  const preference = localStorage.getItem(STORAGE_KEYS.TIMEOUT_PREFERENCE)
  return preference ? parseInt(preference, 10) : null
}

// Kontekstin timeout-asetuksen haku
export const getContextTimeout = (pathname) => {
  const userPreference = getTimeoutPreference()
  if (userPreference) {
    return userPreference
  }
  
  return CONTEXT_TIMEOUTS[pathname] || DEFAULT_TIMEOUT
}

// Ajan muotoilu minuutteina ja sekunteina
export const formatTime = (seconds) => {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

// BroadcastChannel API:n tuki
export const createBroadcastChannel = (channelName) => {
  if (typeof BroadcastChannel !== 'undefined') {
    try {
      return new BroadcastChannel(channelName)
    } catch (error) {
      console.warn('BroadcastChannel not supported:', error)
      return null
    }
  }
  return null
}

// Aktiviteetin tunnistus debounce-ajalla
export const createActivityDetector = (callback) => {
  const debouncedCallback = debounce(callback, ACTIVITY_DEBOUNCE)
  
  const handleActivity = () => {
    updateLastActivity()
    debouncedCallback()
  }
  
  return handleActivity
} 