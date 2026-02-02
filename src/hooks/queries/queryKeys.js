export const queryKeys = {
  user: {
    all: ["user"],
    current: () => [...queryKeys.user.all, "current"],
    orgId: (authUserId) => [...queryKeys.user.all, "orgId", authUserId],
    onboarding: (authUserId) => [
      ...queryKeys.user.all,
      "onboarding",
      authUserId,
    ],
  },
  strategy: {
    all: ["strategy"],
    status: (userId) => [...queryKeys.strategy.all, "status", userId],
  },
  voice: {
    all: ["voice"],
    status: (companyId) => [...queryKeys.voice.all, "status", companyId],
  },
  notifications: {
    all: ["notifications"],
    list: (orgId, filters) => [
      ...queryKeys.notifications.all,
      "list",
      orgId,
      filters,
    ],
    unreadCount: (orgId) => [
      ...queryKeys.notifications.all,
      "unreadCount",
      orgId,
    ],
  },
  content: {
    all: ["content"],
    list: (orgId, filters) => [
      ...queryKeys.content.all,
      "list",
      orgId,
      filters,
    ],
    detail: (id) => [...queryKeys.content.all, "detail", id],
  },
  posts: {
    all: ["posts"],
    list: (orgId, filters) => [...queryKeys.posts.all, "list", orgId, filters],
    detail: (id) => [...queryKeys.posts.all, "detail", id],
  },
  campaigns: {
    all: ["campaigns"],
    list: (orgId) => [...queryKeys.campaigns.all, "list", orgId],
    detail: (id) => [...queryKeys.campaigns.all, "detail", id],
  },
  socialAccounts: {
    all: ["socialAccounts"],
    list: (orgId) => [...queryKeys.socialAccounts.all, "list", orgId],
  },
  monthlyLimit: {
    all: ["monthlyLimit"],
    current: (userId) => [...queryKeys.monthlyLimit.all, "current", userId],
  },
};
