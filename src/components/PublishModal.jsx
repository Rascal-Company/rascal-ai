import React, { useState } from 'react'
import { createPortal } from 'react-dom'

const PublishModal = ({
  show,
  publishingPost,
  socialAccounts,
  selectedAccounts,
  setSelectedAccounts,
  loadingAccounts,
  onClose,
  onConfirm,
  t
}) => {
  const [publishDate, setPublishDate] = useState('')

  if (!show || !publishingPost) return null

  const toggleAccount = (accountId) => {
    if (selectedAccounts.includes(accountId)) {
      setSelectedAccounts(selectedAccounts.filter(id => id !== accountId))
    } else {
      setSelectedAccounts([...selectedAccounts, accountId])
    }
  }

  const isCarousel = publishingPost.type === 'Carousel'
  const mediaUrl = publishingPost.thumbnail || (publishingPost.media_urls && publishingPost.media_urls[0])

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-white/80 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />

      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-[0_32px_96px_-16px_rgba(0,0,0,0.1)] border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">

        {/* Simple Header */}
        <div className="px-8 py-6 flex items-center justify-between border-b border-gray-50">
          <div>
            <h2 className="text-lg font-bold text-gray-900 leading-none">{t('posts.publishModal.title')}</h2>
            <p className="text-xs text-gray-400 mt-1.5">{t('posts.publishModal.contentToPublish')}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-50 rounded-full text-gray-400 hover:text-gray-900 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto flex flex-col md:flex-row">
          {/* Content Preview */}
          <div className="flex-1 p-8 bg-gray-50/30">
            <div className="max-w-[320px] mx-auto space-y-6">
              <div className="aspect-square bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                {isCarousel && publishingPost.segments?.length > 0 ? (
                  <img src={publishingPost.segments[0].media_urls?.[0]} className="w-full h-full object-cover" alt="preview" />
                ) : mediaUrl ? (
                  mediaUrl.includes('.mp4') || mediaUrl.includes('video') ? (
                    <video src={mediaUrl} className="w-full h-full object-cover" controls />
                  ) : (
                    <img src={mediaUrl} className="w-full h-full object-cover" alt="preview" />
                  )
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-300 text-xs">{t('posts.publishModal.noMedia')}</div>
                )}
              </div>
              <div className="text-sm text-gray-600 leading-relaxed max-h-40 overflow-y-auto pr-2 custom-scrollbar whitespace-pre-wrap italic">
                {publishingPost.caption || t('posts.publishModal.noCaption')}
              </div>
            </div>
          </div>

          {/* Configuration */}
          <div className="flex-1 p-8 border-l border-gray-50 space-y-10">
            {/* Account Selector */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">{t('posts.publishModal.selectChannels')}</label>
                <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">{selectedAccounts.length}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {socialAccounts?.map(account => {
                  const isSelected = selectedAccounts.includes(account.mixpost_account_uuid)
                  return (
                    <button
                      key={account.mixpost_account_uuid}
                      onClick={() => toggleAccount(account.mixpost_account_uuid)}
                      className={`flex items-center gap-3 p-3 rounded-2xl border transition-all text-left ${isSelected ? 'border-blue-500 bg-blue-50/50 shadow-sm' : 'border-gray-100 hover:border-gray-200'
                        }`}
                    >
                      <img src={account.profile_image_url} className="w-8 h-8 rounded-lg object-cover" alt="" />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-gray-900 truncate">{account.account_name}</div>
                        <div className="text-[9px] text-gray-400 uppercase tracking-tighter">{account.provider}</div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Schedule */}
            <div className="space-y-4 pt-6 border-t border-gray-50">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">{t('posts.publishModal.scheduleDate')}</label>
              <input
                type="datetime-local"
                value={publishDate}
                onChange={(e) => setPublishDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm font-medium"
              />
              {!publishDate && <p className="text-[10px] text-gray-400 italic">{t('posts.publishModal.publishImmediatelyHint')}</p>}
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="px-8 py-6 border-t border-gray-100 bg-white flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-3 text-sm font-bold text-gray-400 hover:text-gray-900 transition-colors">
            {t('posts.publishModal.cancel')}
          </button>
          <button
            onClick={() => onConfirm(publishDate)}
            disabled={selectedAccounts.length === 0 || (publishingPost.caption?.length || 0) > 2000}
            className={`px-8 py-3 rounded-2xl text-sm font-bold transition-all ${selectedAccounts.length > 0 ? 'bg-gray-900 text-white shadow-lg hover:bg-black active:scale-95' : 'bg-gray-100 text-gray-300 cursor-not-allowed'
              }`}
          >
            {publishDate ? t('posts.publishModal.schedule') : t('posts.publishModal.publishNow')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default PublishModal
