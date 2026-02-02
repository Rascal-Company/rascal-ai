import React, { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

export default function MultiSelect({
  options = [],
  value = [],
  onChange,
  placeholder = 'Select...',
  label,
  searchable = false
}) {
  const { t } = useTranslation('common')
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const dropdownRef = useRef(null)
  const searchInputRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isOpen, searchable])

  const toggleOption = (optionValue) => {
    const newValue = value.includes(optionValue)
      ? value.filter(v => v !== optionValue)
      : [...value, optionValue]
    onChange(newValue)
  }

  const filteredOptions = searchable && searchTerm
    ? options.filter(option => 
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options

  const selectedLabels = value.map(v => options.find(o => o.value === v)?.label || v).join(', ')

  const handleDropdownClick = (e) => {
    if (e.target.closest('.multiselect-search')) {
      return
    }
    setIsOpen(!isOpen)
  }

  return (
    <div className="multiselect-wrapper" ref={dropdownRef}>
      {label && <label className="multiselect-label">{label}</label>}
      <div 
        className={`multiselect ${isOpen ? 'open' : ''}`}
        onClick={handleDropdownClick}
      >
        <div className="multiselect-value">
          {value.length > 0 ? (
            <span>{selectedLabels || placeholder}</span>
          ) : (
            <span className="multiselect-placeholder">{placeholder}</span>
          )}
        </div>
        <span className="multiselect-arrow">▾</span>
      </div>
      {isOpen && (
        <div className="multiselect-dropdown">
          {searchable && (
            <div className="multiselect-search">
              <input
                ref={searchInputRef}
                type="text"
                placeholder={t('multiSelect.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="multiselect-search-input"
              />
            </div>
          )}
          {filteredOptions.length === 0 ? (
            <div className="multiselect-option">{t('multiSelect.noOptions')}</div>
          ) : (
            filteredOptions.map(option => (
              <label key={option.value} className="multiselect-option">
                <input
                  type="checkbox"
                  checked={value.includes(option.value)}
                  onChange={() => toggleOption(option.value)}
                />
                <span>{option.label}</span>
              </label>
            ))
          )}
        </div>
      )}
    </div>
  )
}

