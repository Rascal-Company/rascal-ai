import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function SiteHeader({ onOpenSignIn }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { t, i18n } = useTranslation('common')
  const navigate = useNavigate()
  const location = useLocation()

  const setLanguage = (lang) => {
    if (lang !== 'fi' && lang !== 'en') return
    document.cookie = `rascal.lang=${encodeURIComponent(lang)}; path=/; max-age=31536000`
    i18n.changeLanguage(lang)
    const hash = location.hash || ''
    const pathWithoutLang = location.pathname.replace(/^\/(fi|en)/, '')
    navigate(`/${lang}${pathWithoutLang}${hash}`)
  }

  return (
    <header className="header">
      <div className="logo-section">
        <Link to="/" className="logo-link" aria-label={t('general.home')}>
          <div className="logo-icon">
            <img src="/favicon.png" alt="Rascal AI" />
          </div>
          <h2 className="logo-text">Rascal AI</h2>
        </Link>
      </div>
      <div className="header-right">
        <div className="nav-links desktop-nav">
          <a className="nav-link" href="/blog">{t('nav.articles')}</a>
          <a className="nav-link" href="/#cta">{t('nav.demo')}</a>
          <a className="nav-link" href="/asiakkaat">{t('nav.customers')}</a>
          <a className="nav-link" href="/#team">{t('nav.team')}</a>
          <a className="nav-link" href="/#contact">{t('nav.contact')}</a>
        </div>
        <div className="header-buttons desktop-buttons">
          <button className="btn btn-primary" onClick={() => {
            onOpenSignIn?.();
          }}>{t('nav.bookDemo')}</button>
          <button className="btn btn-secondary" onClick={onOpenSignIn}>{t('nav.signin')}</button>
        </div>
        <div className="lang-switch" aria-label={t('newLabels.languageSwitcher')}>
          <button className="nav-link" onClick={() => setLanguage('fi')}>{t('lang.shortFi')}</button>
          <span className="px-1"> / </span>
          <button className="nav-link" onClick={() => setLanguage('en')}>{t('lang.shortEn')}</button>
        </div>
        <button
          className="mobile-menu-button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label={t('newLabels.toggleMobileMenu')}
        >
          {isMobileMenuOpen ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 12H21M3 6H21M3 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </button>
      </div>

      {isMobileMenuOpen && (
        <div className="mobile-menu">
          <div className="mobile-nav-links">
            <a className="mobile-nav-link" href="/blog" onClick={() => setIsMobileMenuOpen(false)}>{t('nav.articles')}</a>
            <a className="mobile-nav-link" href="/#cta" onClick={() => setIsMobileMenuOpen(false)}>{t('nav.demo')}</a>
            <a className="mobile-nav-link" href="/asiakkaat" onClick={() => setIsMobileMenuOpen(false)}>{t('nav.customers')}</a>
            <a className="mobile-nav-link" href="/#team" onClick={() => setIsMobileMenuOpen(false)}>{t('nav.team')}</a>
            <a className="mobile-nav-link" href="/#contact" onClick={() => setIsMobileMenuOpen(false)}>{t('nav.contact')}</a>
          </div>
          <div className="mobile-buttons">
            <button className="btn btn-primary mobile-btn" onClick={() => { 
              onOpenSignIn?.(); 
              setIsMobileMenuOpen(false) 
            }}>{t('nav.bookDemo')}</button>
            <button className="btn btn-secondary mobile-btn" onClick={() => { onOpenSignIn?.(); setIsMobileMenuOpen(false) }}>{t('nav.signin')}</button>
          </div>
          <div className="mobile-lang-switch">
            <button className="mobile-nav-link" onClick={() => { setLanguage('fi'); setIsMobileMenuOpen(false) }}>{t('lang.shortFi')}</button>
            <span className="px-1"> / </span>
            <button className="mobile-nav-link" onClick={() => { setLanguage('en'); setIsMobileMenuOpen(false) }}>{t('lang.shortEn')}</button>
          </div>
        </div>
      )}
    </header>
  )
}


