import React, { useEffect } from 'react';
import { X, Sliders, Volume2, Headphones, Mic, Usb, Bluetooth } from 'lucide-react';

export default function DeviceSettingsModal({
  isOpen,
  onClose,
  currentDevice,
  globalSettings = {
    globalVolume: 75,
    inputLevel: 0,
    fxRecLevel: 0,
    btRecLevel: 0,
    monitorLevel: 0
  },
  onUpdateGlobalParam,
  onRefreshGlobals
}) {
  useEffect(() => {
    if (!isOpen || !onRefreshGlobals) return;
    onRefreshGlobals();

    // Auto-refresh globals every 1.2s while modal is open so hardware Master Volume & levels track in realtime
    const interval = setInterval(() => {
      onRefreshGlobals();
    }, 1200);

    return () => {
      clearInterval(interval);
    };
  }, [isOpen, onRefreshGlobals]);

  if (!isOpen) return null;

  const gv = globalSettings.globalVolume !== undefined ? globalSettings.globalVolume : 75;
  const il = globalSettings.inputLevel !== undefined ? globalSettings.inputLevel : 0;
  const fx = globalSettings.fxRecLevel !== undefined ? globalSettings.fxRecLevel : 0;
  const bt = globalSettings.btRecLevel !== undefined ? globalSettings.btRecLevel : 0;
  const mon = globalSettings.monitorLevel !== undefined ? globalSettings.monitorLevel : 0;

  const formatDb = (val) => {
    const num = Number(val) || 0;
    return num > 0 ? `+${num} dB` : `${num} dB`;
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.78)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        width: '600px',
        background: '#131622',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '10px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 24px 50px rgba(0, 0, 0, 0.85)'
      }}>
        {/* Header */}
        <div style={{
          padding: '14px 20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#161a28'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '30px',
              height: '30px',
              borderRadius: '6px',
              background: '#1c2232',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Sliders size={15} color="#e2e8f0" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '14px', color: '#f8fafc', letterSpacing: '0.3px' }}>
                Global Settings
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                Hardware Output & Recording Levels
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                borderRadius: '5px',
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <X size={17} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '75vh', overflowY: 'auto' }}>
          
          {/* Section 1: Master Output Volume */}
          <div style={{
            background: '#181c2a',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '16px 18px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Volume2 size={16} color="var(--accent-amber)" />
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#f8fafc' }}>
                  Hardware Master Volume
                </span>
              </div>
              <div style={{
                background: '#0e111a',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                borderRadius: '5px',
                padding: '2px 10px',
                fontFamily: 'var(--font-numbers)',
                fontWeight: 800,
                fontSize: '13px',
                color: 'var(--accent-amber)'
              }}>
                {gv} / 100
              </div>
            </div>

            <input
              type="range"
              min="0"
              max="100"
              value={gv}
              onChange={(e) => onUpdateGlobalParam && onUpdateGlobalParam('globalVolume', Number(e.target.value))}
              style={{
                width: '100%',
                height: '6px',
                accentColor: 'var(--accent-amber)',
                cursor: 'pointer'
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#64748b', marginTop: '6px', fontFamily: 'var(--font-numbers)' }}>
              <span>0 (Mute)</span>
              <span>50 (Mid)</span>
              <span>100 (Max)</span>
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '8px', lineHeight: '1.4' }}>
              Mengontrol volume output master fisik hardware pedal (output jack L/R dan headphone).
            </div>
          </div>

          {/* Section 2: Audio Gain & Levels */}
          <div style={{
            background: '#181c2a',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '16px 18px'
          }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.5px', marginBottom: '14px' }}>
              GAIN & RECORDING LEVELS (-20 dB s/d +20 dB)
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              {/* INPUT LEVEL */}
              <div style={{
                background: '#131622',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '6px',
                padding: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Mic size={14} color="#94a3b8" />
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#f1f5f9' }}>Input Gain</span>
                  </div>
                  <strong style={{ color: '#38bdf8', fontFamily: 'var(--font-numbers)', fontSize: '12px' }}>
                    {formatDb(il)}
                  </strong>
                </div>
                <input
                  type="range"
                  min="-20"
                  max="20"
                  step="1"
                  value={il}
                  onChange={(e) => onUpdateGlobalParam && onUpdateGlobalParam('inputLevel', Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#38bdf8', cursor: 'pointer' }}
                />
                <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>
                  Gain input gitar / instrumen
                </div>
              </div>

              {/* FX REC LEVEL */}
              <div style={{
                background: '#131622',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '6px',
                padding: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Usb size={14} color="#94a3b8" />
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#f1f5f9' }}>USB Record</span>
                  </div>
                  <strong style={{ color: '#38bdf8', fontFamily: 'var(--font-numbers)', fontSize: '12px' }}>
                    {formatDb(fx)}
                  </strong>
                </div>
                <input
                  type="range"
                  min="-20"
                  max="20"
                  step="1"
                  value={fx}
                  onChange={(e) => onUpdateGlobalParam && onUpdateGlobalParam('fxRecLevel', Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#38bdf8', cursor: 'pointer' }}
                />
                <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>
                  Level rekaman USB dengan efek
                </div>
              </div>

              {/* BT REC LEVEL */}
              <div style={{
                background: '#131622',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '6px',
                padding: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Bluetooth size={14} color="#94a3b8" />
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#f1f5f9' }}>Bluetooth</span>
                  </div>
                  <strong style={{ color: '#38bdf8', fontFamily: 'var(--font-numbers)', fontSize: '12px' }}>
                    {formatDb(bt)}
                  </strong>
                </div>
                <input
                  type="range"
                  min="-20"
                  max="20"
                  step="1"
                  value={bt}
                  onChange={(e) => onUpdateGlobalParam && onUpdateGlobalParam('btRecLevel', Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#38bdf8', cursor: 'pointer' }}
                />
                <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>
                  Level audio stream Bluetooth
                </div>
              </div>

              {/* MONITOR LEVEL */}
              <div style={{
                background: '#131622',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '6px',
                padding: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Headphones size={14} color="#94a3b8" />
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#f1f5f9' }}>Monitor Out</span>
                  </div>
                  <strong style={{ color: '#38bdf8', fontFamily: 'var(--font-numbers)', fontSize: '12px' }}>
                    {formatDb(mon)}
                  </strong>
                </div>
                <input
                  type="range"
                  min="-20"
                  max="20"
                  step="1"
                  value={mon}
                  onChange={(e) => onUpdateGlobalParam && onUpdateGlobalParam('monitorLevel', Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#38bdf8', cursor: 'pointer' }}
                />
                <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>
                  Level volume headphone & monitor
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Hardware Diagnostics */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 14px',
            background: '#181c2a',
            borderRadius: '6px',
            fontSize: '11px',
            color: '#94a3b8',
            border: '1px solid rgba(255, 255, 255, 0.06)'
          }}>
            <div>
              <span style={{ color: '#cbd5e1' }}>Hardware Target:</span> {currentDevice?.name || 'Sonicake Pocket Master'} (QME20)
            </div>
            <button
              onClick={onClose}
              style={{
                background: '#242a3a',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#f8fafc',
                borderRadius: '5px',
                padding: '5px 16px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
