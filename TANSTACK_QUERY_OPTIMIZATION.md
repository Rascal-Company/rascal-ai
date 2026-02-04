# TanStack Query Optimization - ManagePostsPage

## Problem
ManagePostsPage was making excessive Mixpost API calls (fetching 157 posts across 8 pages multiple times), causing performance issues.

## Root Causes

### 1. Missing orgId in Mixpost Query Key
**Before:**
```js
queryKey: ['mixpost'],  // ❌ Cache shared across all users!
```

**After:**
```js
queryKey: ['mixpost', orgId],  // ✅ User-specific cache
```

**Impact:** Without orgId, the cache was shared across all users, causing:
- Cache invalidation when switching users
- Unnecessary refetches
- Potential data leakage between users

### 2. Duplicate Manual Fetching
**Before:**
```js
useEffect(() => {
  if (!user || hasInitialized.current) return;
  hasInitialized.current = true;

  // ❌ Manual fetch duplicates TanStack Query's automatic fetch
  Promise.all([
    fetchPosts(),
    fetchReelsPosts(),
    fetchSocialAccounts(),
    fetchMixpostPosts(),
  ]).catch(console.error);
}, [user, fetchPosts, fetchReelsPosts, ...]);
```

**After:**
```js
// ✅ TanStack Query handles all data fetching automatically - no manual fetching needed
```

**Impact:** TanStack Query already fetches data automatically when:
- Component mounts (if no cached data or data is stale)
- Queries are enabled
- Window regains focus (now disabled)

The manual `Promise.all()` was causing duplicate fetches.

### 3. Aggressive Refetch Settings
**Before:**
```js
staleTime: 1000 * 60 * 2,  // 2 minutes
// refetchOnWindowFocus: true (default)
```

**After:**
```js
staleTime: 1000 * 60 * 5,  // 5 minutes
refetchOnWindowFocus: false,  // Don't refetch on window focus
```

**Impact:**
- Mixpost data doesn't change frequently, so longer cache is appropriate
- Window focus refetches were causing unnecessary API calls (especially expensive for paginated Mixpost data)
- 157 posts fetched every time window regains focus = wasteful

## Changes Made

### src/hooks/queries/usePosts.js

1. **Fixed Mixpost query key:**
   - Added `orgId` to prevent cross-user cache pollution
   - Lines 255, 317

2. **Optimized cache settings for all queries:**
   - Increased `staleTime` from 2 to 5 minutes
   - Disabled `refetchOnWindowFocus` for expensive queries
   - Lines 228-229, 249-250, 258-259

### src/pages/ManagePostsPage.jsx

1. **Removed duplicate fetch useEffect:**
   - Removed lines 287-307 (manual Promise.all fetch)
   - Removed `hasInitialized` ref (line 253)
   - TanStack Query handles initial fetch automatically

## Expected Performance Improvements

### Before:
- Initial page load: **4 API calls** (posts, reels, mixpost, accounts)
- Manual Promise.all: **+4 duplicate calls**
- Window focus: **+4 calls** (every time window regains focus)
- **Total on initial load: ~8 API calls**
- **Mixpost: 157 posts × 8 pages × multiple times = excessive**

### After:
- Initial page load: **4 API calls** (automatic, cached for 5 minutes)
- Window focus: **0 calls** (disabled)
- Switching tabs: **0 calls** (uses cache)
- **Total on initial load: 4 API calls**
- **Mixpost: 157 posts × 8 pages × 1 time, then cached**

## TanStack Query Benefits

1. **Automatic Caching:** Data cached for 5 minutes, no refetch on remount
2. **Smart Refetching:** Only refetches when data is stale
3. **Deduplication:** Multiple components using same query = single request
4. **Background Updates:** Can update cache without blocking UI
5. **Optimistic Updates:** Already implemented with `queryClient.setQueryData()`

## Further Optimization Opportunities

### Use Mutations API
Instead of manual refetches after operations, use TanStack Query's mutation API:

```js
const createPostMutation = useMutation({
  mutationFn: (postData) => createPost(postData),
  onSuccess: () => {
    // Invalidate and refetch
    queryClient.invalidateQueries({ queryKey: ['posts', orgId] })
  }
})
```

This provides:
- Automatic loading/error states
- Better error handling
- Optimistic updates
- Retry logic

### Paginated Mixpost Query
For the expensive Mixpost API with 157 posts across 8 pages:

```js
const mixpostQuery = useInfiniteQuery({
  queryKey: ['mixpost', orgId],
  queryFn: ({ pageParam = 1 }) => fetchMixpostPage(pageParam),
  getNextPageParam: (lastPage) => lastPage.nextPage,
  staleTime: 1000 * 60 * 10, // Even longer cache
})
```

This would:
- Load pages incrementally
- Cache each page separately
- Only fetch new pages when needed

## Monitoring

To verify improvements, check browser DevTools Network tab:
- Should see **significantly fewer** `/api/integrations/mixpost/posts` calls
- No duplicate calls on initial page load
- No refetches when switching tabs or refocusing window

## References

- [TanStack Query Important Defaults](https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults)
- [Query Keys](https://tanstack.com/query/latest/docs/framework/react/guides/query-keys)
- [Window Focus Refetching](https://tanstack.com/query/latest/docs/framework/react/guides/window-focus-refetching)
