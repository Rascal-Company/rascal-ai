import React, { useState } from 'react'

const STATUS_COLORS = {
  odottaa: '#a0aec0', // harmaa
  soittaa: '#2563eb', // sininen
  valmis: '#22c55e', // vihreä
}

function StatusBadge({ tila }) {
  const color = STATUS_COLORS[tila] || '#a0aec0'
  return (
    <span
      className="inline-block min-w-[12px] h-3 rounded-lg mr-2 align-middle shadow-[0_1px_4px_rgba(0,0,0,0.08)]"
      style={{ background: color }}
    />
  )
}

function InfoIconWithTooltip() {
  const [show, setShow] = useState(false)
  return (
    <span className="relative inline-block ml-1.5">
      <span
        className="inline-block w-4 h-4 rounded-full bg-gray-200 text-blue-600 font-bold text-[13px] text-center leading-4 cursor-pointer border-[1.5px] border-slate-300"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
      >i</span>
      {show && (
        <span className="absolute left-[110%] top-1/2 -translate-y-1/2 bg-white text-gray-800 border-[1.5px] border-gray-200 rounded-lg py-2 px-3.5 text-sm font-normal whitespace-nowrap shadow-[0_2px_8px_rgba(0,0,0,0.08)] z-10">
          Todellinen laskutus tarkistetaan aina kauden lopussa
        </span>
      )}
    </span>
  )
}

export default function CallStats({ status, stats, calls }) {
  return (
    <div className="call-stats">
      <h2 className="call-stats-title">
        Soittojen tila
      </h2>
      
      <div className="call-stats-grid">
        <div className="call-stat-card">
          <div className="call-stat-title">Yhteensä</div>
          <div className="call-stat-value">
            {stats.totalCount}
          </div>
        </div>
        
        <div className="call-stat-card">
          <div className="call-stat-title">Soitettu</div>
          <div className="call-stat-value text-green-500">
            {stats.calledCount}
          </div>
        </div>

        <div className="call-stat-card">
          <div className="call-stat-title">Epäonnistui</div>
          <div className="call-stat-value text-red-500">
            {stats.failedCount}
          </div>
        </div>

        <div className="call-stat-card">
          <div className="call-stat-title">Jäljellä</div>
          <div className="call-stat-value text-blue-600">
            {stats.totalCount - stats.calledCount - stats.failedCount}
          </div>
        </div>
      </div>
      
      {calls && calls.length > 0 && (
        <div className="call-stats-table">
          <div className="call-stats-table-header">
            <h3 className="call-stats-table-title">
              Yksityiskohtaiset tiedot
            </h3>
          </div>
          <div className="call-stats-table-content">
            <table>
              <thead>
                <tr>
                  <th>Tila</th>
                  <th>Nimi/Puhelin</th>
                  <th>Kesto</th>
                </tr>
              </thead>
              <tbody>
                {calls.map((call, index) => (
                  <tr key={index}>
                    <td>
                      <StatusBadge tila={call.status} />
                    </td>
                    <td>{call.name || call.phone}</td>
                    <td>{call.duration ? `${call.duration}s` : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      <div className="mt-4 p-3 bg-sky-50 rounded-lg text-sm text-sky-700">
        <strong>Huomio:</strong> Soittojen laskutus perustuu onnistuneisiin puheluihin.
        <InfoIconWithTooltip />
      </div>
    </div>
  )
} 