// SonicLink Bluetooth Low Energy (BLE) protocol service
// Reverse-engineered from SonicLink libapp.so and hardware protocol specifications

import {
  POCKET_MASTER_COMMANDS,
  buildPresetSelectSysEx,
  buildSavePresetSysEx,
  parsePacketForNames,
  getPresetSlotCode,
  getModuleBypassSysEx,
  getParameterSysEx,
  getPresetVolumeSysEx,
  getChainOrderSysEx,
  getGlobalSettingSysEx,
  getAmpModeSysEx,
  decodeGlobalSettingsDump,
  decodeUserNamesDump,
  decodeFullPresetDump,
  parseRealtimeSysEx
} from './pocketMasterProtocol';

export const SONICLINK_BLE_SERVICE_UUID = '03b80e5a-ede8-4b33-a751-6ce34ec4c700';

class BleService {
  constructor() {
    this.device = null;
    this.server = null;
    this.service = null;
    this.writeChar = null;
    this.notifyChar = null;
    this.isConnected = false;
    this.isSimulated = false;
    this.listeners = new Map();
    this.nameDumpPackets = [];
    this.isSyncingNames = false;
    this.nameSyncTimer = null;
    this.presetDumpPackets = [];
    this.isWaitingForPresetDump = false;
    this.presetDumpTimer = null;
    this._lastAppCommandSentTime = 0;
    this._presetModifiedDebounceTimer = null;
    this._lastPresetModifiedFetch = 0;
    this._screenChangeDebounceTimer = null;
    this._chainPresetDumpNext = false;
  }

  isSupported() {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator && !!navigator.bluetooth;
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
    return () => {
      const arr = this.listeners.get(event) || [];
      this.listeners.set(event, arr.filter(cb => cb !== callback));
    };
  }

  emit(event, data) {
    const arr = this.listeners.get(event) || [];
    arr.forEach(cb => cb(data));
  }

  async scanAndConnect() {
    if (!this.isSupported()) {
      return {
        success: false,
        reason: 'unsupported_browser',
        message: 'Web Bluetooth is not enabled in this browser. In Google Chrome or Brave on Linux, open chrome://flags/#enable-web-bluetooth, set to Enabled, and restart the browser. Or connect via USB MIDI.'
      };
    }

    try {
      this.device = await navigator.bluetooth.requestDevice({
        filters: [
          { namePrefix: 'Pocket' },
          { namePrefix: 'Sonicake' },
          { namePrefix: 'QME' },
          { services: [SONICLINK_BLE_SERVICE_UUID] },
          { services: ['03b80e5a-ede8-4b33-a751-6ce34ec4c700'] },
          { services: ['7772e5db-3868-4112-a1a9-f2669d106bf3'] }
        ],
        optionalServices: [
          SONICLINK_BLE_SERVICE_UUID,
          '03b80e5a-ede8-4b33-a751-6ce34ec4c700',
          '7772e5db-3868-4112-a1a9-f2669d106bf3',
          '0000ffe0-0000-1000-8000-00805f9b34fb',
          'generic_access'
        ]
      });

      this.device.addEventListener('gattserverdisconnected', () => {
        this.isConnected = false;
        this.isSimulated = false;
        this.emit('disconnected', null);
      });

      const connectWithTimeout = (targetServer, timeoutMs = 7000) => {
        return Promise.race([
          targetServer.connect(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('GATT connection timeout (7 seconds). Ensure pedal is not connected to a smartphone or another Bluetooth host.')), timeoutMs)
          )
        ]);
      };

      try {
        this.server = await connectWithTimeout(this.device.gatt);
      } catch (firstConnectErr) {
        console.warn('Initial GATT connect failed, retrying after 600ms...', firstConnectErr);
        await new Promise(r => setTimeout(r, 600));
        this.server = await connectWithTimeout(this.device.gatt, 8000);
      }

      // Discover GATT Primary Services
      const services = await this.server.getPrimaryServices();
      for (const s of services) {
        const chars = await s.getCharacteristics();
        for (const c of chars) {
          if (c.properties.write || c.properties.writeWithoutResponse) {
            this.writeChar = c;
          }
          if (c.properties.notify || c.properties.indicate) {
            this.notifyChar = c;
          }
        }
      }

      if (this.notifyChar) {
        await this.notifyChar.startNotifications();
        this.notifyChar.addEventListener('characteristicvaluechanged', (e) => {
          this.handleIncomingData(e.target.value);
        });
      }

      this.isConnected = true;
      this.isSimulated = false;
      this.emit('connected', { name: this.device.name || 'Pocket Master BLE', simulated: false });
      return { success: true, simulated: false, name: this.device.name || 'Pocket Master BLE' };
    } catch (err) {
      console.warn('Bluetooth connection failed:', err);
      return {
        success: false,
        reason: err.name || 'error',
        message: err.message || 'Failed to connect to Bluetooth device.'
      };
    }
  }

  connectSimulated(deviceName = 'Pocket Master (Simulated)') {
    this.isConnected = true;
    this.isSimulated = true;
    this.emit('connected', { name: deviceName, simulated: true });
    return { success: true, simulated: true, name: deviceName };
  }

  disconnect() {
    if (this.device && this.device.gatt && this.device.gatt.connected) {
      this.device.gatt.disconnect();
    }
    this.isConnected = false;
    this.isSimulated = false;
    this.emit('disconnected', null);
  }

  async writeHexCommand(hexString) {
    if (!this.isConnected || this.isSimulated || !this.writeChar) return;
    this._lastAppCommandSentTime = Date.now();
    const cleanHex = hexString.replace(/[^0-9a-fA-F]/g, '');
    const bytes = new Uint8Array(cleanHex.length / 2);
    for (let i = 0; i < cleanHex.length; i += 2) {
      bytes[i / 2] = parseInt(cleanHex.substr(i, 2), 16);
    }
    try {
      if (this.writeChar.writeValueWithoutResponse) {
        await this.writeChar.writeValueWithoutResponse(bytes);
      } else if (this.writeChar.writeValue) {
        await this.writeChar.writeValue(bytes);
      }
    } catch (e) {
      console.warn('BLE writeHexCommand failed:', e);
    }
  }

  // Send parameter change packet to hardware (0408)
  async sendParameterChange(moduleId, paramId, value) {
    const hex = getParameterSysEx(moduleId, paramId, value, true);
    if (hex) {
      await this.writeHexCommand(hex);
    }
    this.emit('parameterChanged', { moduleId, paramId, value, fromHardware: false });
  }

  // Send module bypass state (ON/OFF - 0409)
  async sendModuleBypass(moduleId, enabled) {
    const hex = getModuleBypassSysEx(moduleId, enabled, true);
    if (hex) {
      await this.writeHexCommand(hex);
    }
    this.emit('bypassChanged', { moduleId, enabled, fromHardware: false });
  }

  // Send Preset Volume (0402)
  async sendPresetVolume(volume) {
    const hex = getPresetVolumeSysEx(volume, true);
    if (hex) {
      await this.writeHexCommand(hex);
    }
    this.emit('presetVolumeChanged', { value: volume, fromHardware: false });
  }

  // Send Chain Order (0404)
  async sendChainOrder(order) {
    const hex = getChainOrderSysEx(order, true);
    if (hex) {
      await this.writeHexCommand(hex);
    }
    this.emit('chainOrderChanged', { order, fromHardware: false });
  }

  // Send Global Setting (globalVolume, inputLevel, fxRecLevel, btRecLevel, monitorLevel)
  async sendGlobalSetting(paramName, value) {
    const hex = getGlobalSettingSysEx(paramName, value, true);
    if (hex) {
      await this.writeHexCommand(hex);
    }
    this.emit('globalSettingChanged', { paramName, value, fromHardware: false });
  }

  // Send Amp Mode Switch (Factory = false, Clone/NAM = true)
  async sendAmpMode(isClone) {
    const hex = getAmpModeSysEx(isClone, true);
    if (hex) {
      await this.writeHexCommand(hex);
    }
    this.emit('ampModeChanged', { isClone, mode: isClone ? 'Clone' : 'Normal', fromHardware: false });
  }

  // Request Global Settings
  async requestGlobalSettings(chainNext = false) {
    if (!this.writeCharacteristic) return;
    this.isWaitingForGlobals = true;
    this._chainGlobalsNext = chainNext;
    await this.writeHexCommand(POCKET_MASTER_COMMANDS.REQUEST_GLOBALS_BLE);
    clearTimeout(this.globalsTimeoutId);
    this.globalsTimeoutId = setTimeout(() => {
      this.isWaitingForGlobals = false;
      if (this._chainGlobalsNext) {
        this._chainGlobalsNext = false;
        this.requestCloneAmpNames();
      }
    }, 2500);
  }

  // Request Clone Amp Names
  async requestCloneAmpNames() {
    this.isWaitingForCloneAmps = true;
    await this.writeHexCommand(POCKET_MASTER_COMMANDS.REQUEST_CLONE_AMPS_BLE);
    setTimeout(() => {
      this.isWaitingForCloneAmps = false;
      this.requestUserIrNames();
    }, 2500);
  }

  // Request User IR Names
  async requestUserIrNames() {
    this.isWaitingForUserIr = true;
    await this.writeHexCommand(POCKET_MASTER_COMMANDS.REQUEST_USER_IR_BLE);
    setTimeout(() => {
      this.isWaitingForUserIr = false;
    }, 2500);
  }

  // Send preset switch command
  async sendPresetChange(presetIndex) {
    const sysex = buildPresetSelectSysEx(presetIndex, true);
    await this.writeHexCommand(sysex);

    const slotCode = getPresetSlotCode(presetIndex);
    this.emit('presetChanged', { index: presetIndex, slotCode, fromHardware: false });

    // Request preset state dump from hardware after switching
    setTimeout(() => {
      this.requestPresetState();
    }, 150);
  }

  // Save current preset to pedal hardware memory
  async sendSavePreset(presetIndex, name = '') {
    const sysex = buildSavePresetSysEx(presetIndex, name, true);
    await this.writeHexCommand(sysex);
    const slotCode = getPresetSlotCode(presetIndex);
    this.emit('presetSaved', { index: presetIndex, slotCode, name, fromHardware: false });
  }

  // Request current preset 5-packet state dump
  async requestPresetState(chainGlobals = false) {
    this.presetDumpPackets = [];
    this.isWaitingForPresetDump = true;
    this._chainPresetDumpNext = chainGlobals;
    await this.writeHexCommand(POCKET_MASTER_COMMANDS.REQUEST_PRESET_STATE_BLE);

    if (this.presetDumpTimer) clearTimeout(this.presetDumpTimer);
    this.presetDumpTimer = setTimeout(() => {
      this.isWaitingForPresetDump = false;
    }, 3500);
  }

  // Query pedal hardware for real preset names dump and current active preset
  async requestHardwareSync() {
    this.nameDumpPackets = [];
    this.isSyncingNames = true;
    this.emit('syncStarted', true);

    // 1. Send Request All Preset Names
    await this.writeHexCommand(POCKET_MASTER_COMMANDS.REQUEST_PRESET_NAMES_BLE);

    if (this.nameSyncTimer) clearTimeout(this.nameSyncTimer);
    this.nameSyncTimer = setTimeout(() => {
      if (this.isSyncingNames && this.nameDumpPackets.length > 0) {
        this.processNameDump();
      }
    }, 2500);

    // 2. Request current active preset and preset state
    setTimeout(() => {
      this.writeHexCommand(POCKET_MASTER_COMMANDS.REQUEST_CURRENT_PRESET_BLE);
      this.requestPresetState(true);
    }, 400);
  }

  processNameDump() {
    this.isSyncingNames = false;
    if (this.nameSyncTimer) clearTimeout(this.nameSyncTimer);
    try {
      const allNames = this.nameDumpPackets.flatMap(packet => parsePacketForNames(packet.slice(6, -2)));
      if (allNames && allNames.length > 0) {
        this.emit('presetNamesLoaded', allNames);
      }
    } catch (e) {
      console.warn('Error parsing names dump:', e);
    }
  }

  handleIncomingData(dataView) {
    const bytes = new Uint8Array(dataView.buffer);
    this.emit('dataReceived', bytes);

    const hexString = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();

    // 1. Check if receiving name dump packet
    if (this.isSyncingNames && hexString.startsWith('8080F0') && hexString.endsWith('F7')) {
      if (hexString === POCKET_MASTER_COMMANDS.TERMINATOR_PACKET_BLE) {
        this.processNameDump();
        return;
      } else {
        this.nameDumpPackets.push(hexString);
        if (this.nameSyncTimer) clearTimeout(this.nameSyncTimer);
        this.nameSyncTimer = setTimeout(() => {
          if (this.isSyncingNames && this.nameDumpPackets.length > 0) {
            this.processNameDump();
          }
        }, 1500);
        return;
      }
    }

    // 2. Check if receiving 5-packet Preset State Dump
    if (this.isWaitingForPresetDump && hexString.startsWith('8080F0') && hexString.endsWith('F7') && hexString.length > 50) {
      this.presetDumpPackets.push(hexString);
      if (this.presetDumpPackets.length >= 5) {
        this.isWaitingForPresetDump = false;
        if (this.presetDumpTimer) clearTimeout(this.presetDumpTimer);
        try {
          const fullData = decodeFullPresetDump(this.presetDumpPackets, false);
          if (fullData) {
            console.log('[BLE] Decoded 5-Packet Preset Dump:', fullData);
            this.emit('presetStateLoaded', fullData);

            // Auto-sync next step: request globals only if chained during full sync
            if (this._chainPresetDumpNext) {
              this._chainPresetDumpNext = false;
              setTimeout(() => this.requestGlobalSettings(true), 150);
            }
          }
        } catch (e) {
          console.warn('[BLE] Error decoding preset dump:', e);
        }
      }
      return;
    }

    // 3. Check for Global Settings Dump
    if (this.isWaitingForGlobals || (hexString.length > 200 && hexString.length < 350)) {
      const decodedGlobals = decodeGlobalSettingsDump(hexString);
      if (decodedGlobals) {
        const shouldChain = this._chainGlobalsNext;
        this.isWaitingForGlobals = false;
        this._chainGlobalsNext = false;
        clearTimeout(this.globalsTimeoutId);
        console.log('[BLE] Decoded Global Settings:', decodedGlobals);
        this.emit('globalSettingsLoaded', decodedGlobals);
        if (shouldChain) {
          setTimeout(() => this.requestCloneAmpNames(), 150);
        }
        return;
      }
    }

    // 4. Check for Clone Amp Names Dump
    if (this.isWaitingForCloneAmps && hexString.length > 50) {
      const names = decodeUserNamesDump(hexString, 'Clone');
      if (names && names.length > 0) {
        this.isWaitingForCloneAmps = false;
        console.log('[BLE] Decoded Clone Amp Names:', names);
        this.emit('cloneAmpNamesLoaded', names);
        setTimeout(() => this.requestUserIrNames(), 150);
        return;
      }
    }

    // 5. Check for User IR Names Dump
    if (this.isWaitingForUserIr && hexString.length > 50) {
      const names = decodeUserNamesDump(hexString, 'IR');
      if (names && names.length > 0) {
        this.isWaitingForUserIr = false;
        console.log('[BLE] Decoded User IR Names:', names);
        this.emit('userIrNamesLoaded', names);
        return;
      }
    }

    // Fast-path direct check for Preset Modified / Saved notifications from hardware
    if (hexString.includes('010204050001') || hexString.includes('070A000100000003010204050001')) {
      console.log('[BLE] Preset Modified notification from hardware');
      this.emit('presetModified', { modified: true, fromHardware: true });
      const now = Date.now();
      if (now - this._lastAppCommandSentTime >= 500) {
        clearTimeout(this._presetModifiedDebounceTimer);
        const timeSinceLastFetch = now - (this._lastPresetModifiedFetch || 0);
        if (timeSinceLastFetch > 350 && !this.isWaitingForPresetDump) {
          this._lastPresetModifiedFetch = now;
          this.requestPresetState(false);
        } else {
          this._presetModifiedDebounceTimer = setTimeout(() => {
            this._lastPresetModifiedFetch = Date.now();
            this.requestPresetState(false);
          }, 120);
        }
      }
      return;
    }

    if (hexString.includes('010204050000') || hexString.includes('070D000100000003010204050000')) {
      console.log('[BLE] Preset Saved notification from hardware');
      this.emit('presetModified', { modified: false, fromHardware: true });
      return;
    }

    // 6. Real-time SysEx parsing (bypass 0409, effect 0407, param 0408, vol 0402, chain 0404, pc 0403, globals 0101, modified 0405)
    try {
      const rt = parseRealtimeSysEx(hexString);
      if (rt) {
        if (rt.type === 'presetModified') {
          this.emit('presetModified', { modified: rt.modified, fromHardware: true });
          if (rt.modified) {
            const now = Date.now();
            if (now - this._lastAppCommandSentTime >= 500) {
              clearTimeout(this._presetModifiedDebounceTimer);
              const timeSinceLastFetch = now - (this._lastPresetModifiedFetch || 0);
              if (timeSinceLastFetch > 350 && !this.isWaitingForPresetDump) {
                this._lastPresetModifiedFetch = now;
                this.requestPresetState(false);
              } else {
                this._presetModifiedDebounceTimer = setTimeout(() => {
                  this._lastPresetModifiedFetch = Date.now();
                  this.requestPresetState(false);
                }, 120);
              }
            }
          }
        } else if (rt.type === 'screenChange') {
          clearTimeout(this._screenChangeDebounceTimer);
          this._screenChangeDebounceTimer = setTimeout(() => {
            this.requestGlobalSettings();
          }, 150);
        } else if (rt.type === 'bypass') {
          this.emit('bypassChanged', { moduleId: rt.moduleId, enabled: rt.enabled, fromHardware: true });
        } else if (rt.type === 'ampMode') {
          this.emit('ampModeChanged', { mode: rt.mode, isClone: rt.isClone, fromHardware: true });
        } else if (rt.type === 'effectType') {
          this.emit('effectTypeChanged', { moduleId: rt.moduleId, fxId: rt.fxId, effectName: rt.effectName, fromHardware: true });
        } else if (rt.type === 'parameter') {
          this.emit('parameterChanged', { moduleId: rt.moduleId, algId: rt.algId, value: rt.value, fromHardware: true });
        } else if (rt.type === 'presetVolume') {
          this.emit('presetVolumeChanged', { value: rt.value, fromHardware: true });
        } else if (rt.type === 'globalSetting') {
          this.emit('globalSettingChanged', { paramName: rt.paramName, value: rt.value, fromHardware: true });
        } else if (rt.type === 'chainOrder') {
          this.emit('chainOrderChanged', { order: rt.order, fromHardware: true });
        } else if (rt.type === 'presetSelect') {
          this.emit('presetChanged', { index: rt.index, slotCode: rt.slotCode, fromHardware: true });
          this.requestPresetState(false);
        }
        return;
      }
    } catch (e) {
      console.warn('[BLE] Realtime SysEx parse error:', e);
    }
  }
}

export const bleService = new BleService();
