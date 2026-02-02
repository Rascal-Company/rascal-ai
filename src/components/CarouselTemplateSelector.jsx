import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { getCurrentUser } from '../utils/userApi';
import Button from './Button';
import ColorPicker from './ColorPicker';
import { useTranslation } from 'react-i18next';

const templates = [
  { 
    id: 'template1', 
    name: 'Moderni', 
    placidId: 'xv4vrp3ifldw3',
    type: 'text',
    content: {
      mainText: 'Säästä tunteja\nviikossa – näe\nkaikki\nmarkkinointisi\ntärkeät numerot\nyhdestä\nnäkymästä',
      subText: 'Rascal AI',
      url: null,
      defaultBgColor: '#000000'
    }
  },
  { 
    id: 'template2', 
    name: 'Klassinen', 
    placidId: 'xpnx52obc7b5r',
    type: 'text',
    content: {
      mainText: 'Loppu\nsähläämiselle!\nKaikki tärkeä tieto\nkeskitetysti ilman\nexcelien ja\ntyökalujen välistä\nhyppimistä',
      subText: 'Rascal AI',
      url: 'www.rascal.ai',
      defaultBgColor: '#f5f5f5'
    }
  }
];

export default function CarouselTemplateSelector() {
  const { user } = useAuth();
  const { t } = useTranslation('common');
  const [selected, setSelected] = useState(templates[0].id);
  const [selectedColor, setSelectedColor] = useState(templates[0].content.defaultBgColor);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Funktio joka laskee tekstivärin kontrastin perusteella
  const getContrastingTextColor = (hexColor) => {
    const color = hexColor.replace('#', '');
    const r = parseInt(color.slice(0, 2), 16);
    const g = parseInt(color.slice(2, 4), 16);
    const b = parseInt(color.slice(4, 6), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? '#000000' : '#ffffff';
  };

  const handleSelect = (id) => {
    setSelected(id);
    const template = templates.find(t => t.id === id);
    setSelectedColor(template.content.defaultBgColor);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    setSuccess(false);
    try {
      const selectedTemplate = templates.find(t => t.id === selected);
      
      // Hae käyttäjätiedot turvallisen API-endpointin kautta
      const userData = await getCurrentUser()
      
      if (!userData?.company_id) {
        throw new Error(t('settings.carousel.userCompanyMissing'));
      }
      
      const textColor = getContrastingTextColor(selectedColor);
      
      console.log('selectedColor:', selectedColor);
      console.log('textColor:', textColor);
      console.log('selectedTemplate:', selectedTemplate);
      
      const payload = { 
        templateId: selectedTemplate.placidId,
        companyId: userData.company_id,
        backgroundColor: selectedColor,
        textColor: textColor
      };
      
      console.log('Lähetetään payload:', payload);
      
      const res = await fetch('/api/content/carousel-template', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) {
        let errorMessage = t('settings.carousel.sendError');
        try {
          const data = await res.json();
          errorMessage = data.error || errorMessage;
        } catch (jsonErr) {
          console.error('Virhe JSON-parsinnassa:', jsonErr);
          errorMessage = `HTTP ${res.status}: ${res.statusText}`;
        }
        throw new Error(errorMessage);
      }
      
      let responseData;
      try {
        responseData = await res.json();
        console.log('Webhook vastaus:', responseData);
      } catch (jsonErr) {
        console.error('Virhe JSON-parsinnassa:', jsonErr);
        responseData = { success: true, message: 'Valinta lähetetty' };
      }
      
      setSuccess(true);
    } catch (e) {
      setError(e.message || t('settings.carousel.unknownError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="carousel-selector">
      <h2 className="carousel-title">{t('settings.carousel.title')}</h2>
      
      <div className="templates-grid">
        {templates.map((tpl) => {
          const textColor = getContrastingTextColor(selectedColor);
          
          return (
             <div
               key={tpl.id}
               onClick={() => handleSelect(tpl.id)}
               className={`template-card ${selected === tpl.id ? 'selected' : ''}`}
               data-template={tpl.id}
             >
              <div 
                className="template-preview"
                style={{ backgroundColor: selectedColor }}
              >
                <div 
                  className="main-text"
                  style={{ color: textColor }}
                >
                  {tpl.content.mainText.split('\n').map((line, index) => (
                    <div key={index}>{line}</div>
                  ))}
                </div>
                
                <div className="branding">
                  <div 
                    className="sub-text"
                    style={{ color: textColor }}
                  >
                    {tpl.content.subText}
                  </div>
                  {tpl.content.url && (
                    <div 
                      className="url-text"
                      style={{ color: textColor }}
                    >
                      {tpl.content.url}
                    </div>
                  )}
                </div>
              </div>
              <div className="template-name">{tpl.name}</div>
            </div>
          );
        })}
      </div>
      
      <div className="color-section">
        <h3 className="color-title">{t('settings.carousel.colorLabel')}</h3>
        <div className="color-picker-wrapper">
          <ColorPicker
            value={selectedColor}
            onChange={(color) => {
              console.log('ColorPicker onChange kutsuttu:', color);
              setSelectedColor(color);
            }}
            label=""
          />
        </div>
      </div>
      
      <Button
        onClick={handleSubmit}
        disabled={loading}
        className="submit-button"
      >
        {loading ? t('settings.carousel.sending') : t('settings.carousel.select')}
      </Button>
      {success && <div className="success-message">{t('settings.carousel.sent')}</div>}
      {error && <div className="error-message">{error}</div>}
    </div>
  );
}