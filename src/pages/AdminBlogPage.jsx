import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import AdminTestimonialsPage from './AdminTestimonialsPage'
import { Link } from 'react-router-dom'
import ProtectedRoute from '../components/ProtectedRoute'
import PageMeta from '../components/PageMeta'
import { supabase } from '../lib/supabase'

export default function AdminBlogPage() {
  const { t } = useTranslation('common')
  const [articles, setArticles] = useState([])
  const [activeTab, setActiveTab] = useState('articles')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editingArticle, setEditingArticle] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    category: '',
    image_url: '',
    published_at: new Date().toISOString().split('T')[0],
    published: true
  })
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [tempImageFile, setTempImageFile] = useState(null) // Väliaikainen kuva

  useEffect(() => {
    fetchArticles()
  }, [])

  const fetchArticles = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Käytä Supabase clientia suoraan, kuten muutkin sivut
      const { data: articles, error } = await supabase
        .from('blog_posts')
        .select('id,title,slug,excerpt,content,category,image_url,published_at,published')
        .order('published_at', { ascending: false })

      if (error) {
        throw new Error('Virhe artikkeleiden haussa: ' + error.message)
      }
      
      console.log('Fetched articles after update:', articles)
      console.log('Article details:', articles?.map(a => ({ id: a.id, title: a.title, published: a.published })))
      setArticles(articles || [])
    } catch (err) {
      console.error('Error fetching articles:', err)
      setError('Artikkeleita ei voitu ladata. Yritä uudelleen myöhemmin.')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    // Auto-generate slug from title
    if (name === 'title') {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()
      setFormData(prev => ({ ...prev, slug }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      setUploading(true)
      
      if (editingArticle) {
        // MUOKKAUS: Tarkista että kuva on edelleen olemassa
        if (!formData.image_url && !tempImageFile?.file) {
          alert('Kuva on pakollinen! Et voi tallentaa artikkelia ilman kuvaa.')
          setUploading(false)
          return
        }

        console.log('Updating article with data:', formData)
        console.log('Published status:', formData.published, 'Type:', typeof formData.published)

        // MUOKKAUS: Käytä samaa API:ta kuin uuden artikkelin luonnissa
        const fd = new FormData()
        fd.append('action', 'update')
        fd.append('articleId', editingArticle.id)
        fd.append('title', formData.title || '')
        fd.append('slug', formData.slug || '')
        fd.append('excerpt', formData.excerpt || '')
        fd.append('content', formData.content || '')
        fd.append('category', formData.category || '')
        fd.append('published_at', formData.published_at || '')
        fd.append('published', String(formData.published ?? true))

        // Jos käyttäjä valitsi uuden kuvan, lähetetään binarynä
        if (tempImageFile?.file) {
          const originalName = tempImageFile.fileName || tempImageFile.file.name
          const sanitizedName = sanitizeFilename(originalName)
          fd.append('image', tempImageFile.file, sanitizedName)
        } else if (formData.image_url) {
          // Jos ei uutta kuvaa, lähetetään vanha image_url
          fd.append('image_url', formData.image_url)
        }

        // Lähetä backend API:n kautta proxy:nä
        const response = await fetch('/api/content/blog/article-management', {
          method: 'POST',
          body: fd
        })

        if (!response.ok) {
          throw new Error('Artikkelia ei voitu päivittää')
        }

        const result = await response.json()
        
        if (result.success) {
          alert('Artikkeli päivitetty!')
        } else {
          throw new Error(result.error || 'Tuntematon virhe')
        }
      } else {
        // UUSI ARTIKKELI: Tarkista että kuva on valittu
        if (!tempImageFile?.file) {
          alert('Kuva on pakollinen uuden artikkelin lisäämisessä!')
          setUploading(false)
          return
        }

        // UUSI ARTIKKELI: N8N webhook (kuvan lataus + luonti)
        const fd = new FormData()
        fd.append('action', 'create')
        fd.append('title', formData.title || '')
        fd.append('slug', formData.slug || '')
        fd.append('excerpt', formData.excerpt || '')
        fd.append('content', formData.content || '')
        fd.append('category', formData.category || '')
        fd.append('published_at', formData.published_at || '')
        fd.append('published', String(formData.published ?? true))

        // Jos käyttäjä valitsi kuvan, lähetetään binarynä
        if (tempImageFile?.file) {
          const originalName = tempImageFile.fileName || tempImageFile.file.name
          const sanitizedName = sanitizeFilename(originalName)
          fd.append('image', tempImageFile.file, sanitizedName)
        }

        // Lähetä backend API:n kautta proxy:nä
        const response = await fetch('/api/content/blog/article-management', {
          method: 'POST',
          body: fd
        })

        if (!response.ok) {
          throw new Error('Artikkelia ei voitu tallentaa')
        }

        const result = await response.json()
        
        if (result.success) {
          alert('Artikkeli lisätty!')
        } else {
          throw new Error(result.error || 'Tuntematon virhe')
        }
      }

      // Päivitä lista ja sulje form
      resetForm()
      setTempImageFile(null)
      await fetchArticles()
      setShowForm(false)
      
    } catch (err) {
      console.error('Virhe artikkelin tallennuksessa:', err)
      alert('Virhe: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  const handleEdit = (article) => {
    console.log('Editing article:', article)
    console.log('Article published status:', article.published)
    
    const newFormData = {
      title: article.title || '',
      slug: article.slug || '',
      excerpt: article.excerpt || '',
      content: article.content || article.mainbody || '',
      category: article.category || '',
      image_url: article.image_url || article.media_url || '',
      published_at: article.published_at ? new Date(article.published_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      published: article.published !== false
    }
    
    console.log('New form data:', newFormData)
    setEditingArticle(article)
    setFormData(newFormData)
    setShowForm(true)
  }

  const handleDelete = async (articleId) => {
    if (!confirm('Oletko varma, että haluat poistaa tämän artikkelin?')) {
      return
    }

    try {
      // Suora Supabase poisto
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', articleId)

      if (error) {
        throw new Error('Virhe artikkelin poistossa: ' + error.message)
      }

      await fetchArticles()
      alert('Artikkeli poistettu!')
    } catch (err) {
      console.error('Virhe artikkelin poistossa:', err)
      alert('Virhe: ' + err.message)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      category: '',
      image_url: '',
      published_at: new Date().toISOString().split('T')[0],
      published: true
    })
    setEditingArticle(null)
  }

  // Funktio joka muuttaa ääkköset ASCII-merkeiksi filenamessa
  const sanitizeFilename = (filename) => {
    const replacements = {
      'ä': 'a', 'ö': 'o', 'å': 'a',
      'Ä': 'A', 'Ö': 'O', 'Å': 'A',
      'é': 'e', 'è': 'e', 'ë': 'e',
      'É': 'E', 'È': 'E', 'Ë': 'E',
      'ü': 'u', 'Ü': 'U',
      'ñ': 'n', 'Ñ': 'N',
      'ç': 'c', 'Ç': 'C',
      'ß': 'ss',
      ' ': '-', '_': '-'
    }
    
    let sanitized = filename
    Object.entries(replacements).forEach(([from, to]) => {
      sanitized = sanitized.replace(new RegExp(from, 'g'), to)
    })
    
    // Poista kaikki muut erikoismerkit paitsi piste, viiva ja alaviiva
    sanitized = sanitized.replace(/[^a-zA-Z0-9.-]/g, '')
    
    // Varmista että tiedostopääte säilyy
    const lastDotIndex = filename.lastIndexOf('.')
    if (lastDotIndex !== -1) {
      const extension = filename.substring(lastDotIndex)
      const nameWithoutExtension = sanitized.substring(0, sanitized.lastIndexOf('.'))
      sanitized = nameWithoutExtension + extension
    }
    
    return sanitized
  }

  const openNewForm = () => {
    resetForm()
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    resetForm()
  }

  // Drag & Drop handlers
  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    const files = [...e.dataTransfer.files]
    if (files && files[0]) {
      uploadImage(files[0])
    }
  }

  const handleFileSelect = (e) => {
    const files = [...e.target.files]
    if (files && files[0]) {
      uploadImage(files[0])
    }
  }

  const uploadImage = async (file) => {
    // Check file type
    if (!file.type.startsWith('image/')) {
      alert('Vain kuvatiedostot ovat sallittuja')
      return
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      alert('Kuva on liian suuri. Maksimikoko on 5MB.')
      return
    }

    try {
      setUploading(true)

      // Convert file to base64 and store temporarily
      const reader = new FileReader()
      reader.onload = async () => {
        try {
          // Store the file and base64 data temporarily
          setTempImageFile({
            file: file,
            base64: reader.result,
            fileName: file.name
          })
          
          // Show preview in form
          setFormData(prev => ({
            ...prev,
            image_url: reader.result // Base64 preview
          }))

          alert('Kuva valittu! Se lähetetään kun tallennat artikkelin.')
        } catch (error) {
          console.error('Image processing error:', error)
          alert('Virhe kuvan käsittelyssä: ' + error.message)
        } finally {
          setUploading(false)
        }
      }

      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Upload error:', error)
      alert('Virhe kuvan käsittelyssä: ' + error.message)
      setUploading(false)
    }
  }

  return (
    <>
      <PageMeta title="Hallinta - RascalAI.fi" description="Hallitse artikkeleita ja testimoniaaleja" />
      
      <div className="admin-blog-page">
        <div className="layout-container">
          {/* Header */}
          <header className="admin-header">
            <div className="header-content">
              <h1 className="page-title">Hallinta</h1>
              <p className="page-description">Artikkelit ja Testimonials</p>
            </div>
            {activeTab === 'articles' && (
              <button onClick={openNewForm} className="btn btn-primary add-article-btn">+ Lisää uusi artikkeli</button>
            )}
          </header>

          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <button className={`btn ${activeTab === 'articles' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('articles')}>Artikkelit</button>
            <button className={`btn ${activeTab === 'testimonials' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('testimonials')}>Testimonials</button>
          </div>

          {/* Form Modal */}
          {showForm && (
            <div className="form-modal-overlay" onClick={closeForm}>
              <div className="form-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h2>{editingArticle ? 'Muokkaa artikkelia' : 'Lisää uusi artikkeli'}</h2>
                  <button onClick={closeForm} className="close-btn">×</button>
                </div>
                
                <form onSubmit={handleSubmit} className="article-form">
                  {!editingArticle ? (
                    <>
                      <div className="form-row">
                        <div className="form-group">
                          <label htmlFor="title">Otsikko *</label>
                          <input
                            type="text"
                            id="title"
                            name="title"
                            value={formData.title}
                            onChange={handleInputChange}
                            required
                            placeholder="Artikkelin otsikko"
                          />
                        </div>
                        
                        <div className="form-group">
                          <label htmlFor="slug">URL-slug *</label>
                          <input
                            type="text"
                            id="slug"
                            name="slug"
                            value={formData.slug}
                            onChange={handleInputChange}
                            required
                            placeholder="artikkelin-url-slug"
                          />
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label htmlFor="category">Kategoria</label>
                          <input
                            type="text"
                            id="category"
                            name="category"
                            value={formData.category}
                            onChange={handleInputChange}
                            placeholder="esim. Myynti, Markkinointi"
                          />
                        </div>
                        
                        <div className="form-group">
                          <label htmlFor="published_at">Julkaisupäivä *</label>
                          <input
                            type="date"
                            id="published_at"
                            name="published_at"
                            value={formData.published_at}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="form-group">
                      <h3>Artikkelin tiedot</h3>
                      <div className="article-preview">
                        <h4>{editingArticle.title}</h4>
                        <p><strong>Slug:</strong> /{editingArticle.slug}</p>
                        <p><strong>Kategoria:</strong> {editingArticle.category || 'Ei kategoriaa'}</p>
                        <p><strong>Julkaisupäivä:</strong> {editingArticle.published_at ? new Date(editingArticle.published_at).toLocaleDateString('fi-FI') : 'Ei päivää'}</p>
                      </div>
                    </div>
                  )}

                  <div className="form-group">
                    <label htmlFor="published">Julkaisustatus</label>
                    <div className="radio-group">
                      <label className="radio-label">
                        <input
                          type="radio"
                          name="published"
                          value="true"
                          checked={formData.published === true}
                          onChange={(e) => {
                            console.log('Setting published to true')
                            setFormData(prev => ({ ...prev, published: true }))
                          }}
                        />
                        <span className="radio-text">Julkaistu (näkyy julkisesti)</span>
                      </label>
                      <label className="radio-label">
                        <input
                          type="radio"
                          name="published"
                          value="false"
                          checked={formData.published === false}
                          onChange={(e) => {
                            console.log('Setting published to false')
                            setFormData(prev => ({ ...prev, published: false }))
                          }}
                        />
                        <span className="radio-text">Luonnos (ei näy julkisesti)</span>
                      </label>
                    </div>
                    <small className="form-help">
                      Julkaistut artikkelit näkyvät blogi-sivulla, luonnokset vain hallintapaneelissa
                    </small>
                  </div>

                  {!editingArticle && (
                    <>
                      <div className="form-group">
                        <label>Artikkelin kuva *</label>
                        
                        {/* Drag & Drop Area */}
                        <div 
                          className={`image-upload-area ${dragActive ? 'drag-active' : ''} ${uploading ? 'uploading' : ''} ${!formData.image_url && !tempImageFile ? 'required-field' : ''}`}
                          onDragEnter={handleDrag}
                          onDragLeave={handleDrag}
                          onDragOver={handleDrag}
                          onDrop={handleDrop}
                        >
                          {uploading ? (
                            <div className="upload-progress">
                              <div className="upload-spinner"></div>
                              <p>Ladataan kuvaa...</p>
                            </div>
                          ) : formData.image_url ? (
                            <div className="uploaded-image">
                              <img src={formData.image_url} alt="Ladattu kuva" />
                              <div className="image-actions">
                                <button 
                                  type="button" 
                                  onClick={() => {
                                    if (confirm('Oletko varma, että haluat poistaa kuvan? Kuva on pakollinen artikkelin tallentamiseen!')) {
                                      setFormData(prev => ({ ...prev, image_url: '' }))
                                      setTempImageFile(null)
                                    }
                                  }}
                                  className="btn btn-small btn-danger"
                                >
                                  Poista kuva
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="upload-placeholder">
                              <div className="upload-icon">📷</div>
                              <h3>Raahaa kuva tähän tai klikkaa valitaksesi</h3>
                              <p className="required-text">⚠️ Kuva on pakollinen uuden artikkelin lisäämisessä!</p>
                              <p>Tuetut formaatit: JPG, PNG, GIF (max 5MB)</p>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileSelect}
                                className="file-input"
                              />
                            </div>
                          )}
                        </div>
                        
                        {/* Manual URL input as fallback */}
                        <details className="manual-url-section">
                          <summary>Tai syötä kuvan URL manuaalisesti</summary>
                          <input
                            type="url"
                            id="image_url"
                            name="image_url"
                            value={formData.image_url}
                            onChange={handleInputChange}
                            placeholder="https://your-project.supabase.co/storage/v1/object/public/blog-covers/kuva.jpg"
                            className="manual-url-input"
                          />
                        </details>
                        
                        <small className="form-help">
                          <strong>Kuva on pakollinen!</strong> Kuvat ladataan automaattisesti Supabase Storage:en blog-covers bucketiin
                        </small>
                      </div>

                      <div className="form-group">
                        <label htmlFor="excerpt">Lyhyt kuvaus</label>
                        <textarea
                          id="excerpt"
                          name="excerpt"
                          value={formData.excerpt}
                          onChange={handleInputChange}
                          rows="3"
                          placeholder="Lyhyt kuvaus artikkelista (näkyy listauksessa)"
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="content">Sisältö (Markdown-muodossa) *</label>
                        <textarea
                          id="content"
                          name="content"
                          value={formData.content}
                          onChange={handleInputChange}
                          rows="15"
                          required
                          placeholder="Artikkelin sisältö Markdown-muodossa..."
                        />
                        <small className="form-help">
                          Käytä Markdown-syntaksia: **lihavointi**, *kursiivi*, ## otsikko, - lista, [linkki](url)
                        </small>
                      </div>
                    </>
                  )}

                  <div className="form-actions">
                    <button type="button" onClick={closeForm} className="btn btn-secondary">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                    <button type="submit" className="btn btn-primary">
                      {editingArticle ? 'Päivitä artikkeli' : 'Lisää artikkeli'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'articles' ? (
            <main className="admin-main">
              {loading ? (
                <div className="loading-container">
                  <div className="loading-spinner"></div>
                  <p>Ladataan artikkeleita...</p>
                </div>
              ) : (
                <div className="articles-list">
                  <h2>Artikkelit ({articles.length})</h2>
                  {articles.length === 0 ? (
                    <div className="no-articles">
                      <p>Ei artikkeleita vielä. Lisää ensimmäinen artikkeli yllä olevalla painikkeella.</p>
                    </div>
                  ) : (
                    <div className="articles-table">
                      <div className="table-header">
                        <div className="header-cell">Otsikko</div>
                        <div className="header-cell">Kategoria</div>
                        <div className="header-cell">Julkaistu</div>
                        <div className="header-cell">Status</div>
                        <div className="header-cell">Toiminnot</div>
                      </div>
                      {articles.map((article) => (
                        <div key={article.id} className="table-row">
                          <div className="cell title-cell">
                            <div className="article-info">
                              <h3>{article.title || 'Ei otsikkoa'}</h3>
                              <p className="article-slug">/{article.slug || 'ei-slugia'}</p>
                            </div>
                          </div>
                          <div className="cell category-cell">{article.category || '-'}</div>
                          <div className="cell date-cell">{article.published_at ? new Date(article.published_at).toLocaleDateString('fi-FI') : 'Ei päivää'}</div>
                          <div className="cell status-cell">
                            <span className={`status-badge ${article.published ? 'published' : 'draft'}`}>{article.published ? t('status.published') : t('status.draft')}</span>
                          </div>
                          <div className="cell actions-cell">
                            <button onClick={() => handleEdit(article)} className="btn btn-small btn-secondary">Muokkaa</button>
                            <button onClick={() => handleDelete(article.id)} className="btn btn-small btn-danger">Poista</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </main>
          ) : (
            <div style={{ marginTop: 16 }}>
              <AdminTestimonialsPage embedded />
            </div>
          )}
        </div>
      </div>
    </>
  )
}
