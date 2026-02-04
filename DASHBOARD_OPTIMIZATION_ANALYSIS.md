# DashboardPage Optimization Analysis

## 🔴 Current Issues

DashboardPage has **10 separate useEffect hooks** firing simultaneously on page load, causing **duplicate and excessive API calls**.

### All useEffect Hooks (Firing on Mount)

1. **Line 199** - `fetchMixpostAnalytics()`
   - Endpoint: `/api/analytics/social-stats`
   - Dependencies: `[mixpostTimeFilter]`
   - **Fires multiple times when filter changes**

2. **Line 285** - `fetchSuccess()`
   - Endpoint: `/api/analytics/success?days=${days}`
   - Dependencies: `[authLoading, user, selectedFilter]`
   - **Fires 3x when selectedFilter changes!**

3. **Line 314** - `fetchAdvanced()`
   - Dependencies: `[authLoading, user]`
   - Currently empty but still executes

4. **Line 326** - Campaign metrics calculation
   - Dependencies: `[campaigns]`
   - Derives from useCampaigns (already TanStack Query ✅)

5. **Line 364** - `fetchPosts()`
   - Query: `content.select('*').eq('user_id', orgId)`
   - Dependencies: `[orgLoading, orgId]`
   - **Duplicates with other content queries**

6. **Line 389** - `fetchCallPrice()`
   - Query: `call_logs.select('price').eq('user_id', orgId)`
   - Dependencies: `[orgLoading, orgId]`

7. **Line 413** - `fetchStats()`
   - Endpoint: `/api/analytics/dashboard-stats`
   - Dependencies: `[authLoading, user, organization]`
   - **Fires 3x - depends on 3 reactive values!**

8. **Line 470** - `fetchGAVisitors()`
   - Endpoint: `/api/analytics/visitors?days=${days}`
   - Dependencies: `[authLoading, user?.id, gaVisitorsFilter]`
   - **Fires 2x when filter changes**

9. **Line 515** - `fetchSchedule()`
   - Dependencies: `[orgLoading, orgId]`

10. **Image modal keyboard handler** (line 352)
    - Not a data fetch, but still a useEffect

## 📊 Duplicate Queries Detected

From the screenshot:

| Endpoint | Count | Why Duplicate? |
|----------|-------|----------------|
| `social-stats` | 2x | fetchMixpostAnalytics refiring |
| `success?days=30` | 3x | ❌ **fetchSuccess depends on authLoading + user + selectedFilter** |
| `dashboard-stats` | 3x | ❌ **fetchStats depends on authLoading + user + organization** |
| `visitors?days=7` | 2x | fetchGAVisitors refiring |
| `content?select=*&user_id=eq...` | 2x | fetchPosts + other components |
| `call_logs?select=price&user_id...` | 2x | fetchCallPrice refiring |
| `posts` (xhr) | 2x | Unknown source - maybe MonitoringContext? |

## 🎯 Root Causes

### 1. Reactive Dependencies Cause Cascading Re-renders

```js
// ❌ BAD - fires 3 times on mount!
useEffect(() => {
  fetchStats()
}, [authLoading, user, organization])
// 1st render: authLoading = true
// 2nd render: authLoading = false (refetch!)
// 3rd render: organization changes (refetch!)
```

### 2. Filter Changes Trigger Full Refetches

```js
// ❌ BAD - every filter change = new fetch
useEffect(() => {
  fetchSuccess()
}, [authLoading, user, selectedFilter])
// Changing filter -> refetch
```

### 3. No Caching or Deduplication

- Each useEffect independently fetches data
- No shared cache between components
- Same data fetched multiple times

## ✅ Solution: Migrate to TanStack Query

### Step 1: Create Dashboard Queries

**File: `src/hooks/queries/useDashboardData.js`**

```js
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { useOrgId } from './useOrgId'

// Success stats - with filter parameter
export function useSuccessStats(days = 30) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['successStats', days], // Filter in key!
    queryFn: async () => {
      const session = await supabase.auth.getSession()
      const token = session?.data?.session?.access_token
      if (!token) return null

      const res = await fetch(`/api/analytics/success?days=${days}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      return res.json()
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

// Dashboard stats - shared
export function useDashboardStats() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['dashboardStats', user?.id],
    queryFn: async () => {
      const session = await supabase.auth.getSession()
      const token = session?.data?.session?.access_token
      if (!token) return null

      const res = await fetch('/api/analytics/dashboard-stats', {
        headers: { Authorization: `Bearer ${token}` }
      })
      return res.json()
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

// GA Visitors - with filter parameter
export function useGAVisitors(days = 7) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['gaVisitors', days],
    queryFn: async () => {
      const session = await supabase.auth.getSession()
      const token = session?.data?.session?.access_token
      if (!token) return null

      const res = await fetch(`/api/analytics/visitors?days=${days}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      return res.json()
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  })
}

// Call logs price - for current month
export function useCallPrice() {
  const { orgId, isLoading: orgLoading } = useOrgId()

  return useQuery({
    queryKey: ['callPrice', orgId],
    queryFn: async () => {
      if (!orgId) return 0

      const now = new Date()
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)

      const { data, error } = await supabase
        .from('call_logs')
        .select('price')
        .eq('user_id', orgId)
        .gte('created_at', firstDay.toISOString())
        .lte('created_at', lastDay.toISOString())

      if (error || !data) return 0
      return data.reduce((acc, row) => acc + (parseFloat(row.price) || 0), 0)
    },
    enabled: !!orgId && !orgLoading,
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}

// Dashboard posts
export function useDashboardPosts() {
  const { orgId, isLoading: orgLoading } = useOrgId()

  return useQuery({
    queryKey: ['dashboardPosts', orgId],
    queryFn: async () => {
      if (!orgId) return []

      const { data, error } = await supabase
        .from('content')
        .select('*')
        .eq('user_id', orgId)
        .order('publish_date', { ascending: false })

      if (error) throw error
      return data || []
    },
    enabled: !!orgId && !orgLoading,
    staleTime: 1000 * 60 * 5,
    placeholderData: [],
  })
}

// Mixpost analytics
export function useMixpostAnalytics(timeFilter = 'all') {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['mixpostAnalytics', timeFilter],
    queryFn: async () => {
      const session = await supabase.auth.getSession()
      const token = session?.data?.session?.access_token
      if (!token) return null

      const now = new Date()
      let fromDate = null
      let toDate = now.toISOString().split('T')[0]

      if (timeFilter === 'week') {
        fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          .toISOString().split('T')[0]
      } else if (timeFilter === 'month') {
        fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          .toISOString().split('T')[0]
      }

      const url = `/api/analytics/social-stats${fromDate ? `?from=${fromDate}&to=${toDate}` : ''}`
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      })
      return res.json()
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  })
}
```

### Step 2: Replace useEffect Hooks

**Before:**
```js
const [successStats, setSuccessStats] = useState({})

useEffect(() => {
  const fetchSuccess = async () => {
    // ... 20 lines of fetch code
  }
  fetchSuccess()
}, [authLoading, user, selectedFilter]) // ❌ Fires 3x
```

**After:**
```js
const days = selectedFilter === 'week' ? 7 : 30
const { data: successStats = {}, isLoading } = useSuccessStats(days)
```

### Step 3: Benefits

✅ **One query per filter value** - cached!
✅ **No cascade re-renders** - TanStack Query handles dependencies
✅ **Shared cache** - same filter = same cached data
✅ **Automatic refetch** - when data is stale
✅ **Background updates** - doesn't block UI

## 📈 Expected Improvements

### Before

- **Initial Load**: ~20 queries (including duplicates)
- **Filter Change**: ~3 new queries
- **Window Refocus**: ~10 queries
- **Cache**: None (0%)

### After

- **Initial Load**: ~10 queries (no duplicates)
- **Filter Change**: 1-2 queries (only changed filters)
- **Window Refocus**: 0 queries (cache!)
- **Cache**: 100% (5 min)

**Total reduction: 50%+ fewer API calls!**

## 🚀 Migration Priority

**High Priority (Most Duplicates):**
1. ✅ `fetchStats()` - fires 3x → `useDashboardStats()`
2. ✅ `fetchSuccess()` - fires 3x → `useSuccessStats(days)`
3. ✅ `fetchGAVisitors()` - fires 2x → `useGAVisitors(days)`
4. ✅ `fetchMixpostAnalytics()` - fires 2x → `useMixpostAnalytics(timeFilter)`

**Medium Priority:**
5. ✅ `fetchPosts()` → `useDashboardPosts()`
6. ✅ `fetchCallPrice()` → `useCallPrice()`

**Already Using TanStack Query:**
- ✅ `useCampaigns()` - good!
- ✅ `useSocialAccounts()` - good!
- ✅ `useOrgId()` - good!

## 📝 Next Steps

1. Create `src/hooks/queries/useDashboardData.js` with all queries
2. Replace useEffect hooks one by one
3. Test that filters still work correctly
4. Verify in Network tab: duplicates eliminated
5. (Optional) Remove unused state variables (loading, error, etc.)

This will reduce DashboardPage from **~20 API calls** to **~10 calls** with full caching!
