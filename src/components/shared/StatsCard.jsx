import React from 'react'

export default function StatsCard({ title, value, icon, description }) {
  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-medium text-gray-500">{title}</div>
        <div className="text-xl">{icon}</div>
      </div>
      <div className="text-2xl font-bold">{value}</div>
      {description && (
        <div className="text-xs text-gray-500 mt-1">{description}</div>
      )}
    </div>
  )
}


