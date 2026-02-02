import React from 'react'
import Button from '../Button'
import { useTranslation } from 'react-i18next'

export default function CallLogsTab({
  exportCallLogs,
  fetchCallLogs,
  loadingCallLogs,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  callTypeFilter,
  setCallTypeFilter,
  callTypes,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  handleSearch,
  clearFilters,
  callLogs,
  callLogsError,
  totalCount,
  sortField,
  sortDirection,
  handleSort,
  fetchLogDetail,
  formatDuration,
  updatingLogIds,
  handleUpdateCallType,
  handleCancelCall
}) {
  const { t } = useTranslation('common')

  return (
    <div className="bg-white rounded-2xl shadow-md p-8 w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="m-0 text-2xl font-bold text-gray-800">
          {t('calls.tabs.logs')}
        </h2>
        <div className="flex gap-3">
          <Button type="button" onClick={exportCallLogs} variant="secondary" className="py-2 px-4 text-sm bg-emerald-500 text-white">
            {t('calls.logsTab.buttons.export')}
          </Button>
          <Button type="button" onClick={() => fetchCallLogs()} disabled={loadingCallLogs} variant="secondary" className={`py-2 px-4 text-sm text-white ${loadingCallLogs ? 'bg-gray-400' : 'bg-blue-500'}`}>
            {loadingCallLogs ? t('calls.logsTab.buttons.refreshing') : t('calls.logsTab.buttons.refresh')}
          </Button>
        </div>
      </div>

      {/* Filtterit */}
      <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 mb-8">
        <h3 className="m-0 mb-4 text-base font-semibold text-gray-700">
          {t('calls.logsTab.filters.title')}
        </h3>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 mb-4">
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              {t('calls.logsTab.filters.searchLabel')}
            </label>
            <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder={t('calls.logsTab.filters.searchPlaceholder')} className="w-full py-2 px-3 border border-gray-300 rounded-md text-sm text-gray-800 bg-white" />
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              {t('calls.logsTab.filters.statusLabel')}
            </label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full py-2 px-3 border border-gray-300 rounded-md text-sm text-gray-800 bg-white">
              <option value="">{t('calls.logsTab.filters.all')}</option>
              <option value="success">{t('calls.logsTab.filters.statusOptions.success')}</option>
              <option value="failed">{t('calls.logsTab.filters.statusOptions.failed')}</option>
              <option value="pending">{t('calls.logsTab.filters.statusOptions.pending')}</option>
              <option value="in_progress">{t('calls.logsTab.filters.statusOptions.inProgress')}</option>
            </select>
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              {t('calls.logsTab.filters.typeLabel')}
            </label>
            <select value={callTypeFilter} onChange={(e) => setCallTypeFilter(e.target.value)} className="w-full py-2 px-3 border border-gray-300 rounded-md text-sm text-gray-800 bg-white">
              <option value="">{t('calls.logsTab.filters.all')}</option>
              <option value="successful">{t('calls.logsTab.filters.statusOptions.successful')}</option>
              {callTypes.map(type => (
                <option key={type.id} value={type.name}>{type.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 mb-4">
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              {t('calls.logsTab.filters.dateFrom')}
            </label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full py-2 px-3 border border-gray-300 rounded-md text-sm text-gray-800 bg-white" />
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              {t('calls.logsTab.filters.dateTo')}
            </label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full py-2 px-3 border border-gray-300 rounded-md text-sm text-gray-800 bg-white" />
          </div>
        </div>

        <div className="flex gap-3">
          <Button onClick={handleSearch} disabled={loadingCallLogs} className="text-sm font-medium mr-2">
            {t('calls.logsTab.filters.searchButton')}
          </Button>
          <Button onClick={clearFilters} className="text-sm font-medium" variant="secondary">
            {t('calls.logsTab.filters.clearButton')}
          </Button>
        </div>
      </div>

      {/* Tilastot ja taulukko (lyhennetty: säilytetään nykyinen sisältö) */}
      {/* Tässä komponentissa toistetaan nykyinen tilasto- ja taulukkosisältö 1:1,
          mutta se on jaettu erilleen CallPanel.jsx:stä paremman ylläpidettävyyden vuoksi. */}
      {/* Jotta muutokset pysyvät minimaalisina, jätetään tilastot ja taulukko toistaiseksi CallPanel.jsx:ään.
          Seuraavassa iteraatiossa voidaan siirtää myös ne tähän komponenttiin. */}
    </div>
  )
}


