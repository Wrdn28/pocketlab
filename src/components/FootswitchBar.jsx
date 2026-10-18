import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getPresetSlotCode } from '../services/pocketMasterProtocol';

export default function FootswitchBar({
  currentPresetIndex = 0,
  onSelectPreset,
  presets = []
}) {
  const isUser = currentPresetIndex < 50;

  // In Sonicake Pocket Master:
  // Bank 1: User (indices 0..49) -> P01..P50
  // Bank 2: Factory (indices 50..99) -> F01..F50
  const bankOffset = isUser ? 0 : 50;
  const currentInBank = currentPresetIndex - bankOffset; // 0..49
  const groupIndex = Math.floor(currentInBank / 4); // 0..12
  const baseIdx = bankOffset + (groupIndex * 4);
  const slotIndices = [baseIdx, baseIdx + 1, baseIdx + 2, baseIdx + 3].filter(i => {
    return isUser ? (i >= 0 && i < 50) : (i >= 50 && i < 100);
  });

  const handleBankUser = () => {
    if (!isUser) {
      onSelectPreset(0);
    }
  };

  const handleBankFactory = () => {
    if (isUser) {
      onSelectPreset(50);
    }
  };

  const handlePrevGroup = () => {
    const target = Math.max(bankOffset, baseIdx - 4);
    onSelectPreset(target);
  };

  const handleNextGroup = () => {
    const maxIdx = isUser ? 49 : 99;
    const target = Math.min(maxIdx, baseIdx + 4);
    onSelectPreset(target);
  };

  const haloColor = isUser ? '#38bdf8' : '#fbbf24';

  return (
    <div style={{
      margin: '0 16px 12px 16px',
      padding: '12px 22px',
      background: 'linear-gradient(180deg, #1e2230 0%, #131620 100%)',
      borderRadius: '12px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255,255,255,0.15)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '24px'
    }}>
      {/* Pocket Master Bank Switcher (USER vs FACTORY) */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        background: '#090c13',
        padding: '6px 10px',
        borderRadius: '8px',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{ fontSize: '9px', fontWeight: 800, color: '#64748b', letterSpacing: '0.8px' }}>
          HARDWARE BANK
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={handleBankUser}
            style={{
              background: isUser ? '#1e2434' : 'transparent',
              border: isUser ? '1px solid rgba(56, 189, 248, 0.5)' : '1px solid rgba(255, 255, 255, 0.08)',
              color: isUser ? '#38bdf8' : '#94a3b8',
              borderRadius: '4px',
              padding: '6px 10px',
              fontSize: '11px',
              fontWeight: 800,
              cursor: 'pointer',
              letterSpacing: '0.5px',
              transition: 'all 0.15s ease'
            }}
            title="Switch to User Presets (P01 - P50)"
          >
            USER (P)
          </button>

          <button
            onClick={handleBankFactory}
            style={{
              background: !isUser ? '#1e2434' : 'transparent',
              border: !isUser ? '1px solid rgba(251, 191, 36, 0.5)' : '1px solid rgba(255, 255, 255, 0.08)',
              color: !isUser ? '#fbbf24' : '#94a3b8',
              borderRadius: '4px',
              padding: '6px 10px',
              fontSize: '11px',
              fontWeight: 800,
              cursor: 'pointer',
              letterSpacing: '0.5px',
              transition: 'all 0.15s ease'
            }}
            title="Switch to Factory Presets (F01 - F50)"
          >
            FACTORY (F)
          </button>
        </div>
      </div>

      {/* Preset Group Step Buttons & 4 Heavy-Duty Metal Plunger Footswitches */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '20px',
        flex: 1
      }}>
        {/* Step Prev 4 */}
        <button
          onClick={handlePrevGroup}
          style={{
            background: '#1a1e2a',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: '#cbd5e1',
            borderRadius: '6px',
            width: '32px',
            height: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
          title="Previous Presets"
        >
          <ChevronLeft size={18} />
        </button>

        {/* 4 Heavy-Duty Metal Footswitches with Stainless Plungers */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          {slotIndices.map((idx, slotPos) => {
            const isActive = currentPresetIndex === idx;
            const preset = presets[idx] || {};
            const slot = preset.slotCode || getPresetSlotCode(idx);
            const pName = preset.name || slot;
            const keyNum = slotPos + 1;

            return (
              <div 
                key={idx}
                onClick={() => onSelectPreset(idx)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
                title={`Press key ${keyNum} on keyboard or click to select preset ${slot} (${pName})`}
              >
                {/* Footswitch Number / Keybind Shortcut Badge */}
                <div style={{
                  fontSize: '9px',
                  fontWeight: 800,
                  fontFamily: 'var(--font-numbers)',
                  color: isActive ? haloColor : '#94a3b8',
                  background: isActive ? `${haloColor}22` : '#0b0e15',
                  border: `1px solid ${isActive ? haloColor : 'rgba(255, 255, 255, 0.12)'}`,
                  borderRadius: '4px',
                  padding: '1px 6px',
                  letterSpacing: '0.6px',
                  boxShadow: isActive ? `0 0 8px ${haloColor}40` : 'none',
                  transition: 'all 0.15s ease'
                }}>
                  KEY {keyNum}
                </div>

                {/* Heavy-Duty Metal Plunger Assembly */}
                <div style={{
                  position: 'relative',
                  width: '64px',
                  height: '64px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {/* Circular LED Halo Ring */}
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '50%',
                    border: `2.5px solid ${isActive ? haloColor : 'rgba(255, 255, 255, 0.08)'}`,
                    boxShadow: isActive ? `0 0 14px ${haloColor}, inset 0 0 6px ${haloColor}88` : 'none',
                    transition: 'all 0.2s ease'
                  }} />

                  {/* Outer Stainless Steel Beveled Ring */}
                  <div style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '50%',
                    background: 'conic-gradient(from 0deg, #64748b, #cbd5e1, #475569, #cbd5e1, #64748b)',
                    padding: '3px',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.8), inset 0 1px 1px rgba(255,255,255,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {/* Metal Stomp Plunger */}
                    <div style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '50%',
                      background: isActive 
                        ? 'radial-gradient(circle at 35% 35%, #2a3446 0%, #10141c 100%)' 
                        : 'radial-gradient(circle at 35% 35%, #232834 0%, #0d1016 100%)',
                      border: `1px solid ${isActive ? haloColor : 'rgba(255,255,255,0.15)'}`,
                      boxShadow: isActive 
                        ? 'inset 0 2px 4px rgba(0,0,0,0.6)' 
                        : 'inset 0 1px 2px rgba(255,255,255,0.2), 0 2px 4px rgba(0,0,0,0.6)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transform: isActive ? 'translateY(1px)' : 'none',
                      transition: 'transform 0.1s ease'
                    }}>
                      {/* Pocket Master Slot Code on Metal (e.g. P01) */}
                      <span style={{
                        fontFamily: 'var(--font-numbers)',
                        fontWeight: 900,
                        fontSize: '13px',
                        color: isActive ? haloColor : '#cbd5e1',
                        letterSpacing: '0.5px',
                        textShadow: isActive ? `0 0 6px ${haloColor}` : '0 1px 2px rgba(0,0,0,0.8)'
                      }}>
                        {slot}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Preset Name */}
                <div style={{ textAlign: 'center' }}>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: isActive ? '#f8fafc' : '#64748b',
                    maxWidth: '100px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: 'block'
                  }}>
                    {pName}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Step Next 4 */}
        <button
          onClick={handleNextGroup}
          style={{
            background: '#1a1e2a',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: '#cbd5e1',
            borderRadius: '6px',
            width: '32px',
            height: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
          title="Next Presets"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Preset Status Indicator & Shortcut Guide */}
      <div style={{
        fontSize: '10px',
        color: '#64748b',
        textAlign: 'right',
        lineHeight: '1.4',
        minWidth: '120px'
      }}>
        <div style={{ fontWeight: 800, color: '#cbd5e1' }}>
          {isUser ? 'USER PRESETS' : 'FACTORY PRESETS'}
        </div>
        <div>SLOT {isUser ? currentPresetIndex + 1 : currentPresetIndex - 49} / 50</div>
        <div style={{ fontSize: '9px', color: '#64748b', marginTop: '2px', fontFamily: 'var(--font-sans)', fontWeight: 600 }}>
          1-4 Stomp | Up/Down Bank
        </div>
      </div>
    </div>
  );
}
