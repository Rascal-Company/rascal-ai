import React, { useState } from 'react';
import Button from './Button'

const templates = [
  { id: 'template1', name: 'Moderni', image: '/carousel1.jpg', placidId: 'xpnx52obc7b5r' },
  { id: 'template2', name: 'Klassinen', image: '/carousel2.jpg', placidId: 'xv4vrp3ifldw3' }
];

export default function CarouselTemplateSelector() {
  const [selected, setSelected] = useState(templates[0].id);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSelect = (id) => setSelected(id);

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    setSuccess(false);
    try {
      const selectedTemplate = templates.find(t => t.id === selected);
      // Hae companyId localStoragesta
      let companyId = null;
      try {
        const userRaw = JSON.parse(localStorage.getItem('user') || 'null');
        companyId = userRaw?.companyId || userRaw?.user?.companyId || null;
      } catch (e) {}
      const res = await fetch('/api/content/carousel-template', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          templateId: selectedTemplate.placidId,
          companyId: companyId
        })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Virhe lähetyksessä');
      }
      setSuccess(true);
    } catch (e) {
      setError(e.message || 'Tuntematon virhe');
    } finally {
      setLoading(false);
    }
  };

    return (
    <div className="max-w-[900px] mx-auto p-6">
      <h2 className="mb-6">Valitse karusellin ulkoasu</h2>
      <div className="flex gap-8 mb-8 justify-center flex-wrap">
        {templates.map((tpl) => (
          <div
            key={tpl.id}
            onClick={() => handleSelect(tpl.id)}
            className={`rounded-2xl p-4 cursor-pointer transition-all duration-200 text-center w-[270px] box-border mb-4 ${
              selected === tpl.id
                ? 'border-[3px] border-blue-500 bg-blue-50 shadow-[0_4px_24px_rgba(59,130,246,0.10)]'
                : 'border border-gray-200 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.07)]'
            }`}
          >
            <img src={tpl.image} alt={tpl.name} className="w-[270px] h-[338px] object-cover rounded-xl mb-3 shadow-[0_2px_8px_rgba(0,0,0,0.08)]" />
            <div className="font-semibold text-lg mb-1">{tpl.name}</div>
          </div>
        ))}
      </div>
      <Button
        onClick={handleSubmit}
        disabled={loading}
        className="mb-4"
      >
        {loading ? 'Lähetetään...' : 'Valitse'}
      </Button>
      {success && <div className="text-green-600 mt-2">Valinta lähetetty!</div>}
      {error && <div className="text-red-600 mt-2">{error}</div>}
    </div>
  );
} 