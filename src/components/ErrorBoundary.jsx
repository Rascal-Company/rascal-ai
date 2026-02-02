import React from 'react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    // Kirjaa virhe konsoliin, jotta se näkyy dev-ympäristössä
    console.error('ErrorBoundary caught an error:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6">
          <h1 className="m-0 text-xl">Jokin meni pieleen</h1>
          <p className="text-gray-500">Yritä päivittää sivu. Jos virhe toistuu, ota ruutukaappaus konsolista.</p>
          <pre className="whitespace-pre-wrap bg-gray-50 p-3 rounded-lg border border-gray-200">
            {String(this.state.error?.message || this.state.error || 'Unknown error')}
          </pre>
        </div>
      )
    }
    return this.props.children
  }
}


