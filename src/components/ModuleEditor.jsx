import React, { useState, useRef, useEffect } from 'react';
import { Power, RotateCcw, Info, Sparkles, ChevronDown, Lock, Upload, Zap, Cpu, Activity, CheckCircle2, AlertTriangle, X, Radio, Check } from 'lucide-react';
import { parseNamModel } from '../services/namModelParser';

export default function ModuleEditor({
  module,
  onUpdateParam,
  onSelectEffectModel,
  onToggleBypass,
  ampMode = 'Normal',
  onToggleAmpMode,
  cloneAmpNames = ['User Profile 1', 'User Profile 2', 'User Profile 3', 'User Profile 4', 'User Profile 5'],
  cloneAmpMetadata = {},
  onImportNam,
  userIrNames = ['User IR 1', 'User IR 2', 'User IR 3', 'User IR 4', 'User IR 5'],
  onImportIr
}) {
  if (!module) return null;

  const namFileInputRef = useRef(null);
  const irFileInputRef = useRef(null);
  const dropdownRef = useRef(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [showModelDetails, setShowModelDetails] = useState(false);
  const [isProcessingNam, setIsProcessingNam] = useState(false);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    }
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  useEffect(() => {
    setIsDropdownOpen(false);
  }, [module.moduleId, module.name]);

  const isAmp = module.name === 'AMP' || module.name === 'Clone' || module.moduleId === 3 || module.moduleId === 9;
  const isIr = module.name === 'IR' || module.name === 'CAB' || module.moduleId === 4;
  const isCloneMode = isAmp && ampMode === 'Clone';
  const isIrLockedByNam = isIr && ampMode === 'Clone';

  const currentFx = module.effects[module.currentFxIndex] || module.effects[0] || {};
  const algorithms = currentFx.alg || [];
  const activeSlotIndex = (currentFx.fxid >= 901 && currentFx.fxid <= 905) ? currentFx.fxid - 901 : 0;
  const activeNamMeta = isCloneMode ? cloneAmpMetadata[activeSlotIndex] : null;


  const processNamFile = async (file) => {
    if (!file) return;
    setIsProcessingNam(true);
    try {
      const parsed = await parseNamModel(file);
      if (!parsed.isValid) {
        alert(`Failed to load NAM model: ${parsed.warnings.join(', ') || 'Invalid file format'}`);
        return;
      }
      if (onImportNam) {
        onImportNam(activeSlotIndex, parsed, file);
      }
    } catch (err) {
      console.error('Error importing NAM file:', err);
      alert(`Error processing NAM model: ${err.message}`);
    } finally {
      setIsProcessingNam(false);
    }
  };

  const handleNamFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) processNamFile(file);
    e.target.value = '';
  };

  const handleDragOver = (e) => {
    if (!isCloneMode) return;
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = () => {
    setIsDraggingOver(false);
  };

  const handleDrop = (e) => {
    if (!isCloneMode) return;
    e.preventDefault();
    setIsDraggingOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processNamFile(file);
  };

  const handleIrFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const cleanName = file.name.replace(/\.[^/.]+$/, '').slice(0, 10);
    const activeSlot = (currentFx.fxid >= 416 && currentFx.fxid <= 420) ? currentFx.fxid - 416 : 0;
    if (onImportIr) {
      onImportIr(activeSlot, cleanName, file);
    }
    e.target.value = '';
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        margin: '0 16px',
        padding: '16px 22px',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        overflowY: 'auto',
        position: 'relative',
        transition: 'all 0.2s ease',
        background: 'linear-gradient(180deg, rgba(25, 30, 42, 0.94) 0%, rgba(14, 17, 24, 0.97) 100%)',
        borderRadius: '14px',
        border: isDraggingOver ? '2px dashed #06b6d4' : '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 10px 30px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.12)'
      }}
    >
      {/* Drag & Drop Visual Overlay */}
      {isDraggingOver && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(11, 15, 25, 0.92)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          zIndex: 50,
          borderRadius: '12px',
          pointerEvents: 'none',
          border: '2px solid #06b6d4'
        }}>
          <Zap size={48} color="#06b6d4" />
          <div style={{ fontSize: '18px', fontWeight: 900, color: '#f8fafc', letterSpacing: '0.8px' }}>
            DROP FILE MODEL NAM A2 DI SINI
          </div>
          <div style={{ fontSize: '13px', color: '#94a3b8' }}>
            Mendukung .nam, .json, dan .namb (NAM V1 &amp; NAM V2 Architecture 2)
          </div>
        </div>
      )}

      {/* Hidden file inputs for NAM and IR imports */}
      <input
        type="file"
        ref={namFileInputRef}
        accept=".nam,.json,.namb"
        style={{ display: 'none' }}
        onChange={handleNamFileChange}
      />
      <input
        type="file"
        ref={irFileInputRef}
        accept=".wav"
        style={{ display: 'none' }}
        onChange={handleIrFileChange}
      />

      {/* Editor Top Bar: Module Type, Model Selector, Mode Toggle, Bypass */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        paddingBottom: '14px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          {/* Module Code Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(0,0,0,0.4)',
            padding: '5px 12px',
            borderRadius: '6px',
            border: '1px solid rgba(255,255,255,0.08)'
          }}>
            <span style={{
              fontFamily: 'var(--font-display)',
              fontSize: '15px',
              fontWeight: 900,
              color: isIrLockedByNam ? '#64748b' : (module.color || '#f8fafc'),
              letterSpacing: '0.8px'
            }}>
              {module.name} - {isCloneMode ? 'NAM Neural Amp' : module.label}
            </span>
          </div>

          {/* AMP Mode Switcher Toggle (Factory Amp vs NAM Clone) */}
          {isAmp && onToggleAmpMode && (
            <div style={{
              display: 'flex',
              background: '#0a0d14',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '6px',
              padding: '2px',
              gap: '2px'
            }}>
              <button
                onClick={() => onToggleAmpMode('Normal')}
                style={{
                  background: !isCloneMode ? '#1e2434' : 'transparent',
                  border: !isCloneMode ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid transparent',
                  color: !isCloneMode ? '#f8fafc' : '#94a3b8',
                  borderRadius: '4px',
                  padding: '5px 12px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                FACTORY AMPS
              </button>
              <button
                onClick={() => onToggleAmpMode('Clone')}
                style={{
                  background: isCloneMode ? '#1e2434' : 'transparent',
                  border: isCloneMode ? '1px solid rgba(56, 189, 248, 0.5)' : '1px solid transparent',
                  color: isCloneMode ? '#38bdf8' : '#94a3b8',
                  borderRadius: '4px',
                  padding: '5px 12px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  transition: 'all 0.15s ease'
                }}
              >
                <Zap size={12} />
                <span>CLONE NAM (A2)</span>
              </button>
            </div>
          )}

          {/* Model Selector Custom Dropdown */}
          {(() => {
            let currentDisplayName = currentFx.name || 'Select Model';
            if (isCloneMode && currentFx.fxid >= 901 && currentFx.fxid <= 905) {
              const sIdx = currentFx.fxid - 901;
              currentDisplayName = cloneAmpNames[sIdx] || currentFx.name;
            } else if (isIr && currentFx.fxid >= 416 && currentFx.fxid <= 420) {
              const sIdx = currentFx.fxid - 416;
              currentDisplayName = userIrNames[sIdx] || currentFx.name;
            }

            return (
              <div ref={dropdownRef} style={{ position: 'relative' }}>
                <button
                  type="button"
                  disabled={isIrLockedByNam}
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  style={{
                    background: isIrLockedByNam ? '#0b0f19' : '#141824',
                    border: `1px solid ${isDropdownOpen ? '#06b6d4' : (isIrLockedByNam ? '#334155' : 'rgba(255, 255, 255, 0.18)')}`,
                    color: isIrLockedByNam ? '#64748b' : '#ffffff',
                    borderRadius: '6px',
                    padding: '6px 14px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: isIrLockedByNam ? 'not-allowed' : 'pointer',
                    minWidth: '220px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                    boxShadow: isDropdownOpen ? '0 0 10px rgba(6, 182, 212, 0.2)' : '0 4px 10px rgba(0,0,0,0.4)',
                    opacity: isIrLockedByNam ? 0.6 : 1,
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    textAlign: 'left'
                  }}>
                    {currentDisplayName}
                  </span>
                  <ChevronDown
                    size={14}
                    style={{
                      color: isIrLockedByNam ? '#475569' : '#94a3b8',
                      transform: isDropdownOpen ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.15s ease',
                      flexShrink: 0
                    }}
                  />
                </button>

                {/* Custom Studio Dropdown Menu */}
                {isDropdownOpen && !isIrLockedByNam && (
                  <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 4px)',
                    left: 0,
                    minWidth: '240px',
                    maxHeight: '260px',
                    overflowY: 'auto',
                    background: '#131622',
                    border: '1px solid #2a3449',
                    borderRadius: '8px',
                    boxShadow: '0 16px 40px rgba(0, 0, 0, 0.95)',
                    zIndex: 200,
                    padding: '4px'
                  }}>
                    {module.effects.map((fx, i) => {
                      let displayName = fx.name;
                      if (isCloneMode && fx.fxid >= 901 && fx.fxid <= 905) {
                        const sIdx = fx.fxid - 901;
                        displayName = cloneAmpNames[sIdx] || fx.name;
                      } else if (isIr && fx.fxid >= 416 && fx.fxid <= 420) {
                        const sIdx = fx.fxid - 416;
                        displayName = userIrNames[sIdx] || fx.name;
                      }
                      const isSelected = i === module.currentFxIndex;

                      return (
                        <div
                          key={fx.fxid || i}
                          onClick={() => {
                            onSelectEffectModel(i);
                            setIsDropdownOpen(false);
                          }}
                          style={{
                            padding: '7px 10px',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '8px',
                            background: isSelected ? 'rgba(6, 182, 212, 0.16)' : 'transparent',
                            color: isSelected ? '#67e8f9' : '#cbd5e1',
                            fontSize: '12px',
                            fontWeight: isSelected ? 700 : 500,
                            transition: 'background 0.1s ease'
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.background = '#1c2233';
                              e.currentTarget.style.color = '#ffffff';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.background = 'transparent';
                              e.currentTarget.style.color = '#cbd5e1';
                            }
                          }}
                        >
                          <span style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {displayName}
                          </span>
                          {isSelected && (
                            <Check size={14} color="#06b6d4" style={{ flexShrink: 0 }} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}

          {/* NAM V2 / Architecture 2 Badge with Details Trigger */}
          {isCloneMode && activeNamMeta && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'linear-gradient(90deg, rgba(6, 182, 212, 0.2) 0%, rgba(236, 72, 153, 0.2) 100%)',
              border: '1px solid rgba(6, 182, 212, 0.5)',
              borderRadius: '8px',
              padding: '4px 10px'
            }}>
              <Activity size={13} color="#22d3ee" />
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#f8fafc' }}>
                {activeNamMeta.variant}
              </span>
              <button
                onClick={() => setShowModelDetails(!showModelDetails)}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#22d3ee',
                  borderRadius: '4px',
                  padding: '2px 6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                  fontSize: '9px',
                  fontWeight: 800
                }}
                title="View NAM A2 model architecture specifications"
              >
                <Info size={10} />
                <span>{showModelDetails ? 'CLOSE' : 'A2 SPEC'}</span>
              </button>
            </div>
          )}

          {/* Import NAM Button */}
          {isCloneMode && (
            <button
              onClick={() => namFileInputRef.current?.click()}
              disabled={isProcessingNam}
              style={{
                background: '#1a1e2a',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#e2e8f0',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: isProcessingNam ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              title="Import Neural Amp Modeler (.nam / .json / .namb) A2 model to active slot"
            >
              <Upload size={13} />
              <span>{isProcessingNam ? 'IMPORTING...' : 'IMPORT NAM (V1 / A2)'}</span>
            </button>
          )}

          {/* Import IR Button */}
          {isIr && !isIrLockedByNam && (
            <button
              onClick={() => irFileInputRef.current?.click()}
              style={{
                background: '#1a1e2a',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#e2e8f0',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              title="Import cabinet Impulse Response (.wav) to User IR slot"
            >
              <Upload size={13} />
              <span>IMPORT IR (.wav)</span>
            </button>
          )}
        </div>

        {/* Origin / Inspiring Hardware Tag & Bypass Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {currentFx.origin && !isCloneMode && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(0, 0, 0, 0.4)',
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '11px',
              color: '#94a3b8',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              <Info size={12} color="#94a3b8" />
              <span>Origin: <strong style={{ color: '#f1f5f9' }}>{currentFx.origin.replace(/\nAmpero.*/, '')}</strong></span>
            </div>
          )}

          {/* Bypass button (or Locked badge if IR is disabled by NAM) */}
          {isIrLockedByNam ? (
            <div style={{
              background: '#181216',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#f87171',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '11px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <Lock size={13} />
              <span>LOCKED (NAM RIG ACTIVE)</span>
            </div>
          ) : (
            <button
              onClick={onToggleBypass}
              style={{
                background: module.enabled ? '#1e2434' : '#141720',
                border: module.enabled ? '1px solid rgba(56, 189, 248, 0.5)' : '1px solid rgba(255, 255, 255, 0.12)',
                color: module.enabled ? '#38bdf8' : '#94a3b8',
                borderRadius: '6px',
                padding: '6px 14px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease'
              }}
            >
              <Power size={13} />
              <span>{module.enabled ? 'ACTIVE' : 'BYPASS'}</span>
            </button>
          )}
        </div>
      </div>

      {/* NAM A2 SPECIFICATION & DIAGNOSTICS CARD */}
      {isCloneMode && showModelDetails && activeNamMeta && (
        <div style={{
          background: 'rgba(10, 15, 26, 0.96)',
          border: '1px solid rgba(6, 182, 212, 0.4)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
          borderRadius: '10px',
          padding: '14px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Cpu size={16} color="#22d3ee" />
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#f8fafc', letterSpacing: '0.5px' }}>
                NAM A2 ARCHITECTURE SPECIFICATIONS (SLOT {activeSlotIndex + 1})
              </span>
              <span style={{
                background: 'rgba(6, 182, 212, 0.2)',
                color: '#22d3ee',
                padding: '2px 8px',
                borderRadius: '6px',
                fontSize: '10px',
                fontWeight: 800
              }}>
                {activeNamMeta.variant}
              </span>
            </div>
            <button
              onClick={() => setShowModelDetails(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '4px'
              }}
            >
              <X size={15} />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', fontSize: '11px' }}>
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ color: '#94a3b8', marginBottom: '2px' }}>Model &amp; Gear Name</div>
              <div style={{ fontWeight: 700, color: '#e2e8f0', fontSize: '12px' }}>{activeNamMeta.gearName}</div>
              {activeNamMeta.author && (
                <div style={{ color: '#64748b', fontSize: '10px', marginTop: '2px' }}>Modeled by: {activeNamMeta.author}</div>
              )}
            </div>

            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ color: '#94a3b8', marginBottom: '2px' }}>Neural DSP Architecture</div>
              <div style={{ fontWeight: 700, color: '#22d3ee' }}>
                {activeNamMeta.architecture} | 23 Layers (3 Blocks)
              </div>
              <div style={{ color: '#64748b', fontSize: '10px', marginTop: '2px' }}>
                Channels: {activeNamMeta.channels} (Bottleneck: {activeNamMeta.channels})
              </div>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ color: '#94a3b8', marginBottom: '2px' }}>Activation &amp; Execution</div>
              <div style={{ fontWeight: 700, color: '#e2e8f0' }}>
                {activeNamMeta.activation} (LUT Fast Activation)
              </div>
              <div style={{ color: '#64748b', fontSize: '10px', marginTop: '2px' }}>
                Gating: None (Optimized Low Latency)
              </div>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ color: '#94a3b8', marginBottom: '2px' }}>Hardware DSP Compatibility</div>
              <div style={{ fontWeight: 700, color: '#10b981' }}>
                Pocket Master (v{activeNamMeta.normalizedVersion || '0.7.0'})
              </div>
              <div style={{ color: '#64748b', fontSize: '10px', marginTop: '2px' }}>
                {activeNamMeta.sampleRate}Hz | {activeNamMeta.weightsCount ? `${activeNamMeta.weightsCount.toLocaleString()} weights` : 'Compiled'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SPECIAL NOTICE WHEN IR IS LOCKED BY NAM */}
      {isIrLockedByNam && (
        <div style={{
          background: 'linear-gradient(90deg, rgba(239, 68, 68, 0.15) 0%, rgba(20, 24, 33, 0.8) 100%)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          borderRadius: '10px',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Lock size={16} color="#f87171" />
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#fca5a5', letterSpacing: '0.5px' }}>
              IR CABINET BYPASSED: NAM AMP ACTIVE
            </div>
            <div style={{ fontSize: '11px', color: '#cbd5e1', lineHeight: '1.4', marginTop: '2px' }}>
              Per Sonicake Pocket Master hardware architecture, the IR module is automatically bypassed when NAM Clone is active because the NAM profile provides a full-rig capture with integrated cabinet response.
            </div>
          </div>
        </div>
      )}




      {/* Rotary Knobs Area */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: '32px',
        padding: '24px 16px',
        background: 'radial-gradient(ellipse at center, rgba(28, 33, 46, 0.8) 0%, rgba(10, 12, 18, 0.96) 100%)',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        minHeight: '200px',
        boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.8)',
        opacity: isIrLockedByNam ? 0.35 : 1,
        pointerEvents: isIrLockedByNam ? 'none' : 'auto',
        transition: 'opacity 0.2s ease'
      }}>
        {algorithms.length === 0 ? (
          <div style={{ color: '#64748b', fontSize: '12px', textAlign: 'center' }}>
            No adjustable parameters available for this model.
          </div>
        ) : (
          algorithms.map((param, pIdx) => {
            const minVal = parseFloat(param.min) || 0;
            const maxVal = parseFloat(param.max) || 100;
            const currentVal = param.value !== undefined ? parseFloat(param.value) : (parseFloat(param.defaultValue) || 50);

            return (
              <KnobControl
                key={param.algId !== undefined ? param.algId : pIdx}
                name={param.name}
                min={minVal}
                max={maxVal}
                step={parseFloat(param.step) || 1}
                value={currentVal}
                unit={param.unit || ''}
                color={isCloneMode ? '#ec4899' : (module.color || '#f59e0b')}
                onChange={(newVal) => onUpdateParam(pIdx, newVal)}
              />
            );
          })
        )}
      </div>
    </div>
  );
}

// Tactile Knurled Rotary Knob with Circular LED Arc
function KnobControl({ name, min, max, step, value, unit, color, onChange }) {
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startVal, setStartVal] = useState(value);

  const range = max - min;
  const pct = Math.max(0, Math.min(1, (value - min) / (range || 1)));
  const angle = -135 + pct * 270;

  // Arc path parameters for SVG ring
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  // Arc spans 270 degrees out of 360 (0.75 of circle)
  const maxStroke = circumference * 0.75;
  const strokeDashoffset = maxStroke - (pct * maxStroke);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartY(e.clientY);
    setStartVal(value);

    const handleMouseMove = (moveEvent) => {
      const deltaY = startY - moveEvent.clientY;
      const sensitivity = 0.5;
      const stepChange = (deltaY * sensitivity * (range / 100));
      let nextVal = startVal + stepChange;
      nextVal = Math.round(nextVal / step) * step;
      nextVal = Math.max(min, Math.min(max, nextVal));
      onChange(nextVal);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const dir = e.deltaY < 0 ? 1 : -1;
    let nextVal = value + dir * step;
    nextVal = Math.max(min, Math.min(max, nextVal));
    onChange(nextVal);
  };

  return (
    <div 
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        width: '84px',
        userSelect: 'none'
      }}
      onWheel={handleWheel}
    >
      {/* Rotary Knob Container with SVG Circular Arc */}
      <div 
        onMouseDown={handleMouseDown}
        style={{
          position: 'relative',
          width: '68px',
          height: '68px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'ns-resize'
        }}
      >
        {/* Glowing Circular LED Arc */}
        <svg 
          width="68" 
          height="68" 
          viewBox="0 0 68 68"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            transform: 'rotate(135deg)',
            pointerEvents: 'none'
          }}
        >
          {/* Background Track */}
          <circle
            cx="34"
            cy="34"
            r={radius}
            fill="none"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth="3.5"
            strokeDasharray={`${maxStroke} ${circumference}`}
            strokeLinecap="round"
          />
          {/* Active Level Arc */}
          <circle
            cx="34"
            cy="34"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="3.5"
            strokeDasharray={`${maxStroke} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              filter: `drop-shadow(0 0 4px ${color})`,
              transition: isDragging ? 'none' : 'stroke-dashoffset 0.1s ease'
            }}
          />
        </svg>

        {/* Hardware Brushed Knurled Knob Cap */}
        <div style={{
          width: '46px',
          height: '46px',
          borderRadius: '50%',
          background: 'linear-gradient(145deg, #2b303d 0%, #151821 100%)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: isDragging 
            ? `0 0 16px ${color}66, 0 4px 12px rgba(0,0,0,0.8)` 
            : '0 4px 10px rgba(0,0,0,0.7), inset 0 1px 1px rgba(255,255,255,0.25)',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {/* Rotating Tick Pointer Indicator */}
          <div 
            style={{ 
              position: 'absolute',
              top: '4px',
              left: 'calc(50% - 1.5px)',
              width: '3px',
              height: '8px',
              borderRadius: '2px',
              backgroundColor: color,
              boxShadow: `0 0 6px ${color}`,
              transform: `rotate(${angle}deg)`,
              transformOrigin: '50% 19px',
              transition: isDragging ? 'none' : 'transform 0.1s ease'
            }} 
          />

          {/* Center Bevel Cap */}
          <div style={{
            width: '26px',
            height: '26px',
            borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 35%, #353b4b 0%, #0e1117 100%)',
            boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.2), 0 1px 2px rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '9px',
            fontWeight: 800,
            fontFamily: 'var(--font-numbers)',
            color: '#e2e8f0'
          }}>
            {Math.round(value)}
          </div>
        </div>
      </div>

      {/* Knob Label & Value */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ 
          fontSize: '11px', 
          fontWeight: 800, 
          color: '#cbd5e1', 
          letterSpacing: '0.5px',
          textTransform: 'uppercase'
        }}>
          {name}
        </div>
        <div style={{ 
          fontFamily: 'var(--font-numbers)', 
          fontSize: '10px', 
          color: color, 
          fontWeight: 700,
          marginTop: '1px'
        }}>
          {value}{unit}
        </div>
      </div>
    </div>
  );
}
