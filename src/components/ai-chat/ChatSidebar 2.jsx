import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

export function ChatSidebar({
  isOpen,
  onClose,
  activeTab,
  onTabChange,
  // Threads props
  threads,
  threadsLoading,
  currentThreadId,
  onLoadThread,
  onCreateThread,
  onDeleteThread,
  onUpdateThreadTitle,
  // Files props
  files,
  filesLoading,
  filesError,
  pendingFiles,
  uploadLoading,
  uploadError,
  uploadSuccess,
  dragActive,
  onDragOver,
  onDragLeave,
  onDrop,
  onFileInput,
  onRemovePending,
  onUploadPending,
  onDeleteFile,
  organizationRole,
}) {
  const { t } = useTranslation("common");
  const dropRef = useRef(null);
  const [editingThreadId, setEditingThreadId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");

  const startEditing = (thread) => {
    setEditingThreadId(thread.id);
    setEditingTitle(thread.title);
  };

  const cancelEditing = () => {
    setEditingThreadId(null);
    setEditingTitle("");
  };

  const saveTitle = (threadId) => {
    if (editingTitle.trim()) {
      onUpdateThreadTitle(threadId, editingTitle.trim());
      setEditingThreadId(null);
      setEditingTitle("");
    }
  };

  const canUpload =
    organizationRole === "owner" || organizationRole === "admin";

  return (
    <div
      className={`w-80 bg-white flex flex-col relative z-50 border-r border-gray-200 transition-transform duration-300 ease-out lg:translate-x-0 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } lg:relative fixed left-0 top-0 h-screen lg:h-auto lg:z-auto z-[100] shadow-lg lg:shadow-none`}
    >
      {/* Header */}
      <div className="flex items-center justify-between py-4 px-5 gap-3 border-b border-gray-200">
        <div className="flex gap-2 flex-1">
          <button
            className={`flex-1 py-2 px-4 bg-transparent border-none rounded-lg text-sm font-medium cursor-pointer transition-all duration-200 ${
              activeTab === "threads"
                ? "text-white bg-primary-500"
                : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
            }`}
            onClick={() => onTabChange("threads")}
          >
            {t("assistant.threads.title")}
          </button>
          <button
            className={`flex-1 py-2 px-4 bg-transparent border-none rounded-lg text-sm font-medium cursor-pointer transition-all duration-200 ${
              activeTab === "database"
                ? "text-white bg-primary-500"
                : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
            }`}
            onClick={() => onTabChange("database")}
          >
            {t("assistant.threads.database")}
          </button>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden flex items-center justify-center w-9 h-9 rounded-xl text-xl text-gray-400 cursor-pointer p-2 shrink-0 transition-all duration-300 bg-gray-100 border border-gray-200 hover:rotate-90 hover:bg-primary-500/10 hover:text-primary-500 hover:border-primary-500/30"
        >
          ✕
        </button>
      </div>

      {/* Threads Tab */}
      {activeTab === "threads" && (
        <div className="flex-1 flex flex-col p-4 overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-500 m-0 uppercase tracking-wide">
              {t("assistant.threads.count", { count: threads.length })}
            </h3>
            <button
              onClick={onCreateThread}
              className="text-white border-none rounded-md py-1.5 px-3 text-xl font-light leading-none cursor-pointer transition-colors duration-200 bg-primary-500 hover:bg-primary-600"
              title={t("assistant.threads.newThread")}
            >
              +
            </button>
          </div>

          <div className="flex-1 overflow-y-auto flex flex-col gap-1.5">
            {threadsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
              </div>
            ) : threads.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">
                {t("assistant.threads.empty")}
              </p>
            ) : (
              threads.map((thread) => (
                <ThreadItem
                  key={thread.id}
                  thread={thread}
                  isActive={currentThreadId === thread.id}
                  isEditing={editingThreadId === thread.id}
                  editingTitle={editingTitle}
                  onEditingTitleChange={setEditingTitle}
                  onLoad={() =>
                    editingThreadId !== thread.id && onLoadThread(thread.id)
                  }
                  onStartEdit={() => startEditing(thread)}
                  onSaveEdit={() => saveTitle(thread.id)}
                  onCancelEdit={cancelEditing}
                  onDelete={() => onDeleteThread(thread.id)}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* Database Tab */}
      {activeTab === "database" && (
        <>
          {/* Upload Zone - only for owner/admin */}
          {canUpload && (
            <div className="p-4 border-b border-gray-200">
              <div
                ref={dropRef}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() =>
                  dropRef.current?.querySelector("input[type=file]")?.click()
                }
                className={`rounded-xl p-6 text-center cursor-pointer transition-all duration-200 border-2 border-dashed ${
                  dragActive
                    ? "border-primary-500 bg-primary-50"
                    : "border-gray-300 bg-gray-50 hover:border-primary-500 hover:bg-primary-50"
                }`}
              >
                <span className="text-5xl block mb-2 font-light text-gray-400">
                  ↑
                </span>
                <p className="text-sm text-gray-500 m-0">
                  {t("assistant.files.uploadCard.dragText")}{" "}
                  <span className="font-semibold text-primary-500">
                    {t("assistant.files.uploadCard.chooseFiles")}
                  </span>
                </p>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.txt,.md,.rtf,image/*,.mp3"
                  className="hidden"
                  onChange={onFileInput}
                />
              </div>

              {/* Pending Files */}
              {pendingFiles.length > 0 && (
                <div className="mt-3 flex flex-col gap-2">
                  {pendingFiles.map((f) => (
                    <div
                      key={f.name + f.size}
                      className="flex items-center justify-between py-2 px-3 rounded-lg gap-2 bg-gray-100"
                    >
                      <span className="flex-1 text-[13px] overflow-hidden text-ellipsis whitespace-nowrap text-gray-700">
                        {f.name}
                      </span>
                      <button
                        onClick={() => onRemovePending(f.name, f.size)}
                        className="text-white border-none rounded w-6 h-6 flex items-center justify-center cursor-pointer text-sm shrink-0 transition-colors duration-200 bg-red-500 hover:bg-red-600"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={onUploadPending}
                    disabled={uploadLoading}
                    className="w-full py-2.5 text-white border-none rounded-lg font-semibold cursor-pointer text-sm transition-all duration-200 bg-primary-500 hover:enabled:bg-primary-600 hover:enabled:-translate-y-px disabled:cursor-not-allowed disabled:bg-gray-400"
                  >
                    {uploadLoading
                      ? t("assistant.files.uploadCard.uploading")
                      : t("assistant.files.uploadCard.uploadBtn", {
                          count: pendingFiles.length,
                        })}
                  </button>
                </div>
              )}

              {uploadError && (
                <p className="text-xs mt-2 mb-0 p-2 rounded-md text-red-600 bg-red-50">
                  {uploadError}
                </p>
              )}
              {uploadSuccess && (
                <p className="text-xs mt-2 mb-0 p-2 rounded-md text-green-600 bg-green-50">
                  {uploadSuccess}
                </p>
              )}
            </div>
          )}

          {/* Member info */}
          {organizationRole === "member" && (
            <div className="p-4 rounded-lg mx-4 mb-4 bg-amber-50 border border-amber-200">
              <p className="text-sm m-0 leading-snug text-amber-800">
                {t("assistant.files.uploadCard.memberInfo")}
              </p>
            </div>
          )}

          {/* Files List */}
          <div className="flex-1 flex flex-col p-4 overflow-hidden">
            <h3 className="text-sm font-semibold text-gray-500 m-0 mb-3 uppercase tracking-wide">
              {t("assistant.files.list.title")} ({files.length})
            </h3>
            <div className="flex-1 overflow-y-auto flex flex-col gap-1.5">
              {filesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
                </div>
              ) : filesError ? (
                <p className="text-sm text-red-500 text-center py-4">
                  {filesError}
                </p>
              ) : files.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">
                  {t("assistant.files.list.empty")}
                </p>
              ) : (
                files.map((file) => (
                  <div
                    key={file.file_name}
                    className="flex items-center gap-2 p-2.5 rounded-lg transition-colors duration-200 bg-gray-50 hover:bg-gray-100 group"
                  >
                    <span className="text-xl shrink-0 text-gray-500 font-bold">
                      •
                    </span>
                    <span className="flex-1 text-[13px] overflow-hidden text-ellipsis whitespace-nowrap text-gray-700">
                      {file.file_name || file.filename}
                    </span>
                    {canUpload && (
                      <button
                        onClick={() => onDeleteFile(file.id)}
                        className="border-none rounded-md text-base cursor-pointer py-1.5 px-2.5 opacity-0 group-hover:opacity-100 shrink-0 flex items-center justify-center min-w-7 min-h-7 text-black transition-all duration-200 bg-red-500/10 hover:bg-red-500/20 hover:scale-110"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ThreadItem({
  thread,
  isActive,
  isEditing,
  editingTitle,
  onEditingTitleChange,
  onLoad,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
}) {
  const { t } = useTranslation("common");

  return (
    <div
      className={`flex items-center justify-between gap-2 p-3 rounded-xl cursor-pointer border transition-all duration-300 ${
        isEditing
          ? "cursor-default bg-white border-gray-200"
          : isActive
            ? "bg-gradient-to-br from-primary-500/10 to-primary-600/10 border-primary-500/30 shadow-lg shadow-primary-500/20"
            : "bg-gray-100/50 border-transparent hover:translate-x-1 hover:bg-gray-100 hover:shadow-md hover:shadow-primary-500/10"
      }`}
      onClick={onLoad}
    >
      <div className="flex-1 flex flex-col gap-1 min-w-0">
        {isEditing ? (
          <input
            type="text"
            value={editingTitle}
            onChange={(e) => onEditingTitleChange(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSaveEdit();
              else if (e.key === "Escape") onCancelEdit();
            }}
            className="w-full py-1 px-2 rounded-md text-sm font-medium bg-white outline-none transition-colors duration-200 border-2 border-primary-500 text-gray-800 focus:border-primary-600"
            autoFocus
          />
        ) : (
          <span className="text-sm font-medium overflow-hidden text-ellipsis whitespace-nowrap text-gray-800">
            {thread.title}
          </span>
        )}
        <span className="text-xs text-gray-400">
          {new Date(thread.updated_at).toLocaleDateString("fi-FI")}
        </span>
      </div>

      <div className="flex gap-1 items-center shrink-0">
        {isEditing ? (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSaveEdit();
              }}
              className="bg-transparent border-none text-base text-gray-400 cursor-pointer py-1.5 px-2 shrink-0 rounded-lg transition-all duration-300 hover:bg-green-50 hover:text-green-600"
              title={t("chat.buttons.save")}
            >
              ✓
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCancelEdit();
              }}
              className="bg-transparent border-none text-base text-gray-400 cursor-pointer py-1.5 px-2 shrink-0 rounded-lg transition-all duration-300 hover:bg-red-50 hover:text-red-600"
              title={t("chat.buttons.cancel")}
            >
              ✕
            </button>
          </>
        ) : (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStartEdit();
              }}
              className="bg-transparent border-none text-base text-gray-400 cursor-pointer py-1.5 px-2 shrink-0 rounded-lg transition-all duration-300 hover:bg-gray-200 hover:text-gray-500"
              title={t("accessibility.editName")}
            >
              ✎
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="bg-transparent border-none text-base text-gray-400 cursor-pointer py-1.5 px-2 shrink-0 rounded-lg transition-all duration-300 hover:scale-110 hover:bg-gradient-to-br hover:from-red-500/10 hover:to-red-600/10 hover:text-red-600"
              title={t("chat.buttons.deleteChat")}
            >
              ✕
            </button>
          </>
        )}
      </div>
    </div>
  );
}
