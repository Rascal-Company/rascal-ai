import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Sidebar from '../components/Sidebar'
import MobileNavigation from '../components/MobileNavigation'
import { supabase } from '../lib/supabase'

export default function AdminTestimonialsPage({ embedded = false }) {
  const { t } = useTranslation('common')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ id: null, name: '', title: '', company: '', quote: '', avatar_url: '', published: true })
  const [dragActiveAvatar, setDragActiveAvatar] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [tempAvatarPreview, setTempAvatarPreview] = useState('')

  const fetchAll = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('testimonials')
        .select('id, name, title, company, quote, avatar_url, published, created_at')
        .order('created_at', { ascending: false })
      if (error) throw error
      setItems(data || [])
    } catch (e) {
      console.error('Failed to fetch testimonials', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  const save = async (updated) => {
    try {
      setLoading(true)
      const { id, ...fields } = updated
      const { data, error } = await supabase
        .from('testimonials')
        .update(fields)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      setItems(prev => prev.map(it => it.id === data.id ? data : it))
      if (form.id === id) setForm({ ...form, ...data })
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const edit = (item) => setForm({ ...item })

  const remove = async (id) => {
    if (!confirm('Poistetaanko?')) return
    try {
      setLoading(true)
      const { error } = await supabase
        .from('testimonials')
        .delete()
        .eq('id', id)
      if (error) throw error
      setItems(prev => prev.filter(it => it.id !== id))
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
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

  const content = (
    <div className="admin-main">
      <div className="grid grid-cols-[1fr_2fr] gap-5">
          <div className="bg-white border border-gray-200 rounded-[20px] p-5">
            <h2 className="mt-0"> {form.id ? 'Muokkaa suositusta' : 'Lisää uusi suositus'} </h2>
            <div className="article-form p-0">
              <div className="form-group">
                <label>Nimi</label>
                <input placeholder="Nimi" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Titteli</label>
                  <input placeholder="Titteli" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Yritys</label>
                  <input placeholder="Yritys" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label>Kuva</label>
                <div 
                  className={`image-upload-area ${dragActiveAvatar ? 'drag-active' : ''} ${uploadingAvatar ? 'uploading' : ''}`}
                  onDragEnter={(e)=>{e.preventDefault();e.stopPropagation();setDragActiveAvatar(true)}}
                  onDragOver={(e)=>{e.preventDefault();e.stopPropagation();setDragActiveAvatar(true)}}
                  onDragLeave={(e)=>{e.preventDefault();e.stopPropagation();setDragActiveAvatar(false)}}
                  onDrop={(e)=>{
                    e.preventDefault(); e.stopPropagation(); setDragActiveAvatar(false);
                    const files = [...e.dataTransfer.files]
                    if (files && files[0]) {
                      const file = files[0]
                      if (!file.type?.startsWith('image/')) { alert('Vain kuvatiedostot sallittu'); return }
                      if (file.size > 5*1024*1024) { alert('Kuva on liian suuri (max 5MB)'); return }
                      setUploadingAvatar(true)
                      const reader = new FileReader()
                      reader.onload = () => {
                        setTempAvatarPreview(String(reader.result || ''))
                        setForm(prev => ({ ...prev, avatar_file: file }))
                        setUploadingAvatar(false)
                      }
                      reader.readAsDataURL(file)
                    }
                  }}
                >
                  {uploadingAvatar ? (
                    <div className="upload-progress">
                      <div className="upload-spinner"></div>
                      <p>Ladataan esikatselua…</p>
                    </div>
                  ) : (tempAvatarPreview || form.avatar_url) ? (
                    <div className="uploaded-image">
                      <img src={tempAvatarPreview || form.avatar_url} alt="Kuvan esikatselu" />
                      <div className="image-actions">
                        <button 
                          type="button" 
                          className="btn btn-secondary"
                          onClick={() => { setTempAvatarPreview(''); setForm(prev => ({ ...prev, avatar_file: null, avatar_url: '' })) }}
                        >
                          Poista kuva
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="upload-placeholder">
                      <div className="upload-icon">📷</div>
                      <h3>Raahaa kuva tähän tai klikkaa valitaksesi</h3>
                      <p>Tuetut formaatit: JPG, PNG, GIF (max 5MB)</p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={e => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          if (!file.type?.startsWith('image/')) { alert('Vain kuvatiedostot sallittu'); return }
                          if (file.size > 5*1024*1024) { alert('Kuva on liian suuri (max 5MB)'); return }
                          setUploadingAvatar(true)
                          const reader = new FileReader()
                          reader.onload = () => {
                            setTempAvatarPreview(String(reader.result || ''))
                            setForm(prev => ({ ...prev, avatar_file: file }))
                            setUploadingAvatar(false)
                          }
                          reader.readAsDataURL(file)
                        }}
                        className="file-input"
                      />
                    </div>
                  )}
                </div>
                <details className="manual-url-section mt-3">
                  <summary>Tai syötä kuvan URL manuaalisesti</summary>
                  <input placeholder="https://..." value={form.avatar_url} onChange={e => setForm({ ...form, avatar_url: e.target.value })} className="manual-url-input" />
                </details>
              </div>
              <div className="form-group">
                <label>Suositus</label>
                <textarea placeholder="Lyhyt suositus" rows={5} value={form.quote} onChange={e => setForm({ ...form, quote: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="radio-label flex items-center gap-3">
                  <input type="checkbox" checked={!!form.published} onChange={e => setForm({ ...form, published: e.target.checked })} />
                  <span className="radio-text">Julkaistu</span>
                </label>
              </div>
              <div className="form-actions">
                <button className="btn btn-primary" onClick={async () => {
                  try {
                    setLoading(true)
                    if (form.id) {
                      // Muokkaus: jos uusi kuva on valittu, käytä backend-endpointtia (upload + update)
                      if (form.avatar_file) {
                        const fd = new FormData()
                        fd.append('action', 'update')
                        fd.append('id', String(form.id))
                        fd.append('name', form.name || '')
                        fd.append('title', form.title || '')
                        fd.append('company', form.company || '')
                        fd.append('quote', form.quote || '')
                        fd.append('published', String(!!form.published))
                        if (form.avatar_url) fd.append('avatar_url', form.avatar_url)
                        const sanitizedFilename = sanitizeFilename(form.avatar_file.name)
                        fd.append('avatar', form.avatar_file, sanitizedFilename)
                        const resp = await fetch('/api/content/testimonials/manage', { method: 'POST', body: fd })
                        if (!resp.ok) throw new Error('Update with image failed')
                      } else {
                        // Ei uutta kuvaa → suora Supabase-päivitys kentille
                        const { id, avatar_file, ...fields } = form
                        const updateFields = {
                          name: fields.name || '',
                          title: fields.title || '',
                          company: fields.company || '',
                          quote: fields.quote || '',
                          avatar_url: fields.avatar_url || '',
                          published: !!fields.published
                        }
                        const { error } = await supabase
                          .from('testimonials')
                          .update(updateFields)
                          .eq('id', id)
                        if (error) throw error
                      }
                      // Nollaa ja päivitä lista
                      setForm({ id: null, name: '', title: '', company: '', quote: '', avatar_url: '', published: true })
                      setTempAvatarPreview('')
                      await fetchAll()
                    } else {
                      // Uusi: käytä nykyistä webhookia, jotta kuvan lataus toimii
                      const fd = new FormData()
                      fd.append('action', 'create')
                      fd.append('name', form.name || '')
                      fd.append('title', form.title || '')
                      fd.append('company', form.company || '')
                      fd.append('quote', form.quote || '')
                      fd.append('published', String(!!form.published))
                      if (form.avatar_url) fd.append('avatar_url', form.avatar_url)
                      if (form.avatar_file) {
                        const sanitizedFilename = sanitizeFilename(form.avatar_file.name)
                        fd.append('avatar', form.avatar_file, sanitizedFilename)
                      }
                      const resp = await fetch('/api/content/testimonials/manage', { method: 'POST', body: fd })
                      if (!resp.ok) throw new Error('Create failed')
                      setForm({ id: null, name: '', title: '', company: '', quote: '', avatar_url: '', published: true })
                      setTempAvatarPreview('')
                      await fetchAll()
                    }
                  } catch (e) {
                    console.error(e)
                    alert('Tallennus epäonnistui: ' + (e?.message || 'Tuntematon virhe'))
                  } finally {
                    setLoading(false)
                  }
                }} disabled={loading || !form.name || !form.quote}>{form.id ? t('ui.buttons.save') : t('ui.buttons.send')}</button>
                {form.id && <button className="btn btn-secondary" onClick={() => setForm({ id: null, name: '', title: '', company: '', quote: '', avatar_url: '', published: true })}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>}
              </div>
            </div>
          </div>

        <div className="articles-list bg-white rounded-[20px] p-5">
            <h2 className="mt-0">Lista</h2>
            {loading ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Ladataan…</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {items.map(item => (
                  <div key={item.id} className="table-row grid grid-cols-[auto_2fr_auto_auto] items-center gap-3">
                    <div className="cell p-0">
                      <img src={item.avatar_url || '/placeholder.png'} alt="avatar" width={40} height={40} className="rounded-full object-cover" />
                    </div>
                    <div className="cell flex-col items-start gap-1">
                      <div className="font-semibold">{item.name}</div>
                      <div className="text-xs text-gray-500">{[item.title, item.company].filter(Boolean).join(', ')}</div>
                      <div className="text-sm mt-1.5 text-gray-900">"{item.quote}"</div>
                    </div>
                    <div className="cell gap-2">
                      <label className="flex items-center gap-1.5 text-xs">
                        <input type="checkbox" checked={!!item.published} onChange={async e => { await save({ ...item, published: e.target.checked }) }} />
                        {item.published ? 'Julkaistu' : 'Piilotettu'}
                      </label>
                    </div>
                    <div className="cell actions-cell">
                      <button className="btn btn-small btn-secondary" onClick={() => edit(item)}>Muokkaa</button>
                      <button className="btn btn-small btn-danger" onClick={() => remove(item.id)}>Poista</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
        </div>
      </div>
    </div>
  )

  if (embedded) return content

  return (
    <div className="admin-blog-page">
      <div className="layout-container">
        <header className="admin-header">
          <div className="header-content">
            <h1 className="page-title">Hallinta</h1>
            <p className="page-description">Testimonials</p>
          </div>
        </header>
        {content}
      </div>
    </div>
  )
}


