import React, { useState, useEffect, useRef, useCallback } from 'react';

// HSL to RGB conversion
const hslToRgb = (h, s, l) => {
  h /= 360;
  s /= 100;
  l /= 100;
  
  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  
  if (s === 0) {
    return [l * 255, l * 255, l * 255];
  }
  
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  
  return [
    Math.round(hue2rgb(p, q, h + 1/3) * 255),
    Math.round(hue2rgb(p, q, h) * 255),
    Math.round(hue2rgb(p, q, h - 1/3) * 255)
  ];
};

// RGB to HSL conversion
const rgbToHsl = (r, g, b) => {
  r /= 255;
  g /= 255;
  b /= 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  
  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  
  return [h * 360, s * 100, l * 100];
};

// HEX to RGB
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

// RGB to HEX
const rgbToHex = (r, g, b) => {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
};

export default function ColorPicker({ value = '#3b82f6', onChange, label = 'Valitse väri' }) {
  const [hsl, setHsl] = useState({ h: 0, s: 0, l: 0 });
  const [rgb, setRgb] = useState({ r: 0, g: 0, b: 0 });
  const [hex, setHex] = useState(value);
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState(null);
  
  const hueRef = useRef(null);
  const satBrightRef = useRef(null);

  // Päivitä HSL ja RGB kun HEX muuttuu ulkoisesti
  useEffect(() => {
    const rgbValue = hexToRgb(value);
    if (rgbValue) {
      const hslValue = rgbToHsl(rgbValue.r, rgbValue.g, rgbValue.b);
      setHsl({ h: hslValue[0], s: hslValue[1], l: hslValue[2] });
      setRgb(rgbValue);
      setHex(value);
    }
  }, [value]);

  // Päivitä RGB ja HEX kun HSL muuttuu
  const updateFromHsl = useCallback((newHsl) => {
    const rgbValue = hslToRgb(newHsl.h, newHsl.s, newHsl.l);
    const newRgb = { r: rgbValue[0], g: rgbValue[1], b: rgbValue[2] };
    const newHex = rgbToHex(rgbValue[0], rgbValue[1], rgbValue[2]);
    
    setRgb(newRgb);
    setHex(newHex);
    onChange(newHex);
  }, [onChange]);

  // Käsittele hue slider
  const handleHueMouseDown = (e) => {
    setIsDragging(true);
    setDragType('hue');
    handleHueMove(e);
  };

  const handleHueMove = (e) => {
    if (!hueRef.current) return;
    
    const rect = hueRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const newHue = percentage * 360;
    
    const newHsl = { ...hsl, h: newHue };
    setHsl(newHsl);
    updateFromHsl(newHsl);
  };

  // Käsittele saturation/brightness alue
  const handleSatBrightMouseDown = (e) => {
    setIsDragging(true);
    setDragType('satbright');
    handleSatBrightMove(e);
  };

  const handleSatBrightMove = (e) => {
    if (!satBrightRef.current) return;
    
    const rect = satBrightRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const saturation = Math.max(0, Math.min(100, (x / rect.width) * 100));
    const lightness = Math.max(0, Math.min(100, 100 - (y / rect.height) * 100));
    
    const newHsl = { ...hsl, s: saturation, l: lightness };
    setHsl(newHsl);
    updateFromHsl(newHsl);
  };

  // Mouse move ja up eventit
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      
      if (dragType === 'hue') {
        handleHueMove(e);
      } else if (dragType === 'satbright') {
        handleSatBrightMove(e);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setDragType(null);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragType, hsl]);

  // Käsittele RGB syöttö
  const handleRgbChange = (component, value) => {
    const numValue = Math.max(0, Math.min(255, parseInt(value) || 0));
    const newRgb = { ...rgb, [component]: numValue };
    const newHsl = rgbToHsl(newRgb.r, newRgb.g, newRgb.b);
    const newHslObj = { h: newHsl[0], s: newHsl[1], l: newHsl[2] };
    const newHex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
    
    setRgb(newRgb);
    setHsl(newHslObj);
    setHex(newHex);
    onChange(newHex);
  };

  // Käsittele HEX syöttö
  const handleHexChange = (e) => {
    const input = e.target.value;
    setHex(input);
    
    if (input.length === 7 && /^#[0-9A-Fa-f]{6}$/.test(input)) {
      const rgbValue = hexToRgb(input);
      if (rgbValue) {
        const hslValue = rgbToHsl(rgbValue.r, rgbValue.g, rgbValue.b);
        setHsl({ h: hslValue[0], s: hslValue[1], l: hslValue[2] });
        setRgb(rgbValue);
        onChange(input);
      }
    }
  };

  return (
    <div className="photoshop-color-picker">
      <label className="color-picker-label">{label}</label>
      
      <div className="color-picker-container">
        {/* Saturation/Brightness alue */}
        <div className="sat-bright-area">
          <div 
            ref={satBrightRef}
            className="sat-bright-canvas"
            style={{
              background: `linear-gradient(to right, hsl(${hsl.h}, 100%, 50%), hsl(${hsl.h}, 0%, 50%)), linear-gradient(to top, hsl(${hsl.h}, ${hsl.s}%, 0%), hsl(${hsl.h}, ${hsl.s}%, 100%))`
            }}
            onMouseDown={handleSatBrightMouseDown}
          >
            <div 
              className="sat-bright-cursor"
              style={{
                left: `${hsl.s}%`,
                top: `${100 - hsl.l}%`,
                backgroundColor: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`
              }}
            />
          </div>
        </div>

        {/* Hue slider */}
        <div className="hue-slider-container">
          <div 
            ref={hueRef}
            className="hue-slider"
            onMouseDown={handleHueMouseDown}
          >
            <div 
              className="hue-cursor"
              style={{ left: `${(hsl.h / 360) * 100}%` }}
            />
          </div>
        </div>

        {/* Väripreview */}
        <div className="color-preview-section">
          <div 
            className="current-color"
            style={{ backgroundColor: hex }}
          />
          <div 
            className="previous-color"
            style={{ backgroundColor: '#ffffff' }}
          />
        </div>
      </div>

      {/* RGB ja HEX kentät */}
      <div className="color-inputs">
        <div className="input-group">
          <label>R</label>
          <input
            type="number"
            value={rgb.r}
            onChange={(e) => handleRgbChange('r', e.target.value)}
            min="0"
            max="255"
          />
        </div>
        <div className="input-group">
          <label>G</label>
          <input
            type="number"
            value={rgb.g}
            onChange={(e) => handleRgbChange('g', e.target.value)}
            min="0"
            max="255"
          />
        </div>
        <div className="input-group">
          <label>B</label>
          <input
            type="number"
            value={rgb.b}
            onChange={(e) => handleRgbChange('b', e.target.value)}
            min="0"
            max="255"
          />
        </div>
        <div className="input-group hex-group">
          <label>#</label>
          <input
            type="text"
            value={hex}
            onChange={handleHexChange}
            className="hex-input"
            maxLength="7"
          />
        </div>
      </div>
    </div>
  );
}
