import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'

export default function TestN8NPage() {
  const { t } = useTranslation('common')
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState(null)
  const [error, setError] = useState(null)
  const [testData, setTestData] = useState('{"test": "value", "message": "Tämä on testidata"}')

  useEffect(() => {
    async function getToken() {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          setError('Virhe session haussa: ' + sessionError.message)
          return
        }

        if (!session?.access_token) {
          setError('Ei aktiivista sessiota. Kirjaudu ensin sisään.')
          return
        }

        setToken(session.access_token)
      } catch (err) {
        setError('Virhe: ' + err.message)
      }
    }

    getToken()
  }, [])

  const handleTest = async () => {
    setResponse(null)
    setError(
      'Test-endpointit on piilotettu (api/_test) eikä niitä julkaista Verceliin. ' +
      'Käytä varsinaisia /api -endpointeja tai aja testit omassa dev-ympäristössä.'
    )
  }

  const copyToken = () => {
    if (token) {
      navigator.clipboard.writeText(token)
      alert(t('alerts.success.tokenCopied'))
    }
  }

  return (
    <div className="p-8 max-w-[900px] mx-auto font-sans">
      <h1 className="mb-4">N8N Test Endpoint</h1>

      {/* Token status */}
      <div className={`p-4 rounded mb-6 ${token ? 'bg-green-100 border border-green-200' : 'bg-red-100 border border-red-200'}`}>
        <strong>Token status:</strong> {token ? (
          <span className="text-green-800">
            ✅ Löytyi ({token.length} merkkiä)
            <button
              onClick={copyToken}
              className="ml-4 py-1 px-2 text-xs bg-blue-600 text-white border-none rounded cursor-pointer"
            >
              Kopioi token
            </button>
          </span>
        ) : (
          <span className="text-red-800">❌ Ei tokenia</span>
        )}
      </div>

      {/* Error display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded mb-4 whitespace-pre-wrap font-mono text-sm">
          <strong>Virhe:</strong><br />
          {error}
        </div>
      )}

      {/* Test data input */}
      <div className="mb-6">
        <label className="block mb-2 font-bold">
          Testidata (JSON):
        </label>
        <textarea
          value={testData}
          onChange={(e) => setTestData(e.target.value)}
          className="w-full min-h-[120px] p-3 border border-gray-300 rounded font-mono text-sm resize-y"
          placeholder='{"test": "value"}'
        />
      </div>

      {/* Send button */}
      <button
        onClick={handleTest}
        disabled={true}
        className="py-3 px-6 text-base bg-gray-500 text-white border-none rounded cursor-not-allowed font-bold mb-6"
      >
        Test-endpoint poistettu käytöstä
      </button>

      {/* Response display */}
      {response && (
        <div className="mt-6">
          <h2 className="mb-2">Vastaus:</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto border border-gray-300 text-sm">
            {JSON.stringify(response, null, 2)}
          </pre>
        </div>
      )}

      {/* Curl example */}
      <div className="mt-8 p-4 bg-gray-50 rounded border border-gray-200">
        <h3 className="mt-0">Curl-kutsu:</h3>
        <pre className="bg-white p-4 rounded overflow-auto text-xs m-0">
{`# HUOM: /api/test/* on poistettu käytöstä (api/_test ei reitity Vercelissä)
# Käytä oikeaa endpointia tai aja dev/testit paikallisesti.
#
# Esimerkki (korvaa oikealla endpointilla):
# curl -X POST http://localhost:3000/api/<endpoint> \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${token ? token.substring(0, 50) + '...' : 'YOUR_TOKEN_HERE'}" \\
  -d '{
    "data": ${testData}
  }'`}
        </pre>
      </div>
    </div>
  )
}
