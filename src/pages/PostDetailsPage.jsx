import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'

export default function PostDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await axios.get('https://samikiias.app.n8n.cloud/webhook/get-rascalai-posts123890')
        const found = Array.isArray(response.data) ? response.data.find(p => p.id === id) : null
        setPost(found)
      } catch (err) {
        setError('Virhe haettaessa postauksen tietoja')
      } finally {
        setLoading(false)
      }
    }
    fetchPost()
  }, [id])

  if (loading) return <p>Ladataan...</p>
  if (error) return <p className="text-red-500">{error}</p>
  if (!post) return <p>Postausta ei löytynyt.</p>

  return (
    <div className="p-8">
      <button onClick={() => navigate(-1)} className="bg-transparent border-none text-blue-600 cursor-pointer text-base mb-6">
        ← Takaisin
      </button>

      <div className="bg-white rounded-xl p-6 shadow-md">
        <h1 className="m-0 mb-4 text-2xl font-bold">
          {post.Idea || post.title || 'Ei otsikkoa'}
        </h1>

        <div className="mb-4">
          <strong>Julkaisupäivä:</strong> {post["Publish Date"] ? new Date(post["Publish Date"]).toLocaleDateString('fi-FI') : 'Ei määritelty'}
        </div>

        <div className="mb-4">
          <strong>Kuvaus:</strong>
          <p className="mt-2 mb-0 leading-relaxed">
            {post.Caption || post.desc || 'Ei kuvausta'}
          </p>
        </div>

        {post.Media && post.Media.length > 0 && (
          <div className="mb-4">
            <strong>Media:</strong>
            <div className="mt-2">
              {post.Media.map((media, index) => (
                <div key={index} className="mb-2">
                  {media.type && media.type.startsWith('image/') ? (
                    <img src={media.url} alt="media" className="max-w-full rounded-lg" />
                  ) : media.type && media.type.startsWith('video/') ? (
                    <video controls className="max-w-full rounded-lg">
                      <source src={media.url} type={media.type} />
                      Selaimesi ei tue videon toistoa.
                    </video>
                  ) : (
                    <a href={media.url} target="_blank" rel="noopener noreferrer" className="text-blue-600">
                      Avaa media
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      </div>
  )
} 