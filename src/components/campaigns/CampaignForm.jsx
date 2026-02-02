import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Button from '../Button'
import { createCampaignApi } from '../../services/campaignsApi'

export default function CampaignForm({ userId, onSuccess, onCancel }) {
  const { t } = useTranslation('common')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'active'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const payload = { ...formData, user_id: userId }
      const created = await createCampaignApi(payload)
      if (onSuccess) {
        onSuccess(created)
      } else {
        window.location.href = '/campaigns'
      }
    } catch (err) {
      setError(err.message || t('campaigns.form.saveError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      {error && (
        <div className="p-3 border border-red-200 bg-red-50 text-red-800 rounded-lg">{error}</div>
      )}

      <div>
        <label htmlFor="name" className="block font-semibold mb-1.5">{t('campaigns.form.nameLabel')}</label>
        <input id="name" type="text" required value={formData.name} onChange={(e) => handleChange('name', e.target.value)} placeholder={t('campaigns.form.namePlaceholder')} className="w-full p-2.5 rounded-md border border-gray-200" />
      </div>

      <div>
        <label htmlFor="description" className="block font-semibold mb-1.5">{t('campaigns.form.descriptionLabel')}</label>
        <textarea id="description" rows={4} value={formData.description} onChange={(e) => handleChange('description', e.target.value)} placeholder={t('campaigns.form.descriptionPlaceholder')} className="w-full p-2.5 rounded-md border border-gray-200" />
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>{loading ? t('campaigns.form.submitting') : t('campaigns.form.submit')}</Button>
        <Button type="button" variant="secondary" onClick={() => (onCancel ? onCancel() : (window.location.href = '/campaigns'))}>{t('campaigns.form.cancel')}</Button>
      </div>
    </form>
  )
}


