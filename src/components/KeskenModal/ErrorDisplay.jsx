import React from 'react'

const ErrorDisplay = ({ error }) => {
  if (!error) return null

  return (
    <div className="error-message text-red-500 mb-4 py-3 px-4 bg-red-50 border border-red-200 rounded-lg text-sm font-medium">
      <div className="flex items-center gap-2">
        <span className="text-base">⚠️</span>
        <span>{error}</span>
      </div>
    </div>
  )
}

export default ErrorDisplay

