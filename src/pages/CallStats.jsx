import React, { useState } from 'react'

const STATUS_COLORS = {
  odottaa: '#a0aec0', // harmaa
  soittaa: '#2563eb', // sininen
  valmis: '#22c55e', // vihreä
}

function StatusBadge({ tila }) {
  const color = STATUS_COLORS[tila] || '#a0aec0'
  return (
    <span style={{
      display: 'inline-block',
      minWidth: 12,
      height: 12,
      borderRadius: 8,
      background: color,
      marginRight: 8,
      verticalAlign: 'middle',
      boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
    }} />
  )
}

function InfoIconWithTooltip() {
  const [show, setShow] = useState(false)
  return (
    <span style={{position: 'relative', display: 'inline-block', marginLeft: 6}}>
      <span
        style={{
          display: 'inline-block',
          width: 16,
          height: 16,
          borderRadius: '50%',
          background: '#e1e8ed',
          color: '#2563eb',
          fontWeight: 700,
          fontSize: 13,
          textAlign: 'center',
          lineHeight: '16px',
          cursor: 'pointer',
          border: '1.5px solid #cfd8dc',
        }}
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
      >i</span>
      {show && (
        <span style={{
          position: 'absolute',
          left: '110%',
          top: '50%',
          transform: 'translateY(-50%)',
          background: '#fff',
          color: '#222',
          border: '1.5px solid #e1e8ed',
          borderRadius: 8,
          padding: '8px 14px',
          fontSize: 14,
          fontWeight: 400,
          whiteSpace: 'nowrap',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          zIndex: 10,
        }}>
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
          <div className="call-stat-value" style={{ color: '#22c55e' }}>
            {stats.calledCount}
          </div>
        </div>
        
        <div className="call-stat-card">
          <div className="call-stat-title">Epäonnistui</div>
          <div className="call-stat-value" style={{ color: '#ef4444' }}>
            {stats.failedCount}
          </div>
        </div>
        
        <div className="call-stat-card">
          <div className="call-stat-title">Jäljellä</div>
          <div className="call-stat-value" style={{ color: '#2563eb' }}>
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
      
      <div style={{ marginTop: 16, padding: '12px', background: '#f0f9ff', borderRadius: 8, fontSize: 14, color: '#0369a1' }}>
        <strong>Huomio:</strong> Soittojen laskutus perustuu onnistuneisiin puheluihin.
        <InfoIconWithTooltip />
      </div>
    </div>
  )
} 