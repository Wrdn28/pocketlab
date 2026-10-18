import React from 'react';
import { 
  Sliders, 
  ChevronLeft, 
  ChevronRight, 
  Save, 
  Radio, 
  Usb
} from 'lucide-react';

export default function Header({
  currentDevice,
  onSelectDevice,
  connectionStatus,
  onOpenConnectModal,
  currentPresetIndex = 0,
  currentSlotCode,
  currentPresetName,
  onPrevPreset,
  onNextPreset,
  onOpenTuner,
  onOpenDrum,
  onOpenSettings,
  onSavePreset,
  onOpenPresetsDrawer,
  masterVolume,
  onChangeMasterVolume
}) {
  const isUserSlot = currentPresetIndex < 50;
  // Authentic Pocket Master slot code: P01-P50 or F01-F50
  const slotDisplay = currentSlotCode || (isUserSlot 
    ? `P${String(currentPresetIndex + 1).padStart(2, '0')}` 
    : `F${String(currentPresetIndex - 49).padStart(2, '0')}`);
  const slotNumber = isUserSlot ? currentPresetIndex + 1 : currentPresetIndex - 49;
  const slotBankType = isUserSlot ? 'USER' : 'FACTORY';

  return (
    <header style={{
      margin: '10px 16px 8px 16px',
      padding: '8px 18px',
      background: 'linear-gradient(180deg, #1e2230 0%, #131620 100%)',
      borderRadius: '10px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      boxShadow: '0 6px 20px rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '16px',
      position: 'relative',
      zIndex: 20
    }}>
      {/* Brand: Clean Industrial PocketLab Badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          background: '#0d0f17',
          padding: '6px 14px',
          borderRadius: '6px',
          border: '1px solid rgba(255, 255, 255, 0.12)'
        }}>
          <div style={{ 
            fontFamily: 'var(--font-display)', 
            fontWeight: 900, 
            fontSize: '15px', 
            letterSpacing: '2px',
            color: '#f8fafc',
            lineHeight: 1.1
          }}>
            POCKETLAB
          </div>
          <div style={{ 
            fontSize: '9px', 
            color: '#94a3b8', 
            letterSpacing: '1px', 
            fontWeight: 700,
            marginTop: '2px'
          }}>
            SONICAKE POCKET MASTER
          </div>
        </div>
      </div>

      {/* Center: Authentic Pocket Master Digital OLED Preset Display */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: '#080a10',
        padding: '5px 10px',
        borderRadius: '6px',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.8)'
      }}>
        {/* Previous Preset Arrow */}
        <button 
          onClick={onPrevPreset}
          style={{
            background: '#1a1e2a',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: '#cbd5e1',
            borderRadius: '4px',
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
          title="Previous Preset"
        >
          <ChevronLeft size={16} />
        </button>

        {/* OLED Screen */}
        <div 
          onClick={onOpenPresetsDrawer}
          style={{
            cursor: 'pointer',
            textAlign: 'center',
            minWidth: '220px',
            background: '#0d111a',
            padding: '4px 16px',
            borderRadius: '4px',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}
          title="Click to view all presets"
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            {/* Slot Code (P01..P50 / F01..F50) */}
            <span style={{ 
              fontFamily: 'var(--font-numbers)', 
              fontWeight: 900, 
              color: isUserSlot ? '#38bdf8' : '#fbbf24', 
              fontSize: '18px',
              letterSpacing: '1px'
            }}>
              {slotDisplay}
            </span>

            {/* Preset Name */}
            <span style={{ 
              fontFamily: 'var(--font-display)',
              fontWeight: 800, 
              fontSize: '13px', 
              color: '#f8fafc',
              maxWidth: '160px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              letterSpacing: '0.5px'
            }}>
              {currentPresetName}
            </span>
          </div>

          <div style={{ 
            fontSize: '9px', 
            color: '#64748b', 
            marginTop: '1px', 
            letterSpacing: '1px', 
            fontWeight: 700 
          }}>
            {slotBankType} PRESET {String(slotNumber).padStart(2, '0')} / 50
          </div>
        </div>

        {/* Next Preset Arrow */}
        <button 
          onClick={onNextPreset}
          style={{
            background: '#1a1e2a',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: '#cbd5e1',
            borderRadius: '4px',
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
          title="Next Preset"
        >
          <ChevronRight size={16} />
        </button>

        {/* Save Preset Button */}
        <button 
          onClick={onSavePreset}
          style={{
            background: '#1a1e2a',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: '#e2e8f0',
            borderRadius: '4px',
            padding: '5px 12px',
            fontSize: '11px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}
          title="Save Preset to Hardware"
        >
          <Save size={13} />
          <span>SAVE</span>
        </button>
      </div>

      {/* Right Controls: Harmonized Studio Gear Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Tuner Hardware Button */}
        <button
          onClick={onOpenTuner}
          style={{
            background: '#1a1e2a',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: '#e2e8f0',
            borderRadius: '6px',
            padding: '6px 12px',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.5px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
          title="Chromatic Tuner"
        >
          <Radio size={13} />
          <span>TUNER</span>
        </button>

        {/* Global Settings Button */}
        <button
          onClick={onOpenSettings}
          style={{
            background: '#1a1e2a',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: '#e2e8f0',
            borderRadius: '6px',
            padding: '6px 12px',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.5px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
          title="Global Settings & Audio Levels"
        >
          <Sliders size={13} />
          <span>GLOBAL</span>
        </button>

        {/* USB Connection Status Button (Clean, No Circular AI Dots) */}
        <button
          onClick={onOpenConnectModal}
          style={{
            background: connectionStatus.connected ? '#152230' : '#1a1e2a',
            border: connectionStatus.connected 
              ? '1px solid rgba(56, 189, 248, 0.4)' 
              : '1px solid rgba(255, 255, 255, 0.12)',
            color: connectionStatus.connected ? '#38bdf8' : '#94a3b8',
            borderRadius: '6px',
            padding: '6px 14px',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.5px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
          title="USB / BLE MIDI Connection"
        >
          <Usb size={13} />
          <span>{connectionStatus.connected ? (connectionStatus.simulated ? 'SIMULATED' : 'CONNECTED') : 'CONNECT USB'}</span>
        </button>
      </div>
    </header>
  );
}
