import React, { useState, useEffect } from 'react';
import { 
  Bluetooth, 
  RefreshCw, 
  X, 
  AlertCircle, 
  Laptop, 
  Radio, 
  Usb, 
  CheckCircle2,
  Cpu
} from 'lucide-react';
import { bleService } from '../services/bleService';
import { midiService } from '../services/midiService';

export default function DeviceSearchModal({
  isOpen,
  onClose,
  currentDevice,
  connectionStatus,
  onConnected
}) {
  const [activeTab, setActiveTab] = useState('usb'); // 'usb' or 'bluetooth'
  const [isScanning, setIsScanning] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [usbDevices, setUsbDevices] = useState([]);
  const [isCheckingUsb, setIsCheckingUsb] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadUsbDevices();
    }
  }, [isOpen]);

  const loadUsbDevices = async () => {
    setIsCheckingUsb(true);
    try {
      const devices = await midiService.detectUsbDevices();
      setUsbDevices(devices || []);
    } catch (e) {
      console.warn('Failed to detect USB MIDI:', e);
    } finally {
      setIsCheckingUsb(false);
    }
  };

  if (!isOpen) return null;

  const handleConnectUsbDevice = (devicePair) => {
    const success = midiService.connectUsb(devicePair);
    if (success) {
      onConnected({
        name: devicePair.name,
        type: 'usb',
        simulated: false
      });
      onClose();
    } else {
      setErrorMsg('Failed to connect to USB MIDI port.');
    }
  };

  const handleStartBleScan = async () => {
    setIsScanning(true);
    setErrorMsg(null);

    const res = await bleService.scanAndConnect();
    setIsScanning(false);
    if (res.success) {
      onConnected(res);
      onClose();
    } else {
      setErrorMsg(res.message || 'Unable to detect device. Please check Bluetooth connection.');
    }
  };

  const handleConnectSimulated = () => {
    const res = bleService.connectSimulated(currentDevice.name);
    onConnected(res);
    onClose();
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
        width: '700px',
        maxHeight: '90vh',
        overflowY: 'auto',
        background: '#131622',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '10px',
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
              <Usb size={15} color="#38bdf8" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '14px', color: '#f8fafc', letterSpacing: '0.3px' }}>
                Connect Device
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                Sonicake Pocket Master (USB & Bluetooth)
              </div>
            </div>
          </div>
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

        {/* Tab Selection */}
        <div style={{
          display: 'flex',
          gap: '6px',
          padding: '10px 20px',
          background: '#111420',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
        }}>
          <button
            onClick={() => { setActiveTab('usb'); setErrorMsg(null); }}
            style={{
              flex: 1,
              padding: '9px 14px',
              background: activeTab === 'usb' ? '#1c2232' : 'transparent',
              border: `1px solid ${activeTab === 'usb' ? 'rgba(56, 189, 248, 0.4)' : 'transparent'}`,
              borderRadius: '6px',
              color: activeTab === 'usb' ? '#f8fafc' : '#94a3b8',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.15s ease'
            }}
          >
            <Usb size={15} color={activeTab === 'usb' ? '#38bdf8' : '#64748b'} />
            <span>USB MIDI (Kabel)</span>
          </button>

          <button
            onClick={() => { setActiveTab('bluetooth'); setErrorMsg(null); }}
            style={{
              flex: 1,
              padding: '9px 14px',
              background: activeTab === 'bluetooth' ? '#1c2232' : 'transparent',
              border: `1px solid ${activeTab === 'bluetooth' ? 'rgba(56, 189, 248, 0.4)' : 'transparent'}`,
              borderRadius: '6px',
              color: activeTab === 'bluetooth' ? '#f8fafc' : '#94a3b8',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.15s ease'
            }}
          >
            <Bluetooth size={15} color={activeTab === 'bluetooth' ? '#38bdf8' : '#64748b'} />
            <span>Bluetooth Wireless</span>
          </button>
        </div>

        {/* Content Body */}
        <div style={{
          padding: '20px',
          display: 'grid',
          gridTemplateColumns: '1.2fr 1fr',
          gap: '20px'
        }}>
          {/* Left Column: Connection Action */}
          <div>
            {errorMsg && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '6px',
                padding: '10px 12px',
                fontSize: '11px',
                color: '#fca5a5',
                marginBottom: '14px',
                lineHeight: '1.4',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px'
              }}>
                <AlertCircle size={15} style={{ flexShrink: 0, marginTop: '2px', color: '#f87171' }} />
                <div>
                  <strong style={{ color: '#fff' }}>Connection Failed:</strong>
                  <div style={{ marginTop: '2px' }}>{errorMsg}</div>
                </div>
              </div>
            )}

            {/* USB TAB */}
            {activeTab === 'usb' && (
              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '10px'
                }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.5px' }}>
                    PORT USB MIDI
                  </span>
                  <button
                    onClick={loadUsbDevices}
                    disabled={isCheckingUsb}
                    style={{
                      background: '#181c2a',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#cbd5e1',
                      borderRadius: '5px',
                      padding: '4px 10px',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <RefreshCw size={11} className={isCheckingUsb ? 'pulse-anim' : ''} />
                    <span>Rescan</span>
                  </button>
                </div>

                {usbDevices.length === 0 ? (
                  <div style={{
                    background: '#161926',
                    border: '1px dashed rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    padding: '24px 16px',
                    textAlign: 'center',
                    color: '#94a3b8',
                    fontSize: '12px',
                    lineHeight: '1.6'
                  }}>
                    <Usb size={28} style={{ opacity: 0.35, margin: '0 auto 8px auto', display: 'block' }} />
                    <strong style={{ color: '#f8fafc' }}>No USB MIDI device detected</strong>
                    <div style={{ marginTop: '6px', fontSize: '11px', color: '#64748b' }}>
                      1. Connect pedal USB-C cable to PC.<br />
                      2. Ensure Pocket Master pedal is powered on.<br />
                      3. Click the <strong>Rescan</strong> button above.
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {usbDevices.map((dev, idx) => {
                      const isTarget = dev.isPocketMaster || dev.name.toLowerCase().includes('pocket');
                      return (
                        <div
                          key={idx}
                          style={{
                            background: '#181c2a',
                            border: `1px solid ${isTarget ? 'rgba(56, 189, 248, 0.5)' : 'rgba(255, 255, 255, 0.08)'}`,
                            borderRadius: '8px',
                            padding: '12px 14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '6px',
                              background: '#131622',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: isTarget ? '#38bdf8' : '#94a3b8'
                            }}>
                              <Usb size={16} />
                            </div>
                            <div>
                              <div style={{ fontSize: '12px', fontWeight: 800, color: '#f8fafc' }}>
                                {dev.name}
                              </div>
                              <div style={{ fontSize: '10px', color: '#10b981', marginTop: '1px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <CheckCircle2 size={11} /> Ready
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => handleConnectUsbDevice(dev)}
                            style={{
                              background: isTarget ? '#0284c7' : '#242a3a',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '5px',
                              padding: '6px 14px',
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            Connect
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* BLUETOOTH TAB */}
            {activeTab === 'bluetooth' && (
              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '10px'
                }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.5px' }}>
                    BLUETOOTH SCAN
                  </span>
                  <button
                    onClick={handleStartBleScan}
                    disabled={isScanning}
                    style={{
                      background: '#181c2a',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#cbd5e1',
                      borderRadius: '5px',
                      padding: '4px 10px',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <RefreshCw size={11} className={isScanning ? 'pulse-anim' : ''} />
                    <span>{isScanning ? 'Scanning...' : 'Scan BLE'}</span>
                  </button>
                </div>

                <div style={{
                  background: '#181c2a',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '8px',
                  padding: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '6px',
                      background: '#131622',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#38bdf8'
                    }}>
                      <Radio size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#f8fafc' }}>
                        Sonicake Pocket Master BLE
                      </div>
                      <div style={{ fontSize: '10px', color: '#64748b' }}>
                        Service: 03b80e5a
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleStartBleScan}
                    style={{
                      background: '#0284c7',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '5px',
                      padding: '6px 14px',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Connect
                  </button>
                </div>
              </div>
            )}

            {/* Offline Simulation Button */}
            <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <button
                onClick={handleConnectSimulated}
                style={{
                  width: '100%',
                  background: '#181c2a',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#cbd5e1',
                  borderRadius: '6px',
                  padding: '9px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Laptop size={14} color="#94a3b8" />
                <span>Offline Demo Mode</span>
              </button>
            </div>
          </div>

          {/* Right Column: Hardware Spec Card */}
          <div style={{
            background: '#181c2a',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Cpu size={16} color="var(--accent-amber)" />
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#f8fafc' }}>
                  Sonicake Pocket Master
                </span>
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: '1.5', marginBottom: '12px' }}>
                Guitar multi-effects processor featuring 100 presets (50 User P01-P50 & 50 Factory F01-F50), Neural Amp Modeler (NAM A2), and cabinet IR loader.
              </div>
            </div>

            <div style={{
              background: '#131622',
              borderRadius: '6px',
              padding: '12px',
              fontSize: '11px',
              color: '#94a3b8',
              lineHeight: '1.5',
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
              <strong style={{ color: '#cbd5e1', display: 'block', marginBottom: '4px' }}>Connection Guide:</strong>
              1. Connect pedal USB-C cable to PC.<br />
              2. Grant browser MIDI & SysEx permissions.<br />
              3. Click Connect.<br />
              4. Presets and parameters sync automatically in real time.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
