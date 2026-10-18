import React, { useState, useEffect } from 'react';
import { X, Radio, VolumeX, Volume2, CheckCircle2 } from 'lucide-react';
import { audioEngine } from '../services/audioEngine';

export default function TunerModal({ isOpen, onClose }) {
  const [pitchData, setPitchData] = useState({
    note: 'E',
    octave: 2,
    cents: 0,
    freq: 82.4,
    inTune: false
  });
  const [isMuted, setIsMuted] = useState(true);
  const [calibration, setCalibration] = useState(440);

  useEffect(() => {
    if (isOpen) {
      audioEngine.startTuner((info) => {
        setPitchData(info);
      });
    } else {
      audioEngine.stopTuner();
    }

    return () => {
      audioEngine.stopTuner();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Calculate needle angle (-45 deg to +45 deg for -50 to +50 cents)
  const needleAngle = (pitchData.cents / 50) * 45;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        width: '520px',
        background: '#131622',
        border: '1px solid #262c3d',
        borderRadius: '10px',
        boxShadow: '0 24px 60px rgba(0, 0, 0, 0.85)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '14px 20px',
          borderBottom: '1px solid #1e2433',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#161a29'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Radio size={16} color="#10b981" />
            <span style={{ fontWeight: 700, fontSize: '14px', color: '#f8fafc', letterSpacing: '0.02em' }}>
              Chromatic Tuner
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Calibration selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#94a3b8' }}>
              <span>Reference</span>
              <select
                value={calibration}
                onChange={(e) => setCalibration(parseInt(e.target.value, 10))}
                style={{
                  background: '#0d0f17',
                  border: '1px solid #262c3d',
                  color: '#f8fafc',
                  borderRadius: '5px',
                  padding: '3px 6px',
                  fontSize: '11px',
                  fontWeight: 600,
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                {[435, 438, 439, 440, 441, 442, 444, 445].map(freq => (
                  <option key={freq} value={freq} style={{ background: '#161a29', color: '#f8fafc' }}>
                    {freq} Hz
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => {
                audioEngine.stopTuner();
                onClose();
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#64748b',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4px',
                borderRadius: '4px',
                transition: 'color 0.15s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#f8fafc'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#64748b'}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Pitch Display & Analog Needle Meter */}
        <div style={{
          padding: '24px 20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
          background: '#0f111a'
        }}>
          {/* Note Name Display with Clean Precision State */}
          <div style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'center',
            height: '96px'
          }}>
            <span style={{
              fontSize: '84px',
              fontWeight: 800,
              color: pitchData.inTune ? '#10b981' : '#f8fafc',
              textShadow: pitchData.inTune 
                ? '0 0 16px rgba(16, 185, 129, 0.4)' 
                : 'none',
              transition: 'color 0.15s ease'
            }}>
              {pitchData.note}
            </span>
            <span style={{
              fontSize: '28px',
              fontWeight: 700,
              color: pitchData.inTune ? '#10b981' : '#64748b',
              marginLeft: '4px'
            }}>
              {pitchData.octave}
            </span>
          </div>

          {/* Needle Meter Arch */}
          <div style={{
            width: '360px',
            height: '110px',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-end',
            overflow: 'hidden',
            borderBottom: '1px solid #1e2433'
          }}>
            {/* Arch Scale markings */}
            <div style={{
              position: 'absolute',
              top: '6px',
              left: '16px',
              right: '16px',
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '11px',
              fontWeight: 600,
              color: '#64748b'
            }}>
              <span>-50</span>
              <span>-25</span>
              <span style={{ color: pitchData.inTune ? '#10b981' : '#94a3b8', fontWeight: 700 }}>0</span>
              <span>+25</span>
              <span>+50</span>
            </div>

            {/* Pivot Base */}
            <div style={{
              width: '14px',
              height: '14px',
              borderRadius: '50%',
              background: '#334155',
              position: 'absolute',
              bottom: '-7px',
              boxShadow: '0 0 6px rgba(0,0,0,0.8)',
              zIndex: 3
            }} />

            {/* Needle Arm */}
            <div style={{
              position: 'absolute',
              bottom: '0',
              width: '2px',
              height: '84px',
              background: pitchData.inTune ? '#10b981' : '#f59e0b',
              transformOrigin: '50% 100%',
              transform: `rotate(${needleAngle}deg)`,
              transition: 'transform 0.1s cubic-bezier(0.16, 1, 0.3, 1)',
              borderRadius: '1px',
              zIndex: 2
            }} />

            {/* Center Lock Target Indicator */}
            <div style={{
              position: 'absolute',
              top: '20px',
              width: '3px',
              height: '14px',
              background: pitchData.inTune ? '#10b981' : '#334155',
              borderRadius: '1px'
            }} />
          </div>

          {/* Cent Value & Frequency */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            background: '#161a29',
            padding: '7px 20px',
            borderRadius: '6px',
            border: '1px solid #262c3d'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '11px', color: '#64748b' }}>Offset:</span>
              <strong style={{ 
                color: pitchData.inTune ? '#10b981' : (pitchData.cents > 0 ? '#ef4444' : '#38bdf8'),
                fontSize: '13px',
                fontWeight: 700
              }}>
                {pitchData.cents > 0 ? `+${pitchData.cents}` : pitchData.cents} cents
              </strong>
            </div>

            <div style={{ width: '1px', height: '14px', background: '#262c3d' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '11px', color: '#64748b' }}>Freq:</span>
              <strong style={{ color: '#f8fafc', fontSize: '13px', fontWeight: 700 }}>
                {pitchData.freq} Hz
              </strong>
            </div>
          </div>

          {/* Mute output switch */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            style={{
              background: isMuted ? 'rgba(239, 68, 68, 0.12)' : '#161a29',
              border: `1px solid ${isMuted ? 'rgba(239, 68, 68, 0.35)' : '#262c3d'}`,
              color: isMuted ? '#f87171' : '#94a3b8',
              borderRadius: '6px',
              padding: '6px 16px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease'
            }}
          >
            {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            <span>{isMuted ? 'Mute Audio Output' : 'Audio Thru (Audible)'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
