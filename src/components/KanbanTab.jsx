import React, { useState, useMemo } from "react";
import PostCard from "./PostCard/PostCard";

const tabs = [
  {
    status: "Kesken",
    source: "supabase",
    titleKey: "posts.columns.inProgress",
    color: "bg-blue-400",
  },
  {
    status: "Tarkistuksessa",
    source: "supabase",
    titleKey: "posts.columns.readyToPublish",
    color: "bg-indigo-400",
  },
  {
    status: "Aikataulutettu",
    source: "mixpost",
    titleKey: "posts.columns.scheduled",
    color: "bg-pink-400",
  },
  {
    status: "Julkaistu",
    source: "supabase",
    titleKey: "posts.statuses.published",
    color: "bg-emerald-400",
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
  const [activeStatusTab, setActiveStatusTab] = useState("Kesken");
  const [viewMode, setViewMode] = useState("visual");
  const [selectedPosts, setSelectedPosts] = useState([]);
  const [filter, setFilter] = useState("");
  const [sortOrder, setSortOrder] = useState("new");

  const postsByTab = useMemo(() => {
    const result = {};
    tabs.forEach((tab) => {
      result[tab.status] = posts.filter(
        (post) => post.status === tab.status && post.source === tab.source,
      );
    });
    return result;
  }, [posts]);

  const activeTab = tabs.find((tab) => tab.status === activeStatusTab);

  const filteredPosts = useMemo(() => {
    let tabPosts = postsByTab[activeStatusTab] || [];

    if (filter) {
      tabPosts = tabPosts.filter(
        (p) =>
          (p.title || "").toLowerCase().includes(filter.toLowerCase()) ||
          (p.caption || "").toLowerCase().includes(filter.toLowerCase()),
      );
    }

    tabPosts.sort((a, b) => {
      const dateA = new Date(a.originalData?.created_at || 0);
      const dateB = new Date(b.originalData?.created_at || 0);
      return sortOrder === "new" ? dateB - dateA : dateA - dateB;
    });

    return tabPosts;
  }, [postsByTab, activeStatusTab, filter, sortOrder]);

  const handleSelect = (post) => {
    setSelectedPosts((prev) =>
      prev.find((p) => p.id === post.id)
        ? prev.filter((p) => p.id !== post.id)
        : [...prev, post],
    );
  };

  return (
    <div className="space-y-8">
      {/* Tab Navigation Bar */}
      <div className="bg-white/60 backdrop-blur-xl rounded-[32px] border border-gray-100 shadow-xl shadow-gray-200/10 p-2 sm:p-3 flex flex-row gap-2 sm:gap-6 justify-between items-center sticky top-4 z-40 transition-all hover:shadow-2xl overflow-hidden">
        <div className="flex p-1 sm:p-1.5 bg-gray-50/80 rounded-[24px] overflow-x-auto no-scrollbar gap-1 border border-gray-100 flex-1 sm:flex-none">
          {tabs.map((tab) => (
            <button
              key={tab.status}
              onClick={() => {
                setActiveStatusTab(tab.status);
                setFilter("");
              }}
              className={`flex items-center justify-center gap-2 px-3 sm:px-6 py-2 sm:py-3 text-[10px] sm:text-xs font-bold rounded-[18px] transition-all duration-300 whitespace-nowrap ${
                activeStatusTab === tab.status
                  ? "bg-white text-gray-900 shadow-lg shadow-gray-200/50"
                  : "text-gray-400 hover:text-gray-900 hover:bg-white/50"
              }`}
            >
              <div
                className={`w-2.5 h-2.5 rounded-full ${tab.color} ${activeStatusTab === tab.status ? "shadow-sm" : "opacity-50"}`}
              />
              <span className="uppercase tracking-widest hidden md:inline">
                {t(tab.titleKey)}
              </span>
              <span className="text-[9px] font-black bg-gray-100/80 px-2 py-0.5 rounded-full min-w-[20px] text-center">
                {(postsByTab[tab.status] || []).length}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="flex items-center gap-1 bg-white/60 backdrop-blur-md p-1 rounded-2xl border border-gray-100 shadow-sm">
            <button
              onClick={() => setViewMode("visual")}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === "visual" ? "bg-gray-900 text-white shadow-lg" : "text-gray-400 hover:text-gray-900"}`}
            >
              Visual
            </button>
            <button
              onClick={() => setViewMode("compact")}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === "compact" ? "bg-gray-900 text-white shadow-lg" : "text-gray-400 hover:text-gray-900"}`}
            >
              Compact
            </button>
          </div>
        </div>
      </div>

      {/* Selection bar */}
      {selectedPosts.length > 0 && (
        <div className="flex items-center gap-4 px-2 animate-in slide-in-from-top-4 duration-300">
          <span className="text-xs font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-xl border border-blue-100 italic">
            {selectedPosts.length} postia valittu
          </span>
          <button
            onClick={() => setSelectedPosts([])}
            className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-red-500"
          >
            Tyhjenn&auml;
          </button>
        </div>
      )}

      {/* Filter & Sort Controls */}
      <div className="flex items-center gap-3 px-2">
        <div className="relative flex-1 max-w-sm group">
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Hae..."
            className="w-full pl-9 pr-3 py-2.5 bg-white/60 backdrop-blur-md border border-gray-100 rounded-2xl text-xs font-bold outline-none focus:bg-white focus:border-blue-500/20 focus:shadow-lg transition-all"
          />
          <svg
            className="absolute left-3 top-3 w-3.5 h-3.5 text-gray-300 group-focus-within:text-blue-500"
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
          onClick={() =>
            setSortOrder((prev) => (prev === "new" ? "old" : "new"))
          }
          className={`p-2.5 rounded-2xl border transition-all ${sortOrder === "new" ? "bg-blue-50 border-blue-100 text-blue-600" : "bg-white border-gray-100 text-gray-400"}`}
          title={sortOrder === "new" ? "Uusin ensin" : "Vanhin ensin"}
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
        <span className="text-[10px] font-black text-gray-400 bg-gray-100/50 px-3 py-2 rounded-xl border border-gray-100/50 min-w-[32px] text-center">
          {filteredPosts.length}
        </span>
      </div>

      {/* Tab Content - Card Grid */}
      {filteredPosts.length === 0 ? (
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 px-2">
          {filteredPosts.map((post) => (
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
                t={t}
                compact={viewMode === "compact"}
                isSelected={selectedPosts.some((p) => p.id === post.id)}
                onSelect={handleSelect}
                hideActions={activeTab?.status === "Aikataulutettu"}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
