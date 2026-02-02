import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import Button from './Button'

const TarkistuksessaModal = ({
  show,
  editingPost,
  onClose,
  onPublish
}) => {
  const { t, i18n } = useTranslation('common')
  if (!show || !editingPost) return null

  const isOverLimit = (editingPost.caption?.length || 0) > 2000

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 text-left">
      <div
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl shadow-blue-500/10 border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-6 border-b border-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{t('posts.reviewModal.title')}</h2>
              <p className="text-xs text-gray-400 font-medium">{t('posts.reviewModal.subtitle')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-50 rounded-lg text-gray-400 hover:text-gray-900 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">{t('posts.reviewModal.createdLabel')}</label>
              <div className="px-4 py-3 bg-gray-50/50 rounded-2xl border border-gray-100 text-xs font-medium text-gray-600">
                {editingPost.created_at ? new Date(editingPost.created_at).toLocaleString(i18n.language === 'en' ? 'en-US' : 'fi-FI', {
                  year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                }) : t('posts.placeholders.unknown')}
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">{t('posts.reviewModal.typeLabel')}</label>
              <div className="px-4 py-3 bg-gray-50/50 rounded-2xl border border-gray-100 text-xs font-bold text-gray-900">
                {editingPost.type || 'Photo'}
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">{t('posts.reviewModal.titleLabel')}</label>
            <div className="px-4 py-3 bg-gray-50/50 rounded-2xl border border-gray-100 text-sm font-bold text-gray-900">
              {editingPost.title || t('posts.statuses.untitled')}
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center px-1">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{t('posts.reviewModal.captionLabel')}</label>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isOverLimit ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-400'}`}>
                {editingPost.caption?.length || 0} / 2000
              </span>
            </div>
            <div className={`px-5 py-4 bg-gray-50/50 rounded-2xl border text-sm font-medium text-gray-700 leading-relaxed ${isOverLimit ? 'border-red-100 ring-2 ring-red-50' : 'border-gray-100'}`}>
              {editingPost.caption || t('posts.placeholders.noDescription')}
            </div>
            {isOverLimit && (
              <p className="text-red-500 text-[10px] font-bold mt-1 px-1">
                {t('posts.publishModal.captionTooLong')}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">{t('posts.reviewModal.statusLabel')}</label>
            <div className="flex">
              <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-blue-100">
                {editingPost.status}
              </span>
            </div>
          </div>
        </div>

        <div className="p-6 bg-gray-50/50 border-t border-gray-100 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-2xl text-sm font-bold text-gray-500 hover:text-gray-900 hover:bg-white transition-all"
          >
            {t('posts.reviewModal.close')}
          </button>
          <button
            onClick={onPublish}
            disabled={isOverLimit}
            className="px-8 py-3 bg-gray-900 hover:bg-black text-white rounded-2xl font-bold text-sm shadow-xl shadow-gray-200 transition-all disabled:opacity-50 disabled:bg-gray-400 flex items-center justify-center gap-2"
          >
            {t('posts.reviewModal.publishNow')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default TarkistuksessaModal
