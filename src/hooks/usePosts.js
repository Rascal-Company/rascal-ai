import { usePostsQuery } from "./queries/usePosts";

export function usePosts(user, t) {
  return usePostsQuery(user, t);
}
