import React, { useState, useEffect } from 'react';
import { Check, X, AlertCircle } from 'lucide-react';
import Header from './components/Header';
import EffectChain from './components/EffectChain';
import ModuleEditor from './components/ModuleEditor';
import FootswitchBar from './components/FootswitchBar';
import TunerModal from './components/TunerModal';
import PresetManager from './components/PresetManager';
import DeviceSearchModal from './components/DeviceSearchModal';
import DeviceSettingsModal from './components/DeviceSettingsModal';

import { SUPPORTED_DEVICES, loadDeviceModules, FALLBACK_MODULES, getAmpModuleDefinition } from './services/deviceData';
import { bleService } from './services/bleService';
import { midiService } from './services/midiService';
import { 
  generatePocketMasterDefaultPresets, 
  getPresetSlotCode,
  getModuleBypassSysEx,
  getParameterSysEx,
  getEffectTypeSysEx,
  moveModuleInChain,
  FIXED_CORE_MODULES
} from './services/pocketMasterProtocol';

function getInitialPresets() {
  try {
    const saved = localStorage.getItem('pocketmaster_presets');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length === 100) return parsed;
    }
  } catch (e) {}
  return generatePocketMasterDefaultPresets();
}

export default function App() {
  const [currentDevice, setCurrentDevice] = useState(SUPPORTED_DEVICES[0]);
  const [modules, setModules] = useState(FALLBACK_MODULES);
  const [selectedModuleIndex, setSelectedModuleIndex] = useState(3); // Start with AMP
  const [currentPresetIndex, setCurrentPresetIndex] = useState(0);
  const [presets, setPresets] = useState(getInitialPresets());
  const [connectionStatus, setConnectionStatus] = useState({ connected: true, simulated: true, name: 'Pocket Master (Simulated)' });
  const [masterVolume, setMasterVolume] = useState(85);
  const [patchVolume, setPatchVolume] = useState(75);
  const [ampMode, setAmpMode] = useState('Normal');
  const [syncNotification, setSyncNotification] = useState(null);

  // Global Hardware Levels (Global Vol, Input Level, FX Rec, BT Rec, Monitor Level)
  const [globalSettings, setGlobalSettings] = useState({
    globalVolume: 75,
    inputLevel: 0,
    fxRecLevel: 0,
    btRecLevel: 0,
    monitorLevel: 0
  });

  // User Profile Slot Names (NAM Model User 1..5)
  const [cloneAmpNames, setCloneAmpNames] = useState([
    'User Profile 1',
    'User Profile 2',
    'User Profile 3',
    'User Profile 4',
    'User Profile 5'
  ]);

  // User Profile NAM Metadata (V1/V2, A2-Lite/Full, Sample Rate, Weights, Author)
  const [cloneAmpMetadata, setCloneAmpMetadata] = useState(() => {
    try {
      const saved = localStorage.getItem('soniclink_clone_amp_meta');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  // User IR Slot Names (User IR 1..5)
  const [userIrNames, setUserIrNames] = useState([
    'User IR 1',
    'User IR 2',
    'User IR 3',
    'User IR 4',
    'User IR 5'
  ]);

  // Modal open states (Drum machine removed per user request)
  const [isTunerOpen, setIsTunerOpen] = useState(false);
  const [isPresetsDrawerOpen, setIsPresetsDrawerOpen] = useState(false);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Load device modules when selected device changes
  useEffect(() => {
    loadDeviceModules(currentDevice).then(loadedModules => {
      setModules(loadedModules);
      setSelectedModuleIndex(Math.min(3, loadedModules.length - 1));
    });
  }, [currentDevice]);

  // Init MIDI & BLE listeners
  useEffect(() => {
    midiService.init();

    const handleBleConnected = async (data) => {
      setConnectionStatus({ connected: true, simulated: data.simulated, name: data.name });

      const matched = SUPPORTED_DEVICES.find(d => 
        data.name?.toLowerCase().includes('pocket') || 
        data.name?.toLowerCase().includes('qme20') ||
        data.name?.toLowerCase().includes(d.name.toLowerCase())
      ) || SUPPORTED_DEVICES[0];

      setCurrentDevice(matched);

      const loaded = await loadDeviceModules(matched);
      if (loaded && loaded.length > 0) {
        setModules(loaded);
        setSelectedModuleIndex(Math.min(3, loaded.length - 1));
      }

      // Query hardware state & preset names over BLE & MIDI
      bleService.requestHardwareSync();
      midiService.requestHardwareSync();

      setSyncNotification({
        type: 'success',
        text: `Connected to ${data.name}! Synchronizing presets, effects and parameters from hardware...`
      });

      setTimeout(() => {
        setSyncNotification(null);
      }, 5000);
    };

    const handleBleDisconnected = () => {
      setConnectionStatus({ connected: false, simulated: false, name: null });
      setSyncNotification({
        type: 'warning',
        text: 'Bluetooth device disconnected.'
      });
      setTimeout(() => setSyncNotification(null), 4000);
    };

    const handleMidiConnected = (data) => {
      setConnectionStatus({ connected: true, simulated: false, name: `${data.name} (USB)` });
      setSyncNotification({
        type: 'success',
        text: `Connected via USB to ${data.name}! Synchronizing presets and effects from hardware...`
      });
      midiService.requestHardwareSync();
      setTimeout(() => setSyncNotification(null), 5000);
    };

    const handleMidiDisconnected = () => {
      setConnectionStatus({ connected: false, simulated: false, name: null });
      setSyncNotification({
        type: 'warning',
        text: 'USB MIDI device disconnected.'
      });
      setTimeout(() => setSyncNotification(null), 4000);
    };

    // Full 5-Packet Preset State Dump Handler (Synchronizes Bypass, Effect Types, Parameters, Patch Vol, Chain)
    const handlePresetStateLoaded = (stateData) => {
      if (!stateData) return;
      console.log('[App] Applying Preset State from hardware:', stateData);

      if (stateData.presetVolume !== undefined) {
        setPatchVolume(Number(stateData.presetVolume));
      }
      if (stateData.ampMode) {
        setAmpMode(stateData.ampMode);
        const isClone = stateData.ampMode === 'Clone';
        const replacementAmp = getAmpModuleDefinition(isClone);
        if (replacementAmp) {
          setModules(prev => prev.map(m => {
            const isAmp = m.name === 'AMP' || m.name === 'Clone' || m.moduleId === 3 || m.moduleId === 9;
            if (isAmp) {
              return { ...replacementAmp, enabled: m.enabled };
            }
            const isIr = m.name === 'IR' || m.name === 'CAB' || m.moduleId === 4;
            if (isIr && isClone) {
              return { ...m, enabled: false };
            }
            return m;
          }));
        }
      }

      setModules(prev => {
        const next = prev.map(m => {
          const modCopy = { 
            ...m, 
            effects: m.effects.map(ef => ({ 
              ...ef, 
              alg: ef.alg ? ef.alg.map(a => ({ ...a })) : [] 
            })) 
          };

          // 1. Sync bypass state
          if (stateData.states && stateData.states[m.name] !== undefined) {
            modCopy.enabled = Boolean(stateData.states[m.name]);
          }

          // 2. Sync active effect type
          if (stateData.selectedEffects && stateData.selectedEffects[m.moduleId] !== undefined) {
            const targetFxId = stateData.selectedEffects[m.moduleId];
            const fxIdx = modCopy.effects.findIndex(ef => Number(ef.fxid) === Number(targetFxId));
            if (fxIdx !== -1) {
              modCopy.currentFxIndex = fxIdx;
            }
          }

          // 3. Sync parameter knob values
          if (stateData.parameters && stateData.parameters[m.moduleId]) {
            const modParams = stateData.parameters[m.moduleId];
            modCopy.effects.forEach(ef => {
              if (ef && ef.alg) {
                ef.alg.forEach(param => {
                  const decVal = modParams[param.algId] !== undefined ? modParams[param.algId] : modParams[String(param.algId)];
                  if (decVal !== undefined) {
                    param.value = decVal;
                  }
                });
              }
            });
          }

          return modCopy;
        });

        // 4. Sync chain routing order
        if (Array.isArray(stateData.order) && stateData.order.length > 0) {
          const reordered = [];
          stateData.order.forEach(name => {
            const found = next.find(m => m.name === name);
            if (found) reordered.push(found);
          });
          next.forEach(m => {
            if (!reordered.find(r => r.name === m.name)) {
              reordered.push(m);
            }
          });
          return reordered;
        }

        return next;
      });

    };

    // Realtime Parameter Knob from Hardware (0408)
    const handleParamFromHardware = (data) => {
      if (data.fromHardware && data.value !== undefined) {
        console.log(`[App] Realtime param from hardware: Module ${data.moduleId}, Alg ${data.algId} = ${data.value}`);
        setModules(prev => prev.map(m => {
          if (m.moduleId !== data.moduleId) return m;
          const effects = m.effects.map((ef, eIdx) => {
            if (eIdx !== m.currentFxIndex) return ef;
            const alg = (ef.alg || []).map(p => {
              if (String(p.algId) === String(data.algId)) {
                return { ...p, value: data.value };
              }
              return p;
            });
            return { ...ef, alg };
          });
          return { ...m, effects };
        }));
      }
    };

    // Realtime Bypass from Hardware (0409)
    const handleBypassFromHardware = (data) => {
      if (data.fromHardware) {
        console.log(`[App] Realtime bypass from hardware: Module ${data.moduleId} = ${data.enabled ? 'ON' : 'BYPASS'}`);
        setModules(prev => prev.map(m => {
          if (m.moduleId !== data.moduleId) return m;
          return { ...m, enabled: Boolean(data.enabled) };
        }));
      }
    };

    // Realtime Effect Model from Hardware (0407)
    const handleEffectTypeFromHardware = (data) => {
      if (data.fromHardware && data.fxId !== undefined) {
        console.log(`[App] Realtime effect model from hardware: Module ${data.moduleId} = FX ${data.fxId}`);
        setModules(prev => prev.map(m => {
          if (m.moduleId !== data.moduleId) return m;
          const fxIdx = m.effects.findIndex(ef => Number(ef.fxid) === Number(data.fxId));
          if (fxIdx !== -1) {
            return { ...m, currentFxIndex: fxIdx };
          }
          return m;
        }));
      }
    };

    // Realtime Patch Volume from Hardware (0402)
    const handleVolumeFromHardware = (data) => {
      if (data.fromHardware && data.value !== undefined) {
        setPatchVolume(Number(data.value));
      }
    };

    // Realtime Chain Order from Hardware (0404)
    const handleChainOrderFromHardware = (data) => {
      if (data.fromHardware && Array.isArray(data.order) && data.order.length > 0) {
        setModules(prev => {
          const reordered = [];
          data.order.forEach(name => {
            const found = prev.find(m => m.name === name);
            if (found) reordered.push(found);
          });
          prev.forEach(m => {
            if (!reordered.find(r => r.name === m.name)) reordered.push(m);
          });
          return reordered;
        });
      }
    };

    // Realtime Preset Change from Hardware
    const handlePresetFromHardware = (data) => {
      if (data.fromHardware) {
        const idx = data.index !== undefined ? data.index : 0;
        setCurrentPresetIndex(idx);
      }
    };

    // Preset Names Dump loaded from Hardware
    const handlePresetNamesLoaded = (namesArray) => {
      if (Array.isArray(namesArray) && namesArray.length > 0) {
        setPresets(prev => {
          const next = prev.map((p, idx) => {
            const hName = namesArray[idx];
            if (hName && hName.trim().length > 0) {
              return { ...p, name: hName.trim() };
            }
            return p;
          });
          try {
            localStorage.setItem('pocketmaster_presets', JSON.stringify(next));
          } catch (e) {}
          return next;
        });
      }
    };

    // Global Settings dump loaded from hardware
    const handleGlobalSettingsLoaded = (settings) => {
      if (!settings) return;
      console.log('[App] Decoded Global Settings from Hardware:', settings);
      setGlobalSettings(prev => ({ ...prev, ...settings }));
      if (settings.globalVolume !== undefined) {
        setMasterVolume(settings.globalVolume);
      }
    };

    // Realtime Global setting changed from hardware (0101)
    const handleGlobalSettingChanged = (data) => {
      if (data && data.paramName) {
        setGlobalSettings(prev => ({ ...prev, [data.paramName]: data.value }));
        if (data.paramName === 'globalVolume') {
          setMasterVolume(data.value);
        }
      }
    };

    // Clone Amp User Names (1..5) dump loaded from hardware
    const handleCloneAmpNamesLoaded = (names) => {
      if (Array.isArray(names) && names.length > 0) {
        console.log('[App] Clone Amp Names from hardware:', names);
        setCloneAmpNames(names);
      }
    };

    // User IR Names (1..5) dump loaded from hardware
    const handleUserIrNamesLoaded = (names) => {
      if (Array.isArray(names) && names.length > 0) {
        console.log('[App] User IR Names from hardware:', names);
        setUserIrNames(names);
      }
    };

    // Realtime Amp Mode from hardware (0409 on module 9)
    const handleAmpModeFromHardware = (data) => {
      if (data && data.mode) {
        const isClone = data.mode === 'Clone';
        setAmpMode(data.mode);
        const replacementAmp = getAmpModuleDefinition(isClone);
        setModules(prev => prev.map(m => {
          const isAmp = m.name === 'AMP' || m.name === 'Clone' || m.moduleId === 3 || m.moduleId === 9;
          if (isAmp && replacementAmp) {
            return { ...replacementAmp, enabled: m.enabled };
          }
          const isIr = m.name === 'IR' || m.name === 'CAB' || m.moduleId === 4;
          if (isIr && isClone) {
            return { ...m, enabled: false };
          }
          return m;
        }));
      }
    };

    // BLE event subscriptions
    const offConn = bleService.on('connected', handleBleConnected);
    const offDisc = bleService.on('disconnected', handleBleDisconnected);
    const offParam = bleService.on('parameterChanged', handleParamFromHardware);
    const offBypass = bleService.on('bypassChanged', handleBypassFromHardware);
    const offFxType = bleService.on('effectTypeChanged', handleEffectTypeFromHardware);
    const offVol = bleService.on('presetVolumeChanged', handleVolumeFromHardware);
    const offChain = bleService.on('chainOrderChanged', handleChainOrderFromHardware);
    const offPreset = bleService.on('presetChanged', handlePresetFromHardware);
    const offBleNames = bleService.on('presetNamesLoaded', handlePresetNamesLoaded);
    const offBleState = bleService.on('presetStateLoaded', handlePresetStateLoaded);
    const offBleGlobals = bleService.on('globalSettingsLoaded', handleGlobalSettingsLoaded);
    const offBleGlobalParam = bleService.on('globalSettingChanged', handleGlobalSettingChanged);
    const offBleCloneNames = bleService.on('cloneAmpNamesLoaded', handleCloneAmpNamesLoaded);
    const offBleUserIr = bleService.on('userIrNamesLoaded', handleUserIrNamesLoaded);
    const offBleAmpMode = bleService.on('ampModeChanged', handleAmpModeFromHardware);

    // MIDI event subscriptions
    const offMidiConn = midiService.on('connected', handleMidiConnected);
    const offMidiDisc = midiService.on('disconnected', handleMidiDisconnected);
    const offMidiParam = midiService.on('parameterChanged', handleParamFromHardware);
    const offMidiBypass = midiService.on('bypassChanged', handleBypassFromHardware);
    const offMidiFxType = midiService.on('effectTypeChanged', handleEffectTypeFromHardware);
    const offMidiVol = midiService.on('presetVolumeChanged', handleVolumeFromHardware);
    const offMidiChain = midiService.on('chainOrderChanged', handleChainOrderFromHardware);
    const offMidiPreset = midiService.on('presetChanged', handlePresetFromHardware);
    const offMidiNames = midiService.on('presetNamesLoaded', handlePresetNamesLoaded);
    const offMidiState = midiService.on('presetStateLoaded', handlePresetStateLoaded);
    const offMidiGlobals = midiService.on('globalSettingsLoaded', handleGlobalSettingsLoaded);
    const offMidiGlobalParam = midiService.on('globalSettingChanged', handleGlobalSettingChanged);
    const offMidiCloneNames = midiService.on('cloneAmpNamesLoaded', handleCloneAmpNamesLoaded);
    const offMidiUserIr = midiService.on('userIrNamesLoaded', handleUserIrNamesLoaded);
    const offMidiAmpMode = midiService.on('ampModeChanged', handleAmpModeFromHardware);

    return () => {
      offConn();
      offDisc();
      offParam();
      offBypass();
      offFxType();
      offVol();
      offChain();
      offPreset();
      offBleNames();
      offBleState();
      offBleGlobals();
      offBleGlobalParam();
      offBleCloneNames();
      offBleUserIr();
      offBleAmpMode();

      offMidiConn();
      offMidiDisc();
      offMidiParam();
      offMidiBypass();
      offMidiFxType();
      offMidiVol();
      offMidiChain();
      offMidiPreset();
      offMidiNames();
      offMidiState();
      offMidiGlobals();
      offMidiGlobalParam();
      offMidiCloneNames();
      offMidiUserIr();
      offMidiAmpMode();
    };
  }, []);

  const currentPreset = presets[currentPresetIndex] || {
    name: 'Preset',
    slotCode: getPresetSlotCode(currentPresetIndex)
  };

  // Force Sync with Hardware Pedal
  const handleForceSync = async () => {
    bleService.requestHardwareSync();
    midiService.requestHardwareSync();
  };

  // Select Preset Handler
  const handleSelectPreset = (presetIndex) => {
    const validIdx = Math.max(0, Math.min(99, presetIndex));
    setCurrentPresetIndex(validIdx);
    bleService.sendPresetChange(validIdx);
    midiService.sendPresetChange(validIdx);
  };

  const handlePrevPreset = () => {
    const nextIdx = (currentPresetIndex - 1 + presets.length) % presets.length;
    handleSelectPreset(nextIdx);
  };

  const handleNextPreset = () => {
    const nextIdx = (currentPresetIndex + 1) % presets.length;
    handleSelectPreset(nextIdx);
  };

  // Warning notification when attempting to toggle IR while in NAM Clone Mode
  const handleAttemptIrWhileNam = () => {
    setSyncNotification({
      type: 'warning',
      text: 'IR module cannot be activated while NAM mode is active. NAM profiles represent a full-rig capture (Amp + Cab), so the IR cabinet stage is automatically locked to prevent double-cab filtering (PocketLab Full-Rig Protection).'
    });
    setTimeout(() => setSyncNotification(null), 4500);
  };

  // Toggle Module Bypass (0409 SysEx)
  const handleToggleModuleBypass = (modIdx) => {
    const targetMod = modules[modIdx];
    if (!targetMod) return;

    // Check if user is attempting to enable IR while in Clone/NAM mode
    const isIr = targetMod.name === 'IR' || targetMod.name === 'CAB' || targetMod.moduleId === 4;
    if (isIr && ampMode === 'Clone' && !targetMod.enabled) {
      handleAttemptIrWhileNam();
      return;
    }

    const updated = [...modules];
    const newEnabled = !updated[modIdx].enabled;
    updated[modIdx] = { ...updated[modIdx], enabled: newEnabled };
    setModules(updated);
    
    const targetModuleId = updated[modIdx].moduleId;
    bleService.sendModuleBypass(targetModuleId, newEnabled);
    midiService.sendModuleBypass(targetModuleId, newEnabled);
  };

  // Toggle Amp Mode (Factory Amp [Module 3] vs NAM Clone [Module 9])
  const handleToggleAmpMode = (newMode) => {
    const isClone = newMode === 'Clone';
    setAmpMode(newMode);

    const replacementAmp = getAmpModuleDefinition(isClone);
    setModules(prev => prev.map(m => {
      const isAmp = m.name === 'AMP' || m.name === 'Clone' || m.moduleId === 3 || m.moduleId === 9;
      if (isAmp && replacementAmp) {
        return {
          ...replacementAmp,
          enabled: m.enabled
        };
      }
      // When entering Clone Mode, automatically bypass IR module
      const isIr = m.name === 'IR' || m.name === 'CAB' || m.moduleId === 4;
      if (isIr && isClone) {
        return {
          ...m,
          enabled: false
        };
      }
      return m;
    }));

    // Transmit Amp Mode SysEx to hardware
    midiService.sendAmpMode(isClone);
    bleService.sendAmpMode(isClone);

    // If Clone Mode, force IR module bypass on hardware
    if (isClone) {
      midiService.sendModuleBypass(4, false);
      bleService.sendModuleBypass(4, false);
    }
  };

  // Global Keyboard Shortcuts (Footswitch 1-4, Preset Prev/Next, Bank Step, Bypass, Tuner)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // 1. Guard against typing inside input, textarea, select, contenteditable
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target.isContentEditable) {
        return;
      }
      // 2. Ignore with modifier keys (Ctrl, Alt, Meta) so browser/OS shortcuts work normally
      if (e.ctrlKey || e.metaKey || e.altKey) {
        return;
      }

      // Pocket Master bank & group arithmetic:
      // Bank 1: User (0..49) -> P01..P50
      // Bank 2: Factory (50..99) -> F01..F50
      // Each bank is divided into 4-preset footswitch groups
      const isUser = currentPresetIndex < 50;
      const bankOffset = isUser ? 0 : 50;
      const currentInBank = currentPresetIndex - bankOffset;
      const groupIndex = Math.floor(currentInBank / 4);
      const baseIdx = bankOffset + (groupIndex * 4);
      const maxIdx = isUser ? 49 : 99;

      // Keybind 1: Footswitch 1 (e.g. P01)
      if (e.key === '1' || e.code === 'Digit1' || e.code === 'Numpad1') {
        const target = baseIdx + 0;
        if (target <= maxIdx) handleSelectPreset(target);
        return;
      }

      // Keybind 2: Footswitch 2 (e.g. P02)
      if (e.key === '2' || e.code === 'Digit2' || e.code === 'Numpad2') {
        const target = baseIdx + 1;
        if (target <= maxIdx) handleSelectPreset(target);
        return;
      }

      // Keybind 3: Footswitch 3 (e.g. P03)
      if (e.key === '3' || e.code === 'Digit3' || e.code === 'Numpad3') {
        const target = baseIdx + 2;
        if (target <= maxIdx) handleSelectPreset(target);
        return;
      }

      // Keybind 4: Footswitch 4 (e.g. P04)
      if (e.key === '4' || e.code === 'Digit4' || e.code === 'Numpad4') {
        const target = baseIdx + 3;
        if (target <= maxIdx) handleSelectPreset(target);
        return;
      }

      // Arrow Left / Right: Previous / Next Preset (Step by 1)
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNextPreset();
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevPreset();
        return;
      }

      // Arrow Up / PageUp: Previous Bank Group (Step by 4)
      if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        const target = Math.max(bankOffset, baseIdx - 4);
        handleSelectPreset(target);
        return;
      }

      // Arrow Down / PageDown: Next Bank Group (Step by 4)
      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault();
        const target = Math.min(maxIdx, baseIdx + 4);
        handleSelectPreset(target);
        return;
      }

      // 'b' or 'B': Toggle Bank (USER P01-P50 <-> FACTORY F01-F50)
      if (e.key === 'b' || e.key === 'B') {
        const target = isUser ? Math.min(99, currentPresetIndex + 50) : Math.max(0, currentPresetIndex - 50);
        handleSelectPreset(target);
        return;
      }

      // Spacebar: Toggle Bypass on currently selected module
      if (e.key === ' ') {
        e.preventDefault();
        if (selectedModuleIndex >= 0 && selectedModuleIndex < modules.length) {
          handleToggleModuleBypass(selectedModuleIndex);
        }
        return;
      }

      // '[' and ']': Navigate Previous / Next Module in Signal Chain
      if (e.key === '[') {
        e.preventDefault();
        setSelectedModuleIndex(prev => (prev - 1 + modules.length) % modules.length);
        return;
      }
      if (e.key === ']') {
        e.preventDefault();
        setSelectedModuleIndex(prev => (prev + 1) % modules.length);
        return;
      }

      // 't' or 'T': Toggle Tuner
      if (e.key === 't' || e.key === 'T') {
        setIsTunerOpen(prev => !prev);
        return;
      }

      // 'p' or 'P': Toggle Preset Drawer
      if (e.key === 'p' || e.key === 'P') {
        setIsPresetsDrawerOpen(prev => !prev);
        return;
      }

      // Escape: Close open modals
      if (e.key === 'Escape') {
        setIsTunerOpen(false);
        setIsPresetsDrawerOpen(false);
        setIsConnectModalOpen(false);
        setIsSettingsOpen(false);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentPresetIndex, selectedModuleIndex, modules, presets.length]);

  // Update Global Hardware Levels (Global Vol, Input Level, FX Rec, BT Rec, Monitor Level)
  const handleUpdateGlobalParam = (paramName, value) => {
    setGlobalSettings(prev => ({ ...prev, [paramName]: value }));
    if (paramName === 'globalVolume') {
      setMasterVolume(value);
    }
    midiService.sendGlobalSetting(paramName, value);
    bleService.sendGlobalSetting(paramName, value);
  };

  // Force query hardware for all global level settings
  const handleRefreshGlobals = () => {
    midiService.requestGlobalSettings();
    bleService.requestGlobalSettings();
  };

  // Import Neural Amp Modeler (.nam / .json / .namb) file into selected slot (1..5)
  const handleImportNam = (slotIndex, parsedResult, file) => {
    const isParsedObj = typeof parsedResult === 'object' && parsedResult !== null;
    const cleanName = isParsedObj ? (parsedResult.cleanSlotName || parsedResult.gearName?.slice(0, 10)) : String(parsedResult).slice(0, 10);
    const archLabel = isParsedObj ? parsedResult.architectureLabel : 'NAM Model';
    const gearFull = isParsedObj ? (parsedResult.gearName || cleanName) : cleanName;

    setCloneAmpNames(prev => {
      const next = [...prev];
      next[slotIndex] = cleanName;
      return next;
    });

    if (isParsedObj) {
      setCloneAmpMetadata(prev => {
        const next = { ...prev, [slotIndex]: parsedResult };
        try {
          localStorage.setItem('soniclink_clone_amp_meta', JSON.stringify(next));
        } catch (e) {}
        return next;
      });
    }

    setModules(prev => prev.map(m => {
      const isAmp = m.name === 'AMP' || m.name === 'Clone' || m.moduleId === 3 || m.moduleId === 9;
      if (!isAmp) return m;
      const effects = m.effects.map(ef => {
        if (ef.fxid === 901 + slotIndex) {
          return {
            ...ef,
            name: cleanName,
            type: archLabel,
            origin: isParsedObj && parsedResult.author ? `Modeled by: ${parsedResult.author}` : ef.origin
          };
        }
        return ef;
      });
      return { ...m, effects };
    }));

    // Trigger effect selection on hardware
    const targetFxId = 901 + slotIndex;
    const bleCmd = getEffectTypeSysEx(9, targetFxId, true);
    const usbCmd = getEffectTypeSysEx(9, targetFxId, false);
    if (bleCmd) bleService.writeHexCommand(bleCmd);
    if (usbCmd) midiService.sendHexSysEx(usbCmd);

    const isV2 = isParsedObj && parsedResult.isV2;
    const variantTag = isParsedObj && parsedResult.variant ? ` (${parsedResult.variant})` : '';
    setSyncNotification({
      type: 'success',
      text: `Profile ${archLabel}${variantTag} "${gearFull}" successfully loaded into Profile ${slotIndex + 1}!${isV2 ? ' (Normalized: 0.7.0 / 48kHz)' : ''}`
    });
    setTimeout(() => setSyncNotification(null), 4500);
  };

  // Import Cabinet Impulse Response (.wav) file into selected User IR slot (1..5)
  const handleImportIr = (slotIndex, cleanName, file) => {
    setUserIrNames(prev => {
      const next = [...prev];
      next[slotIndex] = cleanName;
      return next;
    });

    setModules(prev => prev.map(m => {
      const isIr = m.name === 'IR' || m.name === 'CAB' || m.moduleId === 4;
      if (!isIr) return m;
      const effects = m.effects.map(ef => {
        if (ef.fxid === 416 + slotIndex) {
          return { ...ef, name: cleanName, type: cleanName };
        }
        return ef;
      });
      return { ...m, effects };
    }));

    // Trigger effect selection on hardware
    const targetFxId = 416 + slotIndex;
    const bleCmd = getEffectTypeSysEx(4, targetFxId, true);
    const usbCmd = getEffectTypeSysEx(4, targetFxId, false);
    if (bleCmd) bleService.writeHexCommand(bleCmd);
    if (usbCmd) midiService.sendHexSysEx(usbCmd);

    setSyncNotification({
      type: 'success',
      text: `Impulse Response "${cleanName}" (.wav) successfully loaded into User IR ${slotIndex + 1}!`
    });
    setTimeout(() => setSyncNotification(null), 4000);
  };

  // Update a parameter knob value (0408 SysEx)
  const handleUpdateParam = (paramIdx, newVal) => {
    const updated = [...modules];
    const mod = { ...updated[selectedModuleIndex] };
    const effects = [...mod.effects];
    const currentFx = { ...effects[mod.currentFxIndex] };
    const alg = [...(currentFx.alg || [])];
    
    alg[paramIdx] = { ...alg[paramIdx], value: newVal };
    currentFx.alg = alg;
    effects[mod.currentFxIndex] = currentFx;
    mod.effects = effects;
    updated[selectedModuleIndex] = mod;
    setModules(updated);

    const algId = alg[paramIdx]?.algId || paramIdx;
    bleService.sendParameterChange(mod.moduleId, algId, newVal);
    midiService.sendParameterChange(mod.moduleId, algId, newVal);
  };

  // Switch Effect Model within module (0407 SysEx)
  const handleSelectEffectModel = (fxIndex) => {
    const updated = [...modules];
    updated[selectedModuleIndex] = {
      ...updated[selectedModuleIndex],
      currentFxIndex: fxIndex
    };
    setModules(updated);
    const currentMod = updated[selectedModuleIndex];
    const fx = currentMod.effects[fxIndex];
    if (fx && fx.fxid !== undefined) {
      const bleCmd = getEffectTypeSysEx(currentMod.moduleId, fx.fxid, true);
      const usbCmd = getEffectTypeSysEx(currentMod.moduleId, fx.fxid, false);
      if (bleCmd) bleService.writeHexCommand(bleCmd);
      if (usbCmd) midiService.sendHexSysEx(usbCmd);
    }
  };

  // Patch Volume Change (0402 SysEx)
  const handleChangePatchVolume = (newVal) => {
    setPatchVolume(newVal);
    midiService.sendPresetVolume(newVal);
    bleService.sendPresetVolume(newVal);
  };

  // Reorder module in chain (Enforcing FIXED CORE: DRV -> AMP -> IR -> EQ cannot move or separate)
  const handleMoveModule = (moduleName, direction) => {
    const currentOrder = modules.map(m => m.name);
    const newOrder = moveModuleInChain(currentOrder, moduleName, direction);
    if (!newOrder) {
      setSyncNotification({
        type: 'warning',
        text: `Module ${moduleName} is part of the fixed core block DRV-AMP-IR-EQ and cannot be moved.`
      });
      setTimeout(() => setSyncNotification(null), 2500);
      return;
    }

    setModules(prev => {
      const reordered = [];
      newOrder.forEach(name => {
        const found = prev.find(m => m.name === name);
        if (found) reordered.push(found);
      });
      return reordered;
    });

    // Send 0404 Chain Order SysEx to hardware
    midiService.sendChainOrder(newOrder);
    bleService.sendChainOrder(newOrder);
  };

  // Save current preset to pedal hardware EEPROM
  const handleSavePreset = async () => {
    const updated = [...presets];
    updated[currentPresetIndex] = {
      ...updated[currentPresetIndex],
      modules: JSON.parse(JSON.stringify(modules)),
      patchVolume
    };
    setPresets(updated);
    try {
      localStorage.setItem('pocketmaster_presets', JSON.stringify(updated));
    } catch (e) {}

    await bleService.sendSavePreset(currentPresetIndex, currentPreset.name);
    midiService.sendSavePreset(currentPresetIndex, currentPreset.name);

    const slotCode = currentPreset.slotCode || getPresetSlotCode(currentPresetIndex);
    setSyncNotification({
      type: 'success',
      text: `Preset ${slotCode}: ${currentPreset.name} successfully saved to pedal memory!`
    });
    setTimeout(() => setSyncNotification(null), 4000);
  };

  const handleSavePresetName = (idx, newName) => {
    const updated = [...presets];
    updated[idx] = { ...updated[idx], name: newName };
    setPresets(updated);
    try {
      localStorage.setItem('pocketmaster_presets', JSON.stringify(updated));
    } catch (e) {}
    bleService.sendSavePreset(idx, newName);
    midiService.sendSavePreset(idx, newName);
  };

  // Export Presets to JSON file
  const handleExportPresets = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
      version: "1.0.0",
      device: currentDevice.code,
      presets: presets
    }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `PocketLab_${currentDevice.code}_Presets.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import Presets from file
  const handleImportPresets = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (parsed && parsed.presets) {
          setPresets(parsed.presets);
          alert('Presets imported successfully!');
        }
      } catch (err) {
        alert('Invalid preset JSON file format.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      width: '100vw',
      background: 'linear-gradient(180deg, #0d0f15 0%, #08090d 100%)',
      overflow: 'hidden'
    }}>
      {/* Top Header */}
      <Header
        currentDevice={currentDevice}
        onSelectDevice={setCurrentDevice}
        connectionStatus={connectionStatus}
        onOpenConnectModal={() => setIsConnectModalOpen(true)}
        currentPresetIndex={currentPresetIndex}
        currentSlotCode={currentPreset.slotCode || getPresetSlotCode(currentPresetIndex)}
        currentPresetName={currentPreset.name}
        onPrevPreset={handlePrevPreset}
        onNextPreset={handleNextPreset}
        onOpenTuner={() => setIsTunerOpen(true)}
        onOpenSettings={() => {
          setIsSettingsOpen(true);
          handleRefreshGlobals();
        }}
        onSavePreset={handleSavePreset}
        onOpenPresetsDrawer={() => setIsPresetsDrawerOpen(true)}
        masterVolume={globalSettings.globalVolume !== undefined ? globalSettings.globalVolume : masterVolume}
        onChangeMasterVolume={(val) => handleUpdateGlobalParam('globalVolume', val)}
      />

      {/* Hardware Sync Notification Banner */}
      {syncNotification && (
        <div style={{
          margin: '0 16px 8px 16px',
          background: syncNotification.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          border: `1px solid ${syncNotification.type === 'success' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
          borderRadius: '10px',
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: syncNotification.type === 'success' ? '#a7f3d0' : '#fca5a5',
          fontSize: '12px',
          fontWeight: 600,
          boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
          animation: 'fadeIn 0.3s ease-in'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Check size={16} color="var(--accent-emerald)" />
            <span>{syncNotification.text}</span>
          </div>
          <button
            onClick={() => setSyncNotification(null)}
            style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', padding: '4px' }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Main Signal Chain Routing View with Patch Volume & Locked Core */}
      <EffectChain
        modules={modules}
        selectedModuleIndex={selectedModuleIndex}
        onSelectModule={setSelectedModuleIndex}
        onToggleModuleBypass={handleToggleModuleBypass}
        onMoveModule={handleMoveModule}
        patchVolume={patchVolume}
        onChangePatchVolume={handleChangePatchVolume}
        ampMode={ampMode}
        onAttemptIrWhileNam={handleAttemptIrWhileNam}
      />

      {/* Effect Parameters & Knobs Editor */}
      <ModuleEditor
        module={modules[selectedModuleIndex]}
        onUpdateParam={handleUpdateParam}
        onSelectEffectModel={handleSelectEffectModel}
        onToggleBypass={() => handleToggleModuleBypass(selectedModuleIndex)}
        ampMode={ampMode}
        onToggleAmpMode={handleToggleAmpMode}
        cloneAmpNames={cloneAmpNames}
        cloneAmpMetadata={cloneAmpMetadata}
        onImportNam={handleImportNam}
        userIrNames={userIrNames}
        onImportIr={handleImportIr}
      />

      {/* Live Hardware Footswitch Bar */}
      <FootswitchBar
        currentPresetIndex={currentPresetIndex}
        onSelectPreset={handleSelectPreset}
        presets={presets}
      />

      {/* Modals */}
      <TunerModal
        isOpen={isTunerOpen}
        onClose={() => setIsTunerOpen(false)}
      />

      <PresetManager
        isOpen={isPresetsDrawerOpen}
        onClose={() => setIsPresetsDrawerOpen(false)}
        presets={presets}
        currentPresetIndex={currentPresetIndex}
        onSelectPreset={handleSelectPreset}
        onSavePresetName={handleSavePresetName}
        onExportPresets={handleExportPresets}
        onImportPresets={handleImportPresets}
        connectionStatus={connectionStatus}
      />

      <DeviceSearchModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        currentDevice={currentDevice}
        connectionStatus={connectionStatus}
        onConnected={(info) => setConnectionStatus({ connected: true, simulated: info.simulated, name: info.name })}
      />

      <DeviceSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentDevice={currentDevice}
        globalSettings={globalSettings}
        onUpdateGlobalParam={handleUpdateGlobalParam}
        onRefreshGlobals={handleRefreshGlobals}
      />
    </div>
  );
}
