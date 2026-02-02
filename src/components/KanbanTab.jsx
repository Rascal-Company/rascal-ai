import React, { useState } from "react";
import PostCard from "./PostCard/PostCard";

const columns = [
  { status: "Avatar", titleKey: "posts.columns.avatar", color: "#fef3c7" },
  {
    status: "KeskenSupabase",
    titleKey: "posts.columns.inProgress",
    color: "#fef3c7",
  },
  {
    status: "Tarkistuksessa",
    titleKey: "posts.columns.readyToPublish",
    color: "#dbeafe",
  },
  {
    status: "Aikataulutettu",
    titleKey: "posts.columns.scheduled",
    color: "#fce7f3",
  },
];

const publishedColumn = {
  status: "Julkaistu",
  titleKey: "posts.statuses.published",
  color: "#dcfce7",
};

export default function KanbanTab({
  posts = [],
  onEdit,
  onDelete,
  onDuplicate,
  onPublish,
  onSchedule,
  onMoveToNext,
  t,
  onDeleteMixpostPost,
  onRefreshPosts,
}) {
  const [draggedPost, setDraggedPost] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);

  const handleDragStart = (e, post) => {
    setDraggedPost(post);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", e.target.outerHTML);
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

    // Tallenna draggedPost ennen kuin se nollataan handleDragEnd:issä
    const postToMove = draggedPost;

    if (!postToMove) return;

    // Jos status on sama, ei tehdä mitään
    if (postToMove.status === targetStatus) return;

    // Jos raahataan Mixpost-postausta pois Aikataulutettu-sarakkeesta
    if (
      postToMove.source === "mixpost" &&
      postToMove.status === "Aikataulutettu"
    ) {
      try {
        const postUuidToDelete = postToMove.uuid || postToMove.id;

        if (onDeleteMixpostPost) {
          await onDeleteMixpostPost(postUuidToDelete);
        }

        if (onRefreshPosts) {
          await onRefreshPosts();
        }
      } catch (error) {
        console.error("❌ Error in handleDrop:", error);
      }
      return;
    }

    // Varmistetaan että kyseessä on Supabase-postaus muille siirroille
    if (postToMove.source !== "supabase") {
      return;
    }

    // Kutsutaan handleMoveToNext funktiota Supabase-postauksille
    if (onMoveToNext) {
      await onMoveToNext(postToMove, targetStatus);
    }
  };

  return (
    <div className="kanban-board">
      {/* Ylemmät 4 saraketta */}
      <div className="kanban-top-row">
        {columns.map((column) => {
          // Filteröidään postit statusin JA lähteen mukaan
          let columnPosts = posts.filter((post) => {
            // Kesken-sarakkeessa näytetään vain Supabase-dataa "Kesken" statusilla
            if (column.titleKey === "posts.columns.inProgress") {
              return post.status === "Kesken" && post.source === "supabase";
            }

            // Aikataulutettu-sarakkeessa näytetään Mixpost dataa
            if (column.status === "Aikataulutettu") {
              return (
                post.status === "Aikataulutettu" && post.source === "mixpost"
              );
            }
            // Julkaistu-sarakkeessa näytetään sekä Supabase että Mixpost dataa
            if (column.status === "Julkaistu") {
              return post.status === "Julkaistu";
            }
            // Muissa sarakkeissa näytetään Supabase-data oikealla statusilla
            return post.status === column.status && post.source === "supabase";
          });

          return (
            <div
              key={column.status}
              className={`kanban-column ${dragOverColumn === column.status ? "drag-over" : ""}`}
              onDragOver={(e) => handleDragOver(e, column.status)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column.status)}
            >
              <h3 className="column-title">{t(column.titleKey)}</h3>
              <div className="column-content">
                {column.titleKey === "posts.columns.avatar" ? (
                  <div
                    style={{
                      padding: "32px",
                      textAlign: "center",
                      background:
                        "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
                      borderRadius: "12px",
                      border: "2px dashed #cbd5e1",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    {/* Dekoratiivinen gradient */}
                    <div
                      style={{
                        position: "absolute",
                        top: "-50%",
                        right: "-50%",
                        width: "200%",
                        height: "200%",
                        background:
                          "radial-gradient(circle, rgba(16, 185, 129, 0.05) 0%, transparent 70%)",
                        pointerEvents: "none",
                      }}
                    />

                    {/* Sisältö */}
                    <div style={{ position: "relative", zIndex: 1 }}>
                      <svg
                        width="48"
                        height="48"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="2"
                        style={{ margin: "0 auto 16px", display: "block" }}
                      >
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      <div
                        style={{
                          color: "#334155",
                          fontSize: "16px",
                          fontWeight: 600,
                          marginBottom: "8px",
                        }}
                      >
                        Tulossa uusi versio
                      </div>
                      <div
                        style={{
                          color: "#64748b",
                          fontSize: "13px",
                          lineHeight: "1.5",
                        }}
                      >
                        Työskentelemme parhaillaan uuden
                        <br />
                        avatar-toiminnallisuuden parissa
                      </div>
                    </div>
                  </div>
                ) : columnPosts.length === 0 ? null : (
                  columnPosts.map((post) => {
                    // Varmistetaan että post on oikeassa muodossa
                    const safePost = {
                      id: post.id || "unknown",
                      title: post.title || t("posts.statuses.untitled"),
                      caption: post.caption || t("posts.placeholders.noImage"),
                      type: post.type || "Photo",
                      source: post.source || "supabase",
                      thumbnail: post.thumbnail || null,
                      status: post.status || "Kesken",
                      voiceover: post.voiceover || "",
                      segments: post.segments || [],
                      originalData: post.originalData || {},
                      createdAt: post.createdAt,
                      scheduledDate: post.scheduledDate,
                      publishedAt: post.publishedAt,
                    };

                    return (
                      <PostCard
                        key={safePost.id}
                        post={safePost}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onDuplicate={onDuplicate}
                        onPublish={onPublish}
                        onSchedule={onSchedule}
                        onMoveToNext={onMoveToNext}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                        isDragging={draggedPost?.id === safePost.id}
                        hideActions={column.status === "Aikataulutettu"}
                        t={t}
                      />
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Julkaistu-sarakkeessa kaikkien 4 sarakkeen levyinen */}
      <div className="kanban-bottom-row">
        {(() => {
          // Haetaan vain Supabase julkaistut postaukset
          const supabasePublishedPosts = posts.filter(
            (post) =>
              post.status === publishedColumn.status &&
              post.source === "supabase",
          );

          return (
            <div className="kanban-column kanban-column-full-width">
              <h3 className="column-title">{t(publishedColumn.titleKey)}</h3>
              <div className="column-content">
                {supabasePublishedPosts.map((post) => {
                  const safePost = {
                    id: post.id || "unknown",
                    title: post.title || t("posts.statuses.untitled"),
                    caption: post.caption || t("posts.placeholders.noImage"),
                    type: post.type || "Photo",
                    source: post.source || "supabase",
                    thumbnail: post.thumbnail || null,
                    status: post.status || "Julkaistu",
                    published_at: post.publishedAt,
                    external_urls: [],
                    segments: post.segments || [],
                    originalData: post.originalData || {},
                    createdAt: post.createdAt,
                    scheduledDate: post.scheduledDate,
                    publishedAt: post.publishedAt,
                  };

                  return (
                    <PostCard
                      key={safePost.id}
                      post={safePost}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onDuplicate={onDuplicate}
                      onPublish={onPublish}
                      onSchedule={onSchedule}
                      onMoveToNext={onMoveToNext}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                      isDragging={draggedPost?.id === safePost.id}
                      t={t}
                    />
                  );
                })}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
