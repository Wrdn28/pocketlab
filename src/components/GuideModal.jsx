import React, { useState } from 'react';
import { 
  X, 
  Keyboard, 
  HelpCircle, 
  Cpu, 
  Radio, 
  Lock, 
  Sliders, 
  Layers, 
  Usb, 
  Zap,
  CheckCircle2
} from 'lucide-react';

export default function GuideModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('shortcuts'); // 'shortcuts' | 'architecture' | 'hardware'

  if (!isOpen) return null;

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
        width: '740px',
        maxHeight: '88vh',
        background: '#131622',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 24px 50px rgba(0, 0, 0, 0.85)',
        overflow: 'hidden'
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
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              background: '#1c2232',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Keyboard size={16} color="#38bdf8" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '14px', color: '#f8fafc', letterSpacing: '0.3px' }}>
                User Guide &amp; Keyboard Shortcuts
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                Sonicake Pocket Master (QME-20) Studio Desktop Controller
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          gap: '8px',
          padding: '10px 20px',
          background: '#0e111a',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
        }}>
          <button
            onClick={() => setActiveTab('shortcuts')}
            style={{
              background: activeTab === 'shortcuts' ? '#1e2434' : 'transparent',
              border: activeTab === 'shortcuts' ? '1px solid rgba(56, 189, 248, 0.45)' : '1px solid transparent',
              color: activeTab === 'shortcuts' ? '#38bdf8' : '#94a3b8',
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
            <Keyboard size={13} />
            <span>Keyboard Shortcuts</span>
          </button>

          <button
            onClick={() => setActiveTab('architecture')}
            style={{
              background: activeTab === 'architecture' ? '#1e2434' : 'transparent',
              border: activeTab === 'architecture' ? '1px solid rgba(245, 158, 11, 0.45)' : '1px solid transparent',
              color: activeTab === 'architecture' ? '#fbbf24' : '#94a3b8',
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
            <Layers size={13} />
            <span>Signal Chain &amp; NAM A2</span>
          </button>

          <button
            onClick={() => setActiveTab('hardware')}
            style={{
              background: activeTab === 'hardware' ? '#1e2434' : 'transparent',
              border: activeTab === 'hardware' ? '1px solid rgba(16, 185, 129, 0.45)' : '1px solid transparent',
              color: activeTab === 'hardware' ? '#34d399' : '#94a3b8',
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
            <Usb size={13} />
            <span>Hardware &amp; MIDI Connection</span>
          </button>
        </div>

        {/* Content Body */}
        <div style={{
          padding: '18px 22px',
          overflowY: 'auto',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          {activeTab === 'shortcuts' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Section 1: Effect Module Bypass */}
              <div>
                <div style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  color: '#38bdf8',
                  letterSpacing: '0.8px',
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <Zap size={13} />
                  <span>DIRECT EFFECT MODULE BYPASS / ENGAGE</span>
                </div>
                <div style={{
                  background: '#181c2a',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  overflow: 'hidden'
                }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                    <thead>
                      <tr style={{ background: '#141724', color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <th style={{ padding: '8px 12px', textAlign: 'left', width: '90px' }}>Key</th>
                        <th style={{ padding: '8px 12px', textAlign: 'left', width: '100px' }}>Module</th>
                        <th style={{ padding: '8px 12px', textAlign: 'left' }}>Description &amp; Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { key: 'N', mod: 'NR', name: 'Noise Gate', desc: 'Instantly toggles Noise Reduction threshold circuit' },
                        { key: 'X', mod: 'FX1', name: 'Pre-FX / Compressor', desc: 'Toggles Compressor, Boost, or Wah pre-effects' },
                        { key: 'D', mod: 'DRV', name: 'Drive / Distortion', desc: 'Toggles Overdrive, Distortion, or Fuzz pedal' },
                        { key: 'A', mod: 'AMP', name: 'Amp / NAM Clone', desc: 'Toggles Guitar Amp Modeler or Neural Amp Profile' },
                        { key: 'I', mod: 'IR', name: 'Cabinet IR', desc: 'Toggles Cabinet Impulse Response processing' },
                        { key: 'E', mod: 'EQ', name: 'Equalizer', desc: 'Toggles 5-Band Graphic Equalizer circuit' },
                        { key: 'M or C', mod: 'FX2', name: 'Modulation / FX2', desc: 'Toggles Chorus, Flanger, Tremolo, or Phase' },
                        { key: 'L or Y', mod: 'DLY', name: 'Delay', desc: 'Toggles Echo / Digital / Analog Delay repeats' },
                        { key: 'R', mod: 'RVB', name: 'Reverb', desc: 'Toggles Reverb space and ambient reflections' },
                        { key: 'Space', mod: 'ACTIVE', name: 'Active Module', desc: 'Toggles bypass on whichever module is currently selected' },
                        { key: '[ / ]', mod: 'SELECT', name: 'Move Selection', desc: 'Selects previous [ or next ] effect module in chain' }
                      ].map((item, idx) => (
                        <tr 
                          key={idx}
                          style={{
                            borderBottom: idx < 10 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                            background: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.015)'
                          }}
                        >
                          <td style={{ padding: '7px 12px' }}>
                            <span style={{
                              fontFamily: 'monospace',
                              fontWeight: 800,
                              fontSize: '11px',
                              color: '#38bdf8',
                              background: 'rgba(56, 189, 248, 0.12)',
                              border: '1px solid rgba(56, 189, 248, 0.3)',
                              borderRadius: '4px',
                              padding: '2px 7px',
                              display: 'inline-block'
                            }}>
                              {item.key}
                            </span>
                          </td>
                          <td style={{ padding: '7px 12px', fontWeight: 800, color: '#f8fafc' }}>
                            {item.mod}
                          </td>
                          <td style={{ padding: '7px 12px', color: '#cbd5e1' }}>
                            <strong style={{ color: '#f1f5f9' }}>{item.name}</strong> - {item.desc}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section 2: Footswitches & Navigation */}
              <div>
                <div style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  color: '#fbbf24',
                  letterSpacing: '0.8px',
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <Radio size={13} />
                  <span>FOOTSWITCH STOMPS &amp; PRESET NAVIGATION</span>
                </div>
                <div style={{
                  background: '#181c2a',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  overflow: 'hidden'
                }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                    <thead>
                      <tr style={{ background: '#141724', color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <th style={{ padding: '8px 12px', textAlign: 'left', width: '110px' }}>Key</th>
                        <th style={{ padding: '8px 12px', textAlign: 'left', width: '140px' }}>Function</th>
                        <th style={{ padding: '8px 12px', textAlign: 'left' }}>Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { key: '1, 2, 3, 4', func: 'Footswitches 1 - 4', desc: 'Selects preset slot in the active hardware bank group' },
                        { key: 'Left / Right', func: 'Prev / Next Preset', desc: 'Steps through presets sequentially (1 by 1)' },
                        { key: 'Up / Down', func: 'Prev / Next Bank', desc: 'Steps bank group by 4 presets at a time (PageUp / PageDown also work)' },
                        { key: 'B', func: 'Toggle Bank', desc: 'Switches between User Bank (P01-P50) and Factory Bank (F01-F50)' },
                        { key: 'P', func: 'Preset Drawer', desc: 'Opens or closes the full 100-preset library drawer' },
                        { key: 'T', func: 'Chromatic Tuner', desc: 'Opens or closes the studio chromatic tuner needle' },
                        { key: '? or H', func: 'User Guide', desc: 'Opens this keyboard shortcuts and user guide modal' },
                        { key: 'Escape', func: 'Close Dialogs', desc: 'Dismisses any open modal or drawer' }
                      ].map((item, idx) => (
                        <tr 
                          key={idx}
                          style={{
                            borderBottom: idx < 7 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                            background: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.015)'
                          }}
                        >
                          <td style={{ padding: '7px 12px' }}>
                            <span style={{
                              fontFamily: 'monospace',
                              fontWeight: 800,
                              fontSize: '11px',
                              color: '#fbbf24',
                              background: 'rgba(251, 191, 36, 0.12)',
                              border: '1px solid rgba(251, 191, 36, 0.3)',
                              borderRadius: '4px',
                              padding: '2px 7px',
                              display: 'inline-block'
                            }}>
                              {item.key}
                            </span>
                          </td>
                          <td style={{ padding: '7px 12px', fontWeight: 800, color: '#f8fafc' }}>
                            {item.func}
                          </td>
                          <td style={{ padding: '7px 12px', color: '#cbd5e1' }}>
                            {item.desc}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'architecture' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '12px', color: '#cbd5e1', lineHeight: '1.6' }}>
              <div style={{
                background: '#181c2a',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f8fafc', fontWeight: 800, marginBottom: '6px' }}>
                  <Lock size={15} color="#f87171" />
                  <span>Fixed-Core Hardware Architecture (DRV -&gt; AMP -&gt; IR -&gt; EQ)</span>
                </div>
                <p style={{ margin: 0, color: '#94a3b8' }}>
                  The Sonicake Pocket Master pedal features an authentic fixed-core DSP processing pipeline:
                  <strong> DRV -&gt; AMP -&gt; IR -&gt; EQ</strong>. These four core stages are locked in order inside the pedal DSP to maintain zero latency and analog dynamic response.
                  Pre-effects (FX1) and post-effects (FX2, DLY, RVB) can be moved freely across the signal path using the arrow buttons.
                </p>
              </div>

              <div style={{
                background: '#181c2a',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f8fafc', fontWeight: 800, marginBottom: '6px' }}>
                  <Cpu size={15} color="#22d3ee" />
                  <span>Neural Amp Modeler (NAM) Architecture 2 (A2)</span>
                </div>
                <p style={{ margin: '0 0 8px 0', color: '#94a3b8' }}>
                  PocketLab provides native desktop loading and conversion for <strong>Neural Amp Modeler (.nam / .json / .namb)</strong> profiles:
                </p>
                <ul style={{ margin: 0, paddingLeft: '20px', color: '#94a3b8' }}>
                  <li><strong>A2 Architecture:</strong> 23 convolutional layers with reverse-engineered kernel sizes and dilation patterns matching the pedal DSP.</li>
                  <li><strong>5 User Profile Slots:</strong> Store up to 5 custom NAM models directly in physical pedal memory.</li>
                  <li><strong>48 kHz Resampling:</strong> Standard 48 kHz internal processing with automatic r8b sample rate conversion.</li>
                  <li><strong>Full-Rig Protection:</strong> When NAM Clone mode is active, the IR module is automatically bypassed to avoid duplicate cabinet filtering.</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'hardware' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '12px', color: '#cbd5e1', lineHeight: '1.6' }}>
              <div style={{
                background: '#181c2a',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                gap: '16px',
                alignItems: 'center'
              }}>
                <img 
                  src="/pocket_master_device.png" 
                  alt="Sonicake Pocket Master"
                  style={{
                    maxHeight: '100px',
                    width: 'auto',
                    objectFit: 'contain',
                    filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.85))'
                  }}
                />
                <div>
                  <div style={{ fontWeight: 800, color: '#f8fafc', fontSize: '14px', marginBottom: '4px' }}>
                    Sonicake Pocket Master (QME-20)
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: '11px', lineHeight: '1.5' }}>
                    100 Presets (50 User P01-P50 &amp; 50 Factory F01-F50)<br />
                    Class-Compliant USB MIDI &amp; Bluetooth LE Audio Processor<br />
                    Standard MIDI SysEx Control Protocol (0x0409 / 0x0113)
                  </div>
                </div>
              </div>

              <div style={{
                background: '#181c2a',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}>
                <div style={{ fontWeight: 800, color: '#f8fafc', marginBottom: '8px' }}>
                  Connection Instructions:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', color: '#94a3b8' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle2 size={13} color="#10b981" />
                    <span><strong>USB MIDI:</strong> Connect via USB-C data cable. Class-compliant driver (no drivers required on Windows, Linux, or macOS).</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle2 size={13} color="#10b981" />
                    <span><strong>Bluetooth LE:</strong> Enable Bluetooth on PC and pedal. Click Connect -&gt; Bluetooth -&gt; Scan.</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle2 size={13} color="#10b981" />
                    <span><strong>DAW Conflict Note:</strong> On Windows, close any DAW holding the Pocket Master MIDI port before connecting.</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#161a28'
        }}>
          <div style={{ fontSize: '11px', color: '#64748b' }}>
            Press <kbd style={{ background: '#1c2232', padding: '1px 5px', borderRadius: '3px', color: '#cbd5e1' }}>?</kbd> anytime to open this guide. Press <kbd style={{ background: '#1c2232', padding: '1px 5px', borderRadius: '3px', color: '#cbd5e1' }}>Esc</kbd> to close.
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#242a3a',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#f8fafc',
              borderRadius: '6px',
              padding: '6px 18px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
