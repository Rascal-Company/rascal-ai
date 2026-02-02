import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { fetchCampaignStats } from '../../services/campaignsApi'

export default function CampaignStats({ campaignId }) {
  const { t, i18n } = useTranslation('common')
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const callLogs = await fetchCampaignStats(campaignId)
        const daily = (callLogs || []).reduce((acc, call) => {
          const date = new Date(call.call_date).toLocaleDateString(i18n.language === 'fi' ? 'fi-FI' : 'en-US')
          if (!acc[date]) acc[date] = { date, calls: 0, answered: 0 }
          acc[date].calls += 1
          if (call.answered) acc[date].answered += 1
          return acc
        }, {})
        const chart = Object.values(daily).map(day => ({
          ...day,
          answerRate: day.calls > 0 ? Math.round((day.answered / day.calls) * 100) : 0
        }))
        if (mounted) setData(chart)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    if (campaignId) load()
    return () => { mounted = false }
  }, [campaignId])

  if (loading) {
    return <div className="h-64 flex items-center justify-center">{t('campaigns.details.loading')}</div>
  }

  return (
    <div className="grid gap-6">
      <div className="h-64">
        <h3 className="text-base font-semibold mb-3">{t('campaigns.charts.dailyCalls')}</h3>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="calls" stroke="#8884d8" name={t('campaigns.charts.seriesCalls')} />
            <Line type="monotone" dataKey="answered" stroke="#82ca9d" name={t('campaigns.charts.seriesAnswered')} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="h-64">
        <h3 className="text-base font-semibold mb-3">{t('campaigns.charts.dailyAnswerRate')}</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip formatter={(value) => [`${value}%`, t('campaigns.charts.tooltipAnswer')]} />
            <Bar dataKey="answerRate" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}


