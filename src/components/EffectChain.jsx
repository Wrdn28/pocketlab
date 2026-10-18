import React from 'react';
import { Power, ArrowLeft, ArrowRight, Check, Volume2, Lock, Zap } from 'lucide-react';
import { FIXED_CORE_MODULES } from '../services/pocketMasterProtocol';
import { getGp200ChainIcon } from '../services/gp200Assets';

export const MODULE_SHORTCUT_KEYS = {
  NR: 'N',
  FX1: 'X',
  DRV: 'D',
  DST: 'D',
  AMP: 'A',
  Clone: 'A',
  IR: 'I',
  CAB: 'I',
  EQ: 'E',
  FX2: 'M',
  MOD: 'M',
  DLY: 'L',
  RVB: 'R'
};

export default function EffectChain({
  modules,
  selectedModuleIndex,
  onSelectModule,
  onToggleModuleBypass,
  onMoveModule,
  patchVolume = 75,
  onChangePatchVolume,
  ampMode = 'Normal',
  onAttemptIrWhileNam
}) {
  const isCloneActive = ampMode === 'Clone';

  return (
    <div style={{
      margin: '0 16px 12px 16px',
      padding: '12px 18px',
      background: 'linear-gradient(180deg, rgba(20, 24, 34, 0.95) 0%, rgba(12, 14, 20, 0.98) 100%)',
      borderRadius: '14px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.7), inset 0 1px 1px rgba(255, 255, 255, 0.12)',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px'
    }}>
      {/* Chain Header & Patch Volume Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        paddingBottom: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11px', fontWeight: 900, color: '#f1f5f9', letterSpacing: '1.2px' }}>
            SIGNAL ROUTING CHAIN
          </span>

          {isCloneActive && (
            <span style={{
              fontSize: '10px',
              background: '#151f2e',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              color: '#38bdf8',
              padding: '2px 8px',
              borderRadius: '4px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <Zap size={10} /> NAM RIG ACTIVE (IR LOCKED)
            </span>
          )}
        </div>

        {/* Hardware-styled Patch Volume Fader */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: 'rgba(0, 0, 0, 0.45)',
          border: '1px solid rgba(245, 158, 11, 0.35)',
          borderRadius: '8px',
          padding: '4px 12px',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.6)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Volume2 size={14} color="var(--accent-amber)" />
            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--accent-amber)', letterSpacing: '0.5px' }}>
              PRESET VOL
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={patchVolume}
            onChange={(e) => onChangePatchVolume && onChangePatchVolume(Number(e.target.value))}
            style={{
              width: '120px',
              accentColor: 'var(--accent-amber)',
              cursor: 'pointer'
            }}
          />
          <span style={{
            fontSize: '12px',
            fontWeight: 800,
            fontFamily: 'var(--font-numbers)',
            color: '#f8fafc',
            minWidth: '28px',
            textAlign: 'right'
          }}>
            {patchVolume}
          </span>
        </div>
      </div>

      {/* Main Horizontal Scrollable Signal Path */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        overflowX: 'auto',
        padding: '6px 2px 8px 2px'
      }}>
        {/* INPUT JACK */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px',
          padding: '8px 10px',
          background: 'radial-gradient(circle at 40% 40%, #2a2e3d, #12141a)',
          borderRadius: '8px',
          border: '1px solid #475569',
          boxShadow: '0 4px 10px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.2)',
          flexShrink: 0
        }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#64748b', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.9), 0 0 4px #06b6d4' }} />
          <span style={{ fontSize: '9px', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.5px' }}>INPUT</span>
        </div>

        {modules.map((mod, idx) => {
          const isSelected = selectedModuleIndex === idx;
          const currentFx = mod.effects[mod.currentFxIndex] || mod.effects[0] || {};
          const isFixedCore = FIXED_CORE_MODULES.includes(mod.name);
          const isIr = mod.name === 'IR' || mod.name === 'CAB' || mod.moduleId === 4;
          const isAmp = mod.name === 'AMP' || mod.name === 'Clone' || mod.moduleId === 3 || mod.moduleId === 9;
          const isIrLockedByNam = isIr && isCloneActive;
          const isEnabled = isIrLockedByNam ? false : mod.enabled;

          // Find whether this module is within the fixed core group
          const prevMod = modules[idx - 1];
          const nextMod = modules[idx + 1];
          const isFixedStart = isFixedCore && (!prevMod || !FIXED_CORE_MODULES.includes(prevMod.name));
          const isFixedEnd = isFixedCore && (!nextMod || !FIXED_CORE_MODULES.includes(nextMod.name));

          const iconSrc = getGp200ChainIcon(mod.name, isEnabled, isSelected);

          return (
            <React.Fragment key={mod.name + idx}>
              {/* Connector Audio Line with Flow Glow */}
              <div style={{
                width: '14px',
                height: '4px',
                background: isEnabled ? 'linear-gradient(90deg, #06b6d4, #f59e0b)' : '#2b3142',
                borderRadius: '2px',
                boxShadow: isEnabled ? '0 0 8px rgba(6, 182, 212, 0.7)' : 'none',
                flexShrink: 0,
                transition: 'all 0.2s ease'
              }} />

              {/* Pedal Block Card */}
              <div 
                className={`gp200-chain-block ${isSelected ? 'selected' : ''} ${!isEnabled ? 'bypassed' : ''}`}
                onClick={() => onSelectModule(idx)}
                style={{
                  borderLeft: isFixedStart ? '1px dashed rgba(239, 68, 68, 0.6)' : undefined,
                  borderRight: isFixedEnd ? '1px dashed rgba(239, 68, 68, 0.6)' : undefined,
                  opacity: isIrLockedByNam ? 0.65 : 1
                }}
              >
                {/* Module Code Header & Bypass Toggle */}
                <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <div className={`led ${isEnabled ? (isAmp && isCloneActive ? 'led-cyan' : 'led-amber') : ''}`} style={{ width: '7px', height: '7px' }} />
                    <span style={{ 
                      fontSize: '10px', 
                      fontWeight: 900, 
                      color: isEnabled ? '#f8fafc' : '#64748b',
                      letterSpacing: '0.5px'
                    }}>
                      {isAmp && isCloneActive ? 'NAM' : mod.name}
                    </span>
                    {isFixedCore && (
                      <Lock size={9} color="#f87171" title="Fixed Core Block" />
                    )}
                  </div>

                  {isIrLockedByNam ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onAttemptIrWhileNam) onAttemptIrWhileNam();
                      }}
                      style={{
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid rgba(239, 68, 68, 0.4)',
                        borderRadius: '50%',
                        width: '18px',
                        height: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'not-allowed',
                        color: '#f87171'
                      }}
                      title="IR locked: NAM Amp profile already includes cabinet response"
                    >
                      <Lock size={9} />
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleModuleBypass(idx);
                      }}
                      style={{
                        background: isEnabled ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${isEnabled ? 'rgba(245, 158, 11, 0.5)' : '#475569'}`,
                        borderRadius: '50%',
                        width: '18px',
                        height: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: isEnabled ? 'var(--accent-amber)' : '#64748b',
                        transition: 'all 0.15s ease'
                      }}
                      title={isEnabled ? 'Bypass Module' : 'Enable Module'}
                    >
                      <Power size={10} />
                    </button>
                  )}
                </div>

                {/* Chain Module Icon Image */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  margin: '2px 0'
                }}>
                  <img
                    src={iconSrc}
                    alt={mod.name}
                    style={{
                      width: '48px',
                      height: '48px',
                      objectFit: 'contain',
                      filter: isEnabled 
                        ? (isSelected ? 'drop-shadow(0 0 8px rgba(245, 158, 11, 0.75))' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.6))')
                        : 'grayscale(0.85) opacity(0.35)',
                      transition: 'all 0.2s ease'
                    }}
                  />
                  {isAmp && isCloneActive && (
                    <span style={{
                      position: 'absolute',
                      bottom: '-4px',
                      background: 'linear-gradient(90deg, #06b6d4, #ec4899)',
                      color: '#ffffff',
                      fontSize: '8px',
                      fontWeight: 900,
                      padding: '1px 5px',
                      borderRadius: '4px',
                      boxShadow: '0 0 8px rgba(6, 182, 212, 0.8)',
                      letterSpacing: '0.5px'
                    }}>
                      NAM A2
                    </span>
                  )}
                </div>

                {/* Effect Model Name */}
                <div style={{ textAlign: 'center', width: '100%', padding: '0 4px' }}>
                  <div style={{ 
                    fontSize: '11px', 
                    fontWeight: 800, 
                    color: isEnabled ? (isAmp && isCloneActive ? '#38bdf8' : (mod.color || '#f8fafc')) : (isIrLockedByNam ? '#ef4444' : '#64748b'),
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    letterSpacing: '0.2px'
                  }}>
                    {isIrLockedByNam ? 'CAB Locked' : (currentFx.name || mod.name)}
                  </div>
                </div>

                {/* Footer: Reorder Controls or Locked Core Badge */}
                <div style={{ 
                  width: '100%',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  borderTop: '1px solid rgba(255,255,255,0.06)',
                  paddingTop: '2px'
                }}>
                  {!isFixedCore ? (
                    <div style={{ display: 'flex', gap: '3px' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onMoveModule(mod.name, -1);
                        }}
                        style={{
                          background: 'rgba(255,255,255,0.06)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '3px',
                          color: '#cbd5e1',
                          padding: '1px 5px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                        title="Move Left"
                      >
                        <ArrowLeft size={9} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onMoveModule(mod.name, 1);
                        }}
                        style={{
                          background: 'rgba(255,255,255,0.06)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '3px',
                          color: '#cbd5e1',
                          padding: '1px 5px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                        title="Move Right"
                      >
                        <ArrowRight size={9} />
                      </button>
                    </div>
                  ) : (
                    <span style={{ fontSize: '8px', color: '#64748b', fontWeight: 700, letterSpacing: '0.5px' }}>
                      CORE LOCKED
                    </span>
                  )}
                </div>
              </div>
            </React.Fragment>
          );
        })}

        {/* OUTPUT JACK */}
        <div style={{
          width: '14px',
          height: '4px',
          background: '#2b3142',
          borderRadius: '2px',
          flexShrink: 0
        }} />

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px',
          padding: '8px 10px',
          background: 'radial-gradient(circle at 40% 40%, #2a2e3d, #12141a)',
          borderRadius: '8px',
          border: '1px solid #475569',
          boxShadow: '0 4px 10px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.2)',
          flexShrink: 0
        }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#64748b', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.9), 0 0 4px #f59e0b' }} />
          <span style={{ fontSize: '9px', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.5px' }}>OUTPUT</span>
        </div>
      </div>
    </div>
  );
}
