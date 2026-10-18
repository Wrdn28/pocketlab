import React, { useState } from 'react';
import { 
  FolderDown, 
  FolderUp, 
  FileText, 
  Edit3, 
  Search, 
  X, 
  Check, 
  Sparkles,
  Sliders,
  ShieldCheck,
  Cpu
} from 'lucide-react';
import { getPresetSlotCode } from '../services/pocketMasterProtocol';

export default function PresetManager({
  isOpen,
  onClose,
  presets,
  currentPresetIndex = 0,
  onSelectPreset,
  onSavePresetName,
  onExportPresets,
  onImportPresets,
  connectionStatus
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'user', 'factory'
  const [editingIndex, setEditingIndex] = useState(null);
  const [editName, setEditName] = useState('');

  if (!isOpen) return null;

  const filteredPresets = presets
    .map((p, idx) => ({
      ...p,
      originalIndex: idx,
      slotCode: p.slotCode || getPresetSlotCode(idx),
      type: idx < 50 ? 'user' : 'factory'
    }))
    .filter(p => {
      // Filter by tab
      if (activeTab === 'user' && p.type !== 'user') return false;
      if (activeTab === 'factory' && p.type !== 'factory') return false;

      // Filter by search query
      const query = searchQuery.toLowerCase().trim();
      if (!query) return true;
      return (
        p.name.toLowerCase().includes(query) || 
        p.slotCode.toLowerCase().includes(query)
      );
    });

  const handleStartRename = (idx, currentName) => {
    // Only user presets (0-49) can be renamed in EEPROM
    if (idx >= 50) {
      alert('Factory presets (F01-F50) are write-protected in hardware and cannot be renamed. Please use User slots (P01-P50).');
      return;
    }
    setEditingIndex(idx);
    setEditName(currentName);
  };

  const handleFinishRename = (idx) => {
    if (editName.trim()) {
      onSavePresetName(idx, editName.trim());
    }
    setEditingIndex(null);
  };

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
        width: '780px',
        maxHeight: '86vh',
        borderRadius: '10px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: '#131622',
        border: '1px solid #262c3d',
        boxShadow: '0 24px 60px rgba(0, 0, 0, 0.9)'
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileText size={16} color="#f59e0b" />
            <span style={{ fontWeight: 700, fontSize: '14px', color: '#f8fafc', letterSpacing: '0.02em' }}>
              Preset Library
            </span>
            {connectionStatus && (
              <span style={{
                fontSize: '11px',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: '4px',
                background: connectionStatus.simulated ? 'rgba(245, 158, 11, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                color: connectionStatus.simulated ? '#f59e0b' : '#10b981',
                border: `1px solid ${connectionStatus.simulated ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`
              }}>
                {connectionStatus.simulated ? 'Simulated' : 'Pedal Connected'}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Export Button */}
            <button
              onClick={onExportPresets}
              style={{
                background: '#1c2233',
                border: '1px solid #2a3449',
                color: '#e2e8f0',
                borderRadius: '5px',
                padding: '5px 10px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'background 0.15s ease'
              }}
            >
              <FolderDown size={13} /> Export JSON
            </button>

            {/* Import Button */}
            <label style={{
              background: '#1c2233',
              border: '1px solid #2a3449',
              color: '#e2e8f0',
              borderRadius: '5px',
              padding: '5px 10px',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              transition: 'background 0.15s ease'
            }}>
              <FolderUp size={13} /> Import
              <input 
                type="file" 
                accept=".json,.prst" 
                onChange={onImportPresets} 
                style={{ display: 'none' }} 
              />
            </label>

            <button
              onClick={onClose}
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

        {/* Tab & Search Bar */}
        <div style={{ 
          padding: '10px 20px', 
          borderBottom: '1px solid #1e2433',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          background: '#0f111a'
        }}>
          {/* User vs Factory Tabs */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => setActiveTab('all')}
              style={{
                background: activeTab === 'all' ? '#242b3d' : '#161a26',
                border: `1px solid ${activeTab === 'all' ? '#3b455f' : '#1f2536'}`,
                color: activeTab === 'all' ? '#f8fafc' : '#94a3b8',
                borderRadius: '5px',
                padding: '5px 12px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              All (100)
            </button>
            <button
              onClick={() => setActiveTab('user')}
              style={{
                background: activeTab === 'user' ? 'rgba(6, 182, 212, 0.15)' : '#161a26',
                border: `1px solid ${activeTab === 'user' ? 'rgba(6, 182, 212, 0.45)' : '#1f2536'}`,
                color: activeTab === 'user' ? '#67e8f9' : '#94a3b8',
                borderRadius: '5px',
                padding: '5px 12px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              User Presets (P01-P50)
            </button>
            <button
              onClick={() => setActiveTab('factory')}
              style={{
                background: activeTab === 'factory' ? 'rgba(245, 158, 11, 0.15)' : '#161a26',
                border: `1px solid ${activeTab === 'factory' ? 'rgba(245, 158, 11, 0.45)' : '#1f2536'}`,
                color: activeTab === 'factory' ? '#fcd34d' : '#94a3b8',
                borderRadius: '5px',
                padding: '5px 12px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              Factory Presets (F01-F50)
            </button>
          </div>

          {/* Search Input */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: '#161a26',
            padding: '5px 10px',
            borderRadius: '6px',
            border: '1px solid #242b3d',
            minWidth: '220px'
          }}>
            <Search size={13} color="#64748b" />
            <input
              type="text"
              placeholder="Search (P01, Lead, Clean)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#f8fafc',
                fontSize: '11px',
                width: '100%',
                outline: 'none'
              }}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: 0 }}
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Presets Grid */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '14px 20px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))',
          gap: '8px',
          background: '#0d0f17'
        }}>
          {filteredPresets.map((preset) => {
            const idx = preset.originalIndex;
            const isCurrent = currentPresetIndex === idx;
            const isEditing = editingIndex === idx;
            const isUser = preset.type === 'user';

            return (
              <div
                key={idx}
                onClick={() => onSelectPreset(idx)}
                style={{
                  background: isCurrent ? '#1c2233' : '#141724',
                  border: `1px solid ${
                    isCurrent 
                      ? (isUser ? '#06b6d4' : '#f59e0b') 
                      : '#1e2434'
                  }`,
                  borderRadius: '6px',
                  padding: '9px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {/* Slot Pill */}
                  <div style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: isUser ? '#67e8f9' : '#fcd34d',
                    background: isUser ? 'rgba(6, 182, 212, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                    border: `1px solid ${isUser ? 'rgba(6, 182, 212, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                    padding: '2px 7px',
                    borderRadius: '4px',
                    minWidth: '34px',
                    textAlign: 'center'
                  }}>
                    {preset.slotCode}
                  </div>

                  {isEditing ? (
                    <input
                      type="text"
                      autoFocus
                      maxLength={10}
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onBlur={() => handleFinishRename(idx)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleFinishRename(idx); }}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        background: '#0d0f17',
                        border: '1px solid #06b6d4',
                        color: '#fff',
                        borderRadius: '4px',
                        padding: '2px 6px',
                        fontSize: '12px',
                        fontWeight: 600,
                        outline: 'none',
                        width: '130px'
                      }}
                    />
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        fontWeight: 600,
                        fontSize: '12px',
                        color: isCurrent ? '#ffffff' : '#cbd5e1',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '170px'
                      }}>
                        {preset.name}
                      </div>
                      {isCurrent && (
                        <span style={{
                          fontSize: '9px',
                          fontWeight: 700,
                          padding: '1px 5px',
                          borderRadius: '3px',
                          background: isUser ? 'rgba(6, 182, 212, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                          color: isUser ? '#67e8f9' : '#fcd34d',
                          border: `1px solid ${isUser ? 'rgba(6, 182, 212, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`
                        }}>
                          ACTIVE
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {isEditing ? (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleFinishRename(idx); }}
                      style={{ background: 'transparent', border: 'none', color: '#10b981', cursor: 'pointer', padding: '2px' }}
                    >
                      <Check size={14} />
                    </button>
                  ) : (
                    isUser && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleStartRename(idx, preset.name); }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#64748b',
                          cursor: 'pointer',
                          padding: '3px',
                          borderRadius: '3px',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.color = '#f8fafc'}
                        onMouseLeave={(e) => e.currentTarget.style.color = '#64748b'}
                        title="Rename User Preset (maksimal 10 karakter)"
                      >
                        <Edit3 size={12} />
                      </button>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{
          padding: '10px 20px',
          borderTop: '1px solid #1e2433',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '11px',
          color: '#64748b',
          background: '#161a29'
        }}>
          <span>Showing {filteredPresets.length} of {presets.length} presets (50 User P01-P50 | 50 Factory F01-F50)</span>
          <span style={{ color: '#94a3b8' }}>
            Select a preset slot to switch immediately on hardware
          </span>
        </div>
      </div>
    </div>
  );
}
