import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import PageHeader from '../components/PageHeader'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export default function MeetingNotesPage() {
  const { t } = useTranslation('common')
  const { user } = useAuth()
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [newNote, setNewNote] = useState({ title: '', content: '', meeting_date: '' })
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)

  useEffect(() => {
    fetchNotes()
  }, [user])

  const fetchNotes = async () => {
    if (!user?.id) return
    
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('meeting_notes')
        .select('*')
        .eq('user_id', user.id)
        .order('meeting_date', { ascending: false })

      if (error) throw error
      setNotes(data || [])
    } catch (err) {
      console.error('Virhe palaverimuistioiden lataamisessa:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!newNote.title.trim() || !newNote.content.trim()) return

    try {
      if (editingId) {
        // Päivitä olemassa oleva muistio
        const { error } = await supabase
          .from('meeting_notes')
          .update({
            title: newNote.title,
            content: newNote.content,
            meeting_date: newNote.meeting_date,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingId)

        if (error) throw error
      } else {
        // Luo uusi muistio
        const { error } = await supabase
          .from('meeting_notes')
          .insert([{
            title: newNote.title,
            content: newNote.content,
            meeting_date: newNote.meeting_date,
            user_id: user.id,
            created_at: new Date().toISOString()
          }])

        if (error) throw error
      }

      setNewNote({ title: '', content: '', meeting_date: '' })
      setShowForm(false)
      setEditingId(null)
      fetchNotes()
    } catch (err) {
      console.error('Virhe palaverimuistion tallentamisessa:', err)
      setError(err.message)
    }
  }

  const handleEdit = (note) => {
    setNewNote({
      title: note.title,
      content: note.content,
      meeting_date: note.meeting_date
    })
    setEditingId(note.id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Haluatko varmasti poistaa tämän palaverimuistion?')) return

    try {
      const { error } = await supabase
        .from('meeting_notes')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchNotes()
    } catch (err) {
      console.error('Virhe palaverimuistion poistamisessa:', err)
      setError(err.message)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fi-FI')
  }

  if (loading) {
    return (
      <>
        <PageHeader title={t('meetingNotes.title')} />
        <div className="meeting-notes-container">
          <div className="meeting-notes-header">
            <button 
              className="btn-primary"
              onClick={() => setShowForm(true)}
            >
              {t('meetingNotes.addNew')}
            </button>
          </div>
          <div className="meeting-notes-list">
            <div className="empty-state">
              <p>Ladataan palaverimuistioita...</p>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <PageHeader title={t('meetingNotes.title')} />
      <div className="meeting-notes-container">
        <div className="meeting-notes-header">
          <button 
            className="btn-primary"
            onClick={() => setShowForm(true)}
          >
            {t('meetingNotes.addNew')}
          </button>
        </div>

        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}

        {showForm && (
          <div className="meeting-notes-form">
            <h3>{editingId ? t('meetingNotes.editTitle') : t('meetingNotes.createTitle')}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="title">{t('meetingNotes.titleLabel')}</label>
                <input
                  type="text"
                  id="title"
                  value={newNote.title}
                  onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                  placeholder={t('meetingNotes.titlePlaceholder')}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="meeting_date">{t('meetingNotes.dateLabel')}</label>
                <input
                  type="date"
                  id="meeting_date"
                  value={newNote.meeting_date}
                  onChange={(e) => setNewNote({ ...newNote, meeting_date: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="content">{t('meetingNotes.contentLabel')}</label>
                <textarea
                  id="content"
                  value={newNote.content}
                  onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                  placeholder={t('meetingNotes.contentPlaceholder')}
                  rows={10}
                  required
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-primary">
                  {editingId ? t('meetingNotes.update') : t('meetingNotes.save')}
                </button>
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => {
                    setShowForm(false)
                    setEditingId(null)
                    setNewNote({ title: '', content: '', meeting_date: '' })
                  }}
                >
                  {t('meetingNotes.cancel')}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="meeting-notes-list">
          {notes.length === 0 ? (
            <div className="empty-state">
              <p>{t('meetingNotes.empty')}</p>
            </div>
          ) : (
            notes.map((note) => (
              <div key={note.id} className="meeting-note-card">
                <div className="note-header">
                  <h3>{note.title}</h3>
                  <div className="note-actions">
                    <button 
                      className="btn-edit"
                      onClick={() => handleEdit(note)}
                    >
                      {t('meetingNotes.edit')}
                    </button>
                    <button 
                      className="btn-delete"
                      onClick={() => handleDelete(note.id)}
                    >
                      {t('meetingNotes.delete')}
                    </button>
                  </div>
                </div>
                <div className="note-meta">
                  <span className="note-date">{formatDate(note.meeting_date)}</span>
                  {note.updated_at && (
                    <span className="note-updated">
                      {t('meetingNotes.lastUpdated')}: {formatDate(note.updated_at)}
                    </span>
                  )}
                </div>
                <div className="note-content">
                  <p>{note.content}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}
