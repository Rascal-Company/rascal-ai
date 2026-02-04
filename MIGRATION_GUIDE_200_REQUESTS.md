# Migration Guide: Fix 200+ Requests on Page Load

## Problem Summary

ManagePostsPage is making **10-13 Supabase queries** on every page load, with **duplicate queries** across hooks:

### Current Queries (BEFORE)

1. **useMonthlyLimit** (always active):
   - `users.subscription_status` query
   - `content_strategy` query
   - `content` count query (filtered by strategy_id)

2. **useNextMonthQuota** (always active):
   - `users.subscription_status` query (**DUPLICATE!**)
   - `content_strategy` query (**DUPLICATE!**)
   - `content` count query (filtered by strategy_id)

3. **usePosts** (TanStack Query):
   - `content` table (posts)
   - Reels API
   - Mixpost API
   - `user_social_accounts`

4. **UgcTab** (when active):
   - `content` table (UGC type)

5. **CarouselsTab** (when active):
   - `content` table (Carousel type)
   - `segments` table

**Total: 10-13 queries, with 2 queries duplicated!**

## Solution

Migrate all hooks to **TanStack Query** with **shared caching** to eliminate duplicates.

### New Query Architecture (AFTER)

```
Shared Queries (cached):
├─ subscriptionStatus (users.subscription_status) ← shared by 2 hooks
├─ userStrategies (content_strategy)             ← shared by 2 hooks
├─ posts (content table)                         ← existing
├─ reels (reels API)                             ← existing
├─ mixpost (mixpost API)                         ← existing
└─ socialAccounts (user_social_accounts)         ← existing

Hook-Specific Queries:
├─ monthlyContentCount (for useMonthlyLimit)
├─ nextMonthContentCount (for useNextMonthQuota)
├─ ugcPosts (for UgcTab)
└─ carouselPosts (for CarouselsTab)
```

**Total: 10 queries, 0 duplicates, all cached for 5-10 minutes**

## Migration Steps

### Step 1: Update Hook Imports

**File: `src/pages/ManagePostsPage.jsx`**

```diff
- import { useMonthlyLimit } from "../hooks/useMonthlyLimit";
- import { useNextMonthQuota } from "../hooks/useNextMonthQuota";
+ import { useMonthlyLimit } from "../hooks/useMonthlyLimit.v2";
+ import { useNextMonthQuota } from "../hooks/useNextMonthQuota.v2";
```

### Step 2: Update UgcTab Component

**File: `src/components/UgcTab.jsx`**

Add import at the top:
```js
import { useUgcPosts } from '../hooks/queries/useTabsData'
```

Replace the `useEffect` fetch (lines 111-115):
```diff
- const [ugcPosts, setUgcPosts] = useState([])
- const [ugcLoading, setUgcLoading] = useState(false)
-
- const fetchUgcPosts = async () => { ... }
-
- useEffect(() => {
-   if (user) {
-     fetchUgcPosts()
-   }
- }, [user])
+ const { data: ugcPosts = [], isLoading: ugcLoading } = useUgcPosts()
```

### Step 3: Update CarouselsTab Component

**File: `src/components/CarouselsTab.jsx`**

Add import at the top:
```js
import { useCarouselPosts } from '../hooks/queries/useTabsData'
```

Replace the data fetching (lines 103-150):
```diff
- const [carouselsData, setCarouselsData] = useState([])
-
- useEffect(() => {
-   const fetchData = async () => { ... }
-   fetchData()
- }, [user])
+ const { data: carouselsData = [] } = useCarouselPosts()
```

### Step 4: Rename Hook Files (Production Ready)

After testing the `.v2` versions:

```bash
# Backup old versions
mv src/hooks/useMonthlyLimit.js src/hooks/useMonthlyLimit.old.js
mv src/hooks/useNextMonthQuota.js src/hooks/useNextMonthQuota.old.js

# Replace with new versions
mv src/hooks/useMonthlyLimit.v2.js src/hooks/useMonthlyLimit.js
mv src/hooks/useNextMonthQuota.v2.js src/hooks/useNextMonthQuota.js

# Update imports in ManagePostsPage.jsx back to original
```

## Expected Performance Improvements

### Before Migration

| Source | Queries | Cache | On Mount | On Refocus |
|--------|---------|-------|----------|------------|
| useMonthlyLimit | 3 | ❌ | 3 | N/A |
| useNextMonthQuota | 3 | ❌ | 3 | N/A |
| usePosts | 4 | ✅ 2min | 4 | 4 |
| UgcTab (active) | 1 | ❌ | 1 | N/A |
| CarouselsTab (active) | 2 | ❌ | 2 | N/A |
| **TOTAL** | **13** | | **13** | **4** |

### After Migration

| Source | Queries | Cache | On Mount | On Refocus |
|--------|---------|-------|----------|------------|
| Shared: subscription | 1 | ✅ 10min | 1 | 0 |
| Shared: strategies | 1 | ✅ 5min | 1 | 0 |
| useMonthlyLimit | 1 | ✅ 2min | 1 | 0 |
| useNextMonthQuota | 1 | ✅ 5min | 1 | 0 |
| usePosts | 4 | ✅ 5min | 4 | 0 |
| UgcTab (active) | 1 | ✅ 5min | 1 | 0 |
| CarouselsTab (active) | 1 | ✅ 5min | 1 | 0 |
| **TOTAL** | **10** | | **10** | **0** |

### Improvements

✅ **23% fewer queries** (13 → 10)
✅ **100% cached** (0% → 100%)
✅ **Zero duplicate queries** (2 duplicates eliminated)
✅ **Zero refocus refetches** (4 → 0)
✅ **Faster page loads** (parallel cached queries)
✅ **Lower server load** (fewer database hits)

## Testing Checklist

After migration, verify:

- [ ] Monthly limit counter displays correctly
- [ ] Next month quota displays correctly
- [ ] UGC tab loads posts (if UGC feature enabled)
- [ ] Carousels tab loads carousel posts with segments
- [ ] Network tab shows **10 queries** on initial load (not 13)
- [ ] Network tab shows **0 queries** when switching tabs (uses cache)
- [ ] Network tab shows **0 queries** when refocusing window
- [ ] Quota counters update after creating new content

## Rollback Plan

If issues arise, simply revert the imports:

```js
// Rollback: use .old.js versions
import { useMonthlyLimit } from "../hooks/useMonthlyLimit.old";
import { useNextMonthQuota } from "../hooks/useNextMonthQuota.old";
```

And remove the TanStack Query hooks from tabs.

## Notes

- All new hooks use the same TanStack Query configuration as existing `usePosts`
- `staleTime` is set appropriately per data type:
  - Subscription: 10 minutes (rarely changes)
  - Strategies: 5 minutes (moderate changes)
  - Content counts: 2-5 minutes (frequent changes)
- All queries use `placeholderData` to prevent loading flickers
- All queries are properly scoped to `orgId` for multi-tenant support
