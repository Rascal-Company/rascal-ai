import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'

export default function TestTokenPage() {
  const { t } = useTranslation('common')
  const [token, setToken] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function getToken() {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          setError(sessionError.message)
          return
        }

        if (!session?.access_token) {
          setError('Ei aktiivista sessiota. Kirjaudu ensin sisään.')
          return
        }

        setToken(session.access_token)
      } catch (err) {
        setError(err.message)
      }
    }

    getToken()
  }, [])

  const copyToClipboard = () => {
    if (token) {
      navigator.clipboard.writeText(token)
      alert(t('alerts.success.tokenCopied'))
    }
  }

  return (
    <div className="p-8 max-w-[800px] mx-auto">
      <h1>Test Token Page</h1>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded mb-4">
          <strong>Virhe:</strong> {error}
        </div>
      )}

      {token ? (
        <div>
          <h2>Token löytyi!</h2>
          <button
            onClick={copyToClipboard}
            className="py-2 px-4 bg-blue-600 text-white border-none rounded cursor-pointer mb-4"
          >
            Kopioi token
          </button>

          <div className="bg-gray-100 p-4 rounded break-all text-xs font-mono">
            {token}
          </div>

          <div className="mt-8">
            <h3>Curl-kutsu:</h3>
            <pre className="bg-gray-100 p-4 rounded overflow-auto">
{`# HUOM: /api/test/* on poistettu käytöstä (api/_test ei reitity Vercelissä)
# Käytä oikeaa endpointia tai aja dev/testit paikallisesti.
#
# Esimerkki (korvaa oikealla endpointilla):
# curl -X POST http://localhost:3000/api/<endpoint> \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${token.substring(0, 50)}..." \\
  -d '{
    "data": {
      "test": "value"
    }
  }'`}
            </pre>
          </div>
        </div>
      ) : (
        <div>
          <p>Ladataan tokenia...</p>
        </div>
      )}
    </div>
  )
}
