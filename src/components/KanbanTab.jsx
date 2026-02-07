import React, { useState, useEffect, useMemo } from "react";
import PostCard from "./PostCard/PostCard";

const columns = [
  { status: "Avatar", titleKey: "posts.columns.avatar", color: "bg-amber-400" },
  {
    status: "KeskenSupabase",
    titleKey: "posts.columns.inProgress",
    color: "bg-blue-400",
  },
  {
    status: "Tarkistuksessa",
    titleKey: "posts.columns.readyToPublish",
    color: "bg-indigo-400",
  },
  {
    status: "Aikataulutettu",
    titleKey: "posts.columns.scheduled",
    color: "bg-pink-400",
  },
];

export default function KanbanTab({
  posts = [],
  onEdit,
  onDelete,
  onDuplicate,
  onPublish,
  onSchedule,
  onMoveToNext,
  onPreview,
  t,
  onDeleteMixpostPost,
  onRefreshPosts,
}) {
  const [draggedPost, setDraggedPost] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);

  // Advanced State for Professional UX
  const [collapsedColumns, setCollapsedColumns] = useState({});
  const [columnFilters, setColumnFilters] = useState({});
  const [sortOrders, setSortOrders] = useState({}); // column -> 'new' | 'old'
  const [viewMode, setViewMode] = useState("visual"); // 'visual' | 'compact'
  const [selectedPosts, setSelectedPosts] = useState([]);

  // Calculate which columns have data
  const columnPostCounts = useMemo(() => {
    const counts = {};
    columns.forEach((column) => {
      let columnPosts = posts.filter((post) => {
        if (column.titleKey === "posts.columns.inProgress")
          return post.status === "Kesken" && post.source === "supabase";
        if (column.status === "Aikataulutettu")
          return post.status === "Aikataulutettu" && post.source === "mixpost";
        if (column.status === "Avatar")
          return post.status === "Avatar" && post.source === "supabase";
        return post.status === column.status && post.source === "supabase";
      });
      counts[column.status] = columnPosts.length;
    });
    return counts;
  }, [posts]);

  // Auto-collapse empty columns on mount and when data changes
  useEffect(() => {
    // Only run auto-collapse if we have posts data loaded
    if (posts.length === 0) return;

    const newCollapsedState = {};
    columns.forEach((column) => {
      // Only auto-collapse if user hasn't manually interacted with this column
      if (collapsedColumns[column.status] === undefined) {
        newCollapsedState[column.status] =
          columnPostCounts[column.status] === 0;
      }
    });
    if (Object.keys(newCollapsedState).length > 0) {
      setCollapsedColumns((prev) => ({ ...prev, ...newCollapsedState }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columnPostCounts, posts.length]);

  const toggleCollapse = (status) => {
    setCollapsedColumns((prev) => ({ ...prev, [status]: !prev[status] }));
  };

  const updateFilter = (status, val) => {
    setColumnFilters((prev) => ({ ...prev, [status]: val }));
  };

  const toggleSort = (status) => {
    setSortOrders((prev) => ({
      ...prev,
      [status]: prev[status] === "old" ? "new" : "old",
    }));
  };

  const handleSelect = (post) => {
    setSelectedPosts((prev) =>
      prev.find((p) => p.id === post.id)
        ? prev.filter((p) => p.id !== post.id)
        : [...prev, post],
    );
  };

  const handleDragStart = (e, post) => {
    setDraggedPost(post);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    setDraggedPost(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e, columnStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverColumn(columnStatus);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (e, targetStatus) => {
    e.preventDefault();
    setDragOverColumn(null);

    const postToMove = draggedPost;
    // Clear drag state immediately so card doesn't appear grayed out
    setDraggedPost(null);

    if (!postToMove) return;
    if (postToMove.status === targetStatus) return;

    if (
      postToMove.source === "mixpost" &&
      postToMove.status === "Aikataulutettu"
    ) {
      try {
        const postUuidToDelete = postToMove.uuid || postToMove.id;
        if (onDeleteMixpostPost) await onDeleteMixpostPost(postUuidToDelete);
        if (onRefreshPosts) await onRefreshPosts();
      } catch (error) {
        console.error("❌ Error in handleDrop:", error);
      }
      return;
    }

    if (postToMove.source !== "supabase") return;

    if (onMoveToNext) {
      await onMoveToNext(postToMove, targetStatus);
      // Refresh posts after moving to update UI
      if (onRefreshPosts) await onRefreshPosts();
    }
  };

  return (
    <div className="space-y-12">
      {/* Global Kanban Controls */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-4 bg-white/60 backdrop-blur-md p-1.5 rounded-2xl border border-gray-100 shadow-sm">
          <button
            onClick={() => setViewMode("visual")}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === "visual" ? "bg-gray-900 text-white shadow-lg" : "text-gray-400 hover:text-gray-900"}`}
          >
            Visual
          </button>
          <button
            onClick={() => setViewMode("compact")}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === "compact" ? "bg-gray-900 text-white shadow-lg" : "text-gray-400 hover:text-gray-900"}`}
          >
            Compact
          </button>
        </div>

        {selectedPosts.length > 0 && (
          <div className="flex items-center gap-4 animate-in slide-in-from-top-4 duration-300">
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-xl border border-blue-100 italic">
              {selectedPosts.length} postia valittu
            </span>
            <button
              onClick={() => setSelectedPosts([])}
              className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-red-500"
            >
              Tyhjennä
            </button>
          </div>
        )}
      </div>

      {/* Kanban Board - Vertical on Mobile, Horizontal on Desktop */}
      <div className="relative">
        <div className="flex flex-col md:flex-row gap-6 lg:gap-8 md:overflow-x-auto pb-8 md:snap-x no-scrollbar lg:no-scrollbar-none md:min-h-[800px] items-start">
          {columns.map((column) => {
            const isCollapsed = collapsedColumns[column.status];
            const filter = columnFilters[column.status] || "";
            const sort = sortOrders[column.status] || "new";

            let columnPosts = posts.filter((post) => {
              if (column.titleKey === "posts.columns.inProgress")
                return post.status === "Kesken" && post.source === "supabase";
              if (column.status === "Aikataulutettu")
                return (
                  post.status === "Aikataulutettu" && post.source === "mixpost"
                );
              if (column.status === "Avatar")
                return post.status === "Avatar" && post.source === "supabase";
              return (
                post.status === column.status && post.source === "supabase"
              );
            });

            // Apply per-column filter
            if (filter) {
              columnPosts = columnPosts.filter(
                (p) =>
                  (p.title || "")
                    .toLowerCase()
                    .includes(filter.toLowerCase()) ||
                  (p.caption || "")
                    .toLowerCase()
                    .includes(filter.toLowerCase()),
              );
            }

            // Apply per-column sort
            columnPosts.sort((a, b) => {
              const dateA = new Date(a.originalData?.created_at || 0);
              const dateB = new Date(b.originalData?.created_at || 0);
              return sort === "new" ? dateB - dateA : dateA - dateB;
            });

            return (
              <div
                key={column.status}
                className={`md:flex-shrink-0 flex flex-col gap-6 p-4 rounded-[40px] transition-all duration-700 md:snap-start h-fit ${
                  isCollapsed
                    ? "w-full md:w-[100px]"
                    : "w-full md:w-[320px] lg:w-[380px]"
                } ${
                  dragOverColumn === column.status
                    ? "bg-blue-50/40 ring-2 ring-blue-500/20 shadow-[0_32px_64px_-16px_rgba(59,130,246,0.15)] scale-[1.01]"
                    : "bg-gray-50/30 border border-transparent"
                }`}
                onDragOver={(e) => handleDragOver(e, column.status)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, column.status)}
              >
                {/* Column Header */}
                <div
                  className={`sticky top-0 z-20 flex flex-col gap-3 p-3 bg-white/80 backdrop-blur-xl rounded-[28px] border border-white/60 shadow-lg shadow-gray-200/10 transition-all ${isCollapsed ? "items-center py-6" : ""}`}
                >
                  <div
                    className={`flex items-center ${isCollapsed ? "flex-col gap-4" : "justify-between w-full"}`}
                  >
                    <div
                      className={`flex items-center gap-3 ${isCollapsed ? "flex-col" : ""}`}
                    >
                      <div
                        className={`w-3 h-3 rounded-full shadow-lg ${column.color}`}
                      />
                      {!isCollapsed && (
                        <h3 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.2em] leading-none">
                          {t(column.titleKey)}
                        </h3>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => toggleCollapse(column.status)}
                        className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-gray-900"
                      >
                        {isCollapsed ? (
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2.5"
                              d="M13 5l7 7-7 7M5 5l7 7-7 7"
                            />
                          </svg>
                        ) : (
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2.5"
                              d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                            />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {!isCollapsed && (
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1 group">
                        <input
                          type="text"
                          value={filter}
                          onChange={(e) =>
                            updateFilter(column.status, e.target.value)
                          }
                          placeholder="Hae..."
                          className="w-full pl-8 pr-3 py-2 bg-gray-50/50 border border-transparent rounded-xl text-[10px] font-bold outline-none focus:bg-white focus:border-blue-500/20 transition-all"
                        />
                        <svg
                          className="absolute left-2.5 top-2.5 w-3 h-3 text-gray-300 group-focus-within:text-blue-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                          />
                        </svg>
                      </div>
                      <button
                        onClick={() => toggleSort(column.status)}
                        className={`p-2 rounded-xl border transition-all ${sort === "new" ? "bg-blue-50 border-blue-100 text-blue-600" : "bg-white border-gray-100 text-gray-400"}`}
                        title={sort === "new" ? "Uusin ensin" : "Vanhin ensin"}
                      >
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
                          />
                        </svg>
                      </button>
                      <span className="text-[10px] font-black text-gray-400 bg-gray-100/50 px-2.5 py-1.5 rounded-xl border border-gray-100/50 min-w-[32px] text-center">
                        {columnPosts.length}
                      </span>
                    </div>
                  )}
                </div>

                {/* Column Content */}
                {!isCollapsed && (
                  <div className="flex-1 space-y-5 px-1 pb-4 overflow-y-auto max-h-[800px] lg:max-h-[calc(100vh-300px)] custom-scrollbar pr-2">
                    {column.status === "Avatar" ? (
                      <div className="p-10 text-center bg-white/40 backdrop-blur-xl rounded-[32px] border-2 border-dashed border-gray-100 relative overflow-hidden group hover:border-amber-400/50 transition-all duration-700">
                        <div className="relative z-10">
                          <div className="w-16 h-16 bg-white rounded-[24px] shadow-2xl shadow-gray-200/50 flex items-center justify-center mx-auto mb-6 group-hover:rotate-12 transition-transform duration-500">
                            <svg
                              className="w-8 h-8 text-amber-500"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                              />
                            </svg>
                          </div>
                          <div className="text-gray-900 text-[10px] font-black uppercase tracking-widest mb-3">
                            AI Avatars
                          </div>
                          <div className="text-gray-400 text-[10px] font-bold leading-relaxed uppercase tracking-tighter opacity-60">
                            Ready to enhance your
                            <br />
                            content flow
                          </div>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-50/0 via-amber-50/50 to-amber-100/30 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                      </div>
                    ) : columnPosts.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-24 px-8 text-center bg-white/10 border-2 border-dashed border-gray-100/50 rounded-[32px] transition-all duration-500 hover:bg-white/20">
                        <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-4 text-gray-100">
                          <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M12 4v16m8-8H4"
                            />
                          </svg>
                        </div>
                        <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
                          No Content
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-4">
                        {columnPosts.map((post) => (
                          <div
                            key={post.id || Math.random()}
                            className="animate-in fade-in slide-in-from-bottom-2 duration-500"
                          >
                            <PostCard
                              post={post}
                              onEdit={onEdit}
                              onDelete={onDelete}
                              onDuplicate={onDuplicate}
                              onPublish={onPublish}
                              onSchedule={onSchedule}
                              onMoveToNext={onMoveToNext}
                              onPreview={onPreview}
                              onDragStart={handleDragStart}
                              onDragEnd={handleDragEnd}
                              isDragging={draggedPost?.id === post.id}
                              hideActions={column.status === "Aikataulutettu"}
                              t={t}
                              compact={viewMode === "compact"}
                              isSelected={selectedPosts.some(
                                (p) => p.id === post.id,
                              )}
                              onSelect={handleSelect}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Scroll Indicator Gradient - Bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-gray-50 via-gray-50/80 to-transparent pointer-events-none z-10" />
      </div>

      {/* Published Section */}
      <div className="space-y-10 group pb-20">
        <div className="flex items-center justify-between px-2 lg:px-6">
          <div className="flex items-center gap-4">
            <div className="w-4 h-4 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)] animate-pulse" />
            <div className="space-y-1">
              <h3 className="text-lg font-black text-gray-900 tracking-tight uppercase leading-none">
                {t("posts.statuses.published")}
              </h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest italic">
                Live Content History
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-2xl border border-emerald-100">
            <span className="text-[11px] font-black text-emerald-600 uppercase tracking-widest">
              {
                posts.filter(
                  (p) => p.status === "Julkaistu" && p.source === "supabase",
                ).length
              }
            </span>
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-tight">
              Posts
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-2">
          {posts
            .filter((p) => p.status === "Julkaistu" && p.source === "supabase")
            .map((post) => (
              <div
                key={post.id}
                className="animate-in fade-in zoom-in-95 duration-700"
              >
                <PostCard
                  post={post}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onDuplicate={onDuplicate}
                  onPublish={onPublish}
                  onSchedule={onSchedule}
                  onMoveToNext={onMoveToNext}
                  onPreview={onPreview}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  isDragging={draggedPost?.id === post.id}
                  t={t}
                />
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
