// Web MIDI API service for Sonicake Pocket Master (QME20) USB MIDI connection
// Implements exact SysEx protocol, packet reassembly, and preset synchronization reverse-engineered from hardware specifications

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
  splitUsbDumpIntoPackets,
  decodePresetStateAndOrder,
  decodeSelectedEffects,
  decodeParameterValues,
  parseRealtimeSysEx
} from './pocketMasterProtocol';

class MidiService {
  constructor() {
    this.midiAccess = null;
    this.inputs = [];
    this.outputs = [];
    this.selectedInput = null;
    this.selectedOutput = null;
    this.usbDevicePairs = [];
    this.usbMidiBuffer = null;
    this.usbMultiPacketResponses = {};
    this.isSyncingNames = false;
    this.isWaitingForPresetNumber = false;
    this.isWaitingForPresetDump = false;
    this.isWaitingForGlobals = false;
    this.isWaitingForCloneAmps = false;
    this.isWaitingForUserIr = false;
    this.syncTimeoutId = null;
    this.presetNumberTimeoutId = null;
    this.presetDumpTimeoutId = null;
    this.globalsTimeoutId = null;
    this.cloneAmpsTimeoutId = null;
    this.userIrTimeoutId = null;
    this._lastAppCommandSentTime = 0;
    this._presetModifiedDebounceTimer = null;
    this._lastPresetModifiedFetch = 0;
    this._screenChangeDebounceTimer = null;
    this._chainPresetDumpNext = false;
    this.listeners = new Map();
  }

  isSupported() {
    return typeof navigator !== 'undefined' && 'requestMIDIAccess' in navigator;
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
    arr.forEach(cb => {
      try {
        cb(data);
      } catch (err) {
        console.error(`Error in MIDI listener for ${event}:`, err);
      }
    });
  }

  async init() {
    if (!this.isSupported()) {
      console.warn('Web MIDI not supported in this browser.');
      return false;
    }

    try {
      this.midiAccess = await navigator.requestMIDIAccess({ sysex: true });
      this.refreshPorts();

      this.midiAccess.onstatechange = () => {
        this.refreshPorts();
      };

      // Auto-connect if Pocket Master USB is detected
      const pocketDevice = this.usbDevicePairs.find(p => p.isPocketMaster);
      if (pocketDevice && !this.selectedInput) {
        this.connectUsb(pocketDevice);
      }

      return true;
    } catch (err) {
      console.warn('MIDI access request rejected or failed:', err);
      return false;
    }
  }

  refreshPorts() {
    if (!this.midiAccess) return [];
    this.inputs = Array.from(this.midiAccess.inputs.values());
    this.outputs = Array.from(this.midiAccess.outputs.values());

    const deviceMap = new Map();

    this.inputs.forEach(input => {
      const name = input.name || 'Unknown Input';
      if (!deviceMap.has(name)) {
        deviceMap.set(name, { input: null, output: null, inputName: name, outputName: '' });
      }
      deviceMap.get(name).input = input;
    });

    this.outputs.forEach(output => {
      const name = output.name || 'Unknown Output';
      let foundMatch = false;
      for (const [key, device] of deviceMap.entries()) {
        if (key === name || name.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(name.toLowerCase())) {
          device.output = output;
          device.outputName = name;
          foundMatch = true;
          break;
        }
      }
      if (!foundMatch) {
        deviceMap.set(name, { input: null, output: output, inputName: '', outputName: name });
      }
    });

    this.usbDevicePairs = Array.from(deviceMap.values())
      .filter(pair => pair.input && pair.output)
      .map(pair => {
        const name = pair.inputName || pair.outputName || 'MIDI Device';
        const isPocketMaster = /pocket|sonicake|qme20|master/i.test(name);
        return {
          name,
          input: pair.input,
          output: pair.output,
          isPocketMaster
        };
      });

    this.emit('portsChanged', {
      inputs: this.inputs,
      outputs: this.outputs,
      pairs: this.usbDevicePairs
    });

    return this.usbDevicePairs;
  }

  async detectUsbDevices() {
    if (!this.midiAccess) {
      await this.init();
    }
    return this.refreshPorts();
  }

  connectUsb(devicePair) {
    if (!devicePair || !devicePair.input || !devicePair.output) {
      console.warn('Invalid USB device pair to connect.');
      return false;
    }

    if (this.selectedInput) {
      this.selectedInput.onmidimessage = null;
    }

    this.selectedInput = devicePair.input;
    this.selectedOutput = devicePair.output;
    this.usbMidiBuffer = null;
    this.usbMultiPacketResponses = {};

    this.selectedInput.onmidimessage = (event) => this.handleMidiMessage(event);

    console.log(`[MIDI] Connected to USB: ${devicePair.name}`);
    this.emit('connected', {
      name: devicePair.name,
      type: 'usb',
      simulated: false
    });

    // Run sequential auto-sync immediately
    this.requestHardwareSync();
    return true;
  }

  disconnect() {
    if (this.selectedInput) {
      this.selectedInput.onmidimessage = null;
      this.selectedInput = null;
    }
    this.selectedOutput = null;
    this.emit('disconnected', null);
  }

  sendProgramChange(programNumber, channel = 0) {
    if (!this.selectedOutput) return;
    const pc = 0xC0 | (channel & 0x0F);
    try {
      this.selectedOutput.send([pc, programNumber & 0x7F]);
    } catch (err) {
      console.warn('MIDI PC send failed:', err);
    }
    this.emit('programChanged', programNumber);
  }

  sendControlChange(ccNumber, value, channel = 0) {
    if (!this.selectedOutput) return;
    const cc = 0xB0 | (channel & 0x0F);
    try {
      this.selectedOutput.send([cc, ccNumber & 0x7F, value & 0x7F]);
    } catch (err) {
      console.warn('MIDI CC send failed:', err);
    }
  }

  sendSysEx(bytes) {
    if (!this.selectedOutput) return;
    this._lastAppCommandSentTime = Date.now();
    try {
      this.selectedOutput.send(bytes);
    } catch (err) {
      console.warn('MIDI SysEx send failed:', err);
    }
  }

  sendHexSysEx(hexString) {
    if (!this.selectedOutput || !hexString) return;
    this._lastAppCommandSentTime = Date.now();
    let clean = hexString.replace(/[^0-9a-fA-F]/g, '');
    if (clean.toLowerCase().startsWith('8080')) {
      clean = clean.substring(4);
    }
    const bytes = clean.match(/[0-9a-fA-F]{2}/g).map(b => parseInt(b, 16));
    this.sendSysEx(bytes);
  }

  sendPresetChange(presetIndex) {
    // 1. Send standard MIDI Program Change (0xC0)
    this.sendProgramChange(presetIndex);

    // 2. Send Pocket Master SysEx command (F0 00 ... 0403 ... F7)
    const hex = buildPresetSelectSysEx(presetIndex, false);
    const bytes = hex.match(/[0-9a-fA-F]{2}/g).map(b => parseInt(b, 16));
    this.sendSysEx(bytes);

    const slotCode = getPresetSlotCode(presetIndex);
    this.emit('presetChanged', { index: presetIndex, slotCode, fromHardware: false });

    // 3. Request fresh preset state dump from hardware after switching
    setTimeout(() => {
      this.requestPresetState();
    }, 150);
  }

  sendSavePreset(presetIndex, name = '') {
    const hex = buildSavePresetSysEx(presetIndex, name, false);
    const bytes = hex.match(/[0-9a-fA-F]{2}/g).map(b => parseInt(b, 16));
    this.sendSysEx(bytes);

    const slotCode = getPresetSlotCode(presetIndex);
    this.emit('presetSaved', { index: presetIndex, slotCode, name, fromHardware: false });
  }

  // Send module bypass state over USB (0409)
  sendModuleBypass(moduleId, enabled) {
    const hex = getModuleBypassSysEx(moduleId, enabled, false);
    if (hex) {
      this.sendHexSysEx(hex);
    }
    this.emit('bypassChanged', { moduleId, enabled, fromHardware: false });
  }

  // Send parameter change over USB (0408)
  sendParameterChange(moduleId, paramId, value) {
    const hex = getParameterSysEx(moduleId, paramId, value, false);
    if (hex) {
      this.sendHexSysEx(hex);
    }
    this.emit('parameterChanged', { moduleId, paramId, value, fromHardware: false });
  }

  // Send Preset Volume (0402)
  sendPresetVolume(volume) {
    const hex = getPresetVolumeSysEx(volume, false);
    if (hex) {
      this.sendHexSysEx(hex);
    }
    this.emit('presetVolumeChanged', { value: volume, fromHardware: false });
  }

  // Send Chain Routing Order (0404)
  sendChainOrder(order) {
    const hex = getChainOrderSysEx(order, false);
    if (hex) {
      this.sendHexSysEx(hex);
    }
    this.emit('chainOrderChanged', { order, fromHardware: false });
  }

  // Send Global Setting (globalVolume, inputLevel, fxRecLevel, btRecLevel, monitorLevel)
  sendGlobalSetting(paramName, value) {
    const hex = getGlobalSettingSysEx(paramName, value, false);
    if (hex) {
      this.sendHexSysEx(hex);
    }
    this.emit('globalSettingChanged', { paramName, value, fromHardware: false });
  }

  // Send Amp Mode Switch (Factory = false, Clone/NAM = true)
  sendAmpMode(isClone) {
    const hex = getAmpModeSysEx(isClone, false);
    if (hex) {
      this.sendHexSysEx(hex);
    }
    this.emit('ampModeChanged', { isClone, mode: isClone ? 'Clone' : 'Normal', fromHardware: false });
  }

  // Request Global Settings (REQUEST_GLOBALS_USB)
  requestGlobalSettings(chainNext = false) {
    if (!this.selectedOutput) return;
    this.isWaitingForGlobals = true;
    this._chainGlobalsNext = chainNext;
    const hex = POCKET_MASTER_COMMANDS.REQUEST_GLOBALS_USB;
    const bytes = hex.match(/[0-9a-fA-F]{2}/g).map(b => parseInt(b, 16));
    this.sendSysEx(bytes);

    clearTimeout(this.globalsTimeoutId);
    this.globalsTimeoutId = setTimeout(() => {
      this.isWaitingForGlobals = false;
      if (this._chainGlobalsNext) {
        this._chainGlobalsNext = false;
        this.requestCloneAmpNames();
      }
    }, 2500);
  }

  // Request Clone Amp Names (REQUEST_CLONE_AMPS_USB)
  requestCloneAmpNames() {
    this.isWaitingForCloneAmps = true;
    const hex = POCKET_MASTER_COMMANDS.REQUEST_CLONE_AMPS_USB;
    const bytes = hex.match(/[0-9a-fA-F]{2}/g).map(b => parseInt(b, 16));
    this.sendSysEx(bytes);

    clearTimeout(this.cloneAmpsTimeoutId);
    this.cloneAmpsTimeoutId = setTimeout(() => {
      this.isWaitingForCloneAmps = false;
      this.requestUserIrNames();
    }, 2500);
  }

  // Request User IR Names (REQUEST_USER_IR_USB)
  requestUserIrNames() {
    this.isWaitingForUserIr = true;
    const hex = POCKET_MASTER_COMMANDS.REQUEST_USER_IR_USB;
    const bytes = hex.match(/[0-9a-fA-F]{2}/g).map(b => parseInt(b, 16));
    this.sendSysEx(bytes);

    clearTimeout(this.userIrTimeoutId);
    this.userIrTimeoutId = setTimeout(() => {
      this.isWaitingForUserIr = false;
    }, 2500);
  }

  // Request current preset state dump (0401)
  requestPresetState(chainGlobals = false) {
    this.isWaitingForPresetDump = true;
    this._chainPresetDumpNext = chainGlobals;
    const hexState = POCKET_MASTER_COMMANDS.REQUEST_PRESET_STATE_USB;
    const bytesState = hexState.match(/[0-9a-fA-F]{2}/g).map(b => parseInt(b, 16));
    this.sendSysEx(bytesState);

    clearTimeout(this.presetDumpTimeoutId);
    this.presetDumpTimeoutId = setTimeout(() => {
      this.isWaitingForPresetDump = false;
    }, 3500);
  }

  // Request current active preset index (0403)
  requestCurrentPreset() {
    this.isWaitingForPresetNumber = true;
    const hexCur = POCKET_MASTER_COMMANDS.REQUEST_CURRENT_PRESET_USB;
    const bytesCur = hexCur.match(/[0-9a-fA-F]{2}/g).map(b => parseInt(b, 16));
    this.sendSysEx(bytesCur);

    clearTimeout(this.presetNumberTimeoutId);
    this.presetNumberTimeoutId = setTimeout(() => {
      this.isWaitingForPresetNumber = false;
      this.requestPresetState();
    }, 2500);
  }

  // Sequential sync sequence: Names -> Current Preset -> Preset Dump
  requestHardwareSync() {
    this.isSyncingNames = true;
    this.emit('syncStarted', true);

    // 1. Request preset names dump over USB MIDI (F0 00 0E 00 01 00 00 00 02 01 02 04 00 F7)
    const hexNames = POCKET_MASTER_COMMANDS.REQUEST_PRESET_NAMES_USB;
    const bytesNames = hexNames.match(/[0-9a-fA-F]{2}/g).map(b => parseInt(b, 16));
    this.sendSysEx(bytesNames);

    clearTimeout(this.syncTimeoutId);
    this.syncTimeoutId = setTimeout(() => {
      if (this.isSyncingNames) {
        this.isSyncingNames = false;
        console.warn('[MIDI USB] Names sync timed out, querying active preset directly...');
        this.requestCurrentPreset();
      }
    }, 4000);
  }

  handleMidiMessage(event) {
    const data = event.data;
    if (!data || data.length === 0) return;

    // Ignore single-byte Realtime messages (Clock 0xF8, Active Sense 0xFE, etc.)
    if (data.length === 1 && data[0] >= 0xF8) {
      return;
    }

    const status = data[0];
    const command = status >> 4;
    const channel = status & 0x0F;

    // 1. Program Change (Pedal physical switch)
    if (command === 0x0C) {
      const prog = data[1];
      const slotCode = getPresetSlotCode(prog);
      this.emit('presetChanged', { index: prog, slotCode, fromHardware: true });
      setTimeout(() => {
        this.requestPresetState();
      }, 150);
      return;
    }

    // 2. Control Change (Pedal CC messages)
    if (command === 0x0B) {
      const cc = data[1];
      const val = data[2];
      this.emit('controlChange', { cc, value: val, channel, fromHardware: true });
      return;
    }

    // 3. SysEx Messages
    let message = data;

    // Buffer fragmented SysEx chunks if not complete
    if (data.length < 4 || data[0] !== 0xF0 || data[data.length - 1] !== 0xF7) {
      if (this.usbMidiBuffer === null) {
        if (data[0] === 0xF0) {
          this.usbMidiBuffer = new Uint8Array(data);
        } else {
          return; // Ignore stray non-SysEx bytes
        }
      } else {
        const combined = new Uint8Array(this.usbMidiBuffer.length + data.length);
        combined.set(this.usbMidiBuffer);
        combined.set(data, this.usbMidiBuffer.length);
        this.usbMidiBuffer = combined;
      }

      if (this.usbMidiBuffer && this.usbMidiBuffer[0] === 0xF0 && this.usbMidiBuffer[this.usbMidiBuffer.length - 1] === 0xF7) {
        message = this.usbMidiBuffer;
        this.usbMidiBuffer = null;
      } else {
        return; // wait for next fragment
      }
    } else {
      if (this.usbMidiBuffer !== null) {
        const combined = new Uint8Array(this.usbMidiBuffer.length + data.length);
        combined.set(this.usbMidiBuffer);
        combined.set(data, this.usbMidiBuffer.length);
        message = combined;
        this.usbMidiBuffer = null;
      }
    }

    // Check multi-packet indicator in Pocket Master protocol:
    // Bytes [3:4] = total packets, Bytes [5:6] = current packet
    const totalPackets = (message[3] << 4) | message[4];
    const currentPacket = (message[5] << 4) | message[6];

    if (totalPackets > 1) {
      const responseId = `${message[3]}_${message[4]}`;
      if (!this.usbMultiPacketResponses[responseId]) {
        this.usbMultiPacketResponses[responseId] = {
          totalPackets,
          packets: {}
        };
      }
      const resp = this.usbMultiPacketResponses[responseId];
      resp.packets[currentPacket] = message;

      let allPacketsReceived = true;
      for (let i = 0; i < totalPackets; i++) {
        if (!(i in resp.packets)) {
          allPacketsReceived = false;
          break;
        }
      }

      if (allPacketsReceived) {
        const reassembledPayload = [];
        for (let i = 0; i < totalPackets; i++) {
          const pkt = resp.packets[i];
          const payloadStart = 9;
          const payloadEnd = pkt.length - 1;
          for (let j = payloadStart; j < payloadEnd; j++) {
            reassembledPayload.push(pkt[j]);
          }
        }
        delete this.usbMultiPacketResponses[responseId];

        // Create synthetic single-packet message with reassembled payload
        const singlePacketMessage = new Uint8Array(reassembledPayload.length + 10);
        singlePacketMessage[0] = 0xF0;
        singlePacketMessage[1] = message[1];
        singlePacketMessage[2] = message[2];
        singlePacketMessage[3] = 0x00;
        singlePacketMessage[4] = 0x01;
        singlePacketMessage[5] = 0x00;
        singlePacketMessage[6] = 0x00;
        singlePacketMessage[7] = 0x00;
        singlePacketMessage[8] = 0x00;
        for (let i = 0; i < reassembledPayload.length; i++) {
          singlePacketMessage[9 + i] = reassembledPayload[i];
        }
        singlePacketMessage[singlePacketMessage.length - 1] = 0xF7;

        const dataWithHeader = new Uint8Array([0x80, 0x80, ...singlePacketMessage]);
        const hexString = Array.from(dataWithHeader)
          .map(b => b.toString(16).padStart(2, '0'))
          .join('')
          .toUpperCase();

        this.processSysExNotification(hexString);
      }
    } else {
      // Single packet - process with 8080 header
      const dataWithHeader = new Uint8Array([0x80, 0x80, ...message]);
      const hexString = Array.from(dataWithHeader)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
        .toUpperCase();

      this.processSysExNotification(hexString);
    }
  }

  processSysExNotification(hexString) {
    if (!hexString || !hexString.startsWith('8080F0') || !hexString.endsWith('F7')) return;

    // 1. Preset State Dump
    if (this.isWaitingForPresetDump && hexString.length > 50) {
      this.isWaitingForPresetDump = false;
      clearTimeout(this.presetDumpTimeoutId);

      const dumpPackets = splitUsbDumpIntoPackets(hexString);
      try {
        const stateData = decodePresetStateAndOrder(dumpPackets[0]);
        const effectData = decodeSelectedEffects(dumpPackets[1]);
        const parameterData = decodeParameterValues(dumpPackets, effectData.selectedEffects);

        const fullPresetData = { ...stateData, ...effectData, ...parameterData };
        console.log('[MIDI USB] Successfully decoded Full Preset State Dump:', fullPresetData);
        this.emit('presetStateLoaded', fullPresetData);

        // Next step in auto-sync: request global hardware levels only if chained during full sync
        if (this._chainPresetDumpNext) {
          this._chainPresetDumpNext = false;
          setTimeout(() => this.requestGlobalSettings(true), 150);
        }
      } catch (err) {
        console.error('[MIDI USB] Error decoding preset dump:', err);
      }
      return;
    }

    // 2. Global Settings Dump (REQUEST_GLOBALS response)
    if (this.isWaitingForGlobals || (hexString.length > 200 && hexString.length < 350)) {
      const decodedGlobals = decodeGlobalSettingsDump(hexString);
      if (decodedGlobals) {
        console.log('[MIDI USB] Decoded Global Settings from Hardware:', decodedGlobals);
        const shouldChain = this._chainGlobalsNext;
        this.isWaitingForGlobals = false;
        this._chainGlobalsNext = false;
        clearTimeout(this.globalsTimeoutId);
        this.emit('globalSettingsLoaded', decodedGlobals);
        if (shouldChain) {
          setTimeout(() => this.requestCloneAmpNames(), 150);
        }
        return;
      }
    }

    // 3. Clone Amp Names Dump (REQUEST_CLONE_AMPS response)
    if (this.isWaitingForCloneAmps) {
      const names = decodeUserNamesDump(hexString, 'Clone');
      if (names && names.length > 0) {
        console.log('[MIDI USB] Decoded Clone Amp Names:', names);
        this.isWaitingForCloneAmps = false;
        clearTimeout(this.cloneAmpsTimeoutId);
        this.emit('cloneAmpNamesLoaded', names);
        setTimeout(() => this.requestUserIrNames(), 150);
        return;
      }
    }

    // 4. User IR Names Dump (REQUEST_USER_IR response)
    if (this.isWaitingForUserIr) {
      const names = decodeUserNamesDump(hexString, 'IR');
      if (names && names.length > 0) {
        console.log('[MIDI USB] Decoded User IR Names:', names);
        this.isWaitingForUserIr = false;
        clearTimeout(this.userIrTimeoutId);
        this.emit('userIrNamesLoaded', names);
        return;
      }
    }

    // 5. Preset Number Response (0403)
    if (this.isWaitingForPresetNumber) {
      try {
        const hexDigit1AsByte = hexString.substring(30, 32);
        const hexDigit2AsByte = hexString.substring(32, 34);
        const digit1 = parseInt(hexDigit1AsByte, 16);
        const digit2 = parseInt(hexDigit2AsByte, 16);
        const finalHexString = digit1.toString(16) + digit2.toString(16);
        const presetIndex = parseInt(finalHexString, 16);

        if (!isNaN(presetIndex) && presetIndex >= 0 && presetIndex <= 99) {
          console.log('[MIDI USB] Active Preset Index from hardware:', presetIndex);
          this.isWaitingForPresetNumber = false;
          clearTimeout(this.presetNumberTimeoutId);
          const slotCode = getPresetSlotCode(presetIndex);
          this.emit('presetChanged', { index: presetIndex, slotCode, fromHardware: true });
          this.requestPresetState(true);
          return;
        }
      } catch (e) {
        console.warn('[MIDI USB] Error parsing preset index:', e);
      }
    }

    // 6. Preset Names Dump (0400)
    if (this.isSyncingNames) {
      const names = parsePacketForNames(hexString.slice(6, -2));
      if (names.length > 0) {
        console.log(`[MIDI USB] Decoded ${names.length} preset names.`);
        this.isSyncingNames = false;
        clearTimeout(this.syncTimeoutId);
        this.emit('presetNamesLoaded', names);
        this.requestCurrentPreset();
        return;
      }
    }

    // 7. Large Dump Fallback if waiting flag was missed
    if (
      hexString.includes('01020000040000') ||
      (hexString.includes('0A000000') && hexString.length > 300) ||
      hexString.length >= 1000
    ) {
      try {
        const dumpPackets = splitUsbDumpIntoPackets(hexString);
        const stateData = decodePresetStateAndOrder(dumpPackets[0]);
        const effectData = decodeSelectedEffects(dumpPackets[1]);
        const parameterData = decodeParameterValues(dumpPackets, effectData.selectedEffects);

        const fullPresetData = { ...stateData, ...effectData, ...parameterData };
        console.log('[MIDI USB] Fallback Decoded Preset Dump:', fullPresetData);
        this.emit('presetStateLoaded', fullPresetData);
        return;
      } catch (err) {
        console.warn('[MIDI USB] Error in fallback preset dump:', err);
      }
    }

    // 8. Fallback for Names if waiting flag was missed
    if (hexString.length > 500) {
      const names = parsePacketForNames(hexString.slice(6, -2));
      if (names.length >= 10) {
        this.emit('presetNamesLoaded', names);
        return;
      }
    }

    // 9. Realtime SysEx notifications (0409 bypass, 0407 effect, 0408 param, 0402 vol, 0404 chain, 0403 pc, 0101 globals, 0405 modified)
    try {
      // Direct fast-path check for Preset Modified / Saved notification from hardware
      if (hexString.includes('010204050001') || hexString.includes('070A000100000003010204050001')) {
        console.log('[MIDI USB] Preset Modified notification from hardware');
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
        console.log('[MIDI USB] Preset Saved notification from hardware');
        this.emit('presetModified', { modified: false, fromHardware: true });
        return;
      }

      const rt = parseRealtimeSysEx(hexString);
      if (rt) {
        console.log('[MIDI USB] Realtime Hardware Event:', rt);
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
    } catch (err) {
      console.warn('[MIDI USB] Realtime SysEx parse error:', err);
    }
  }
}

export const midiService = new MidiService();
