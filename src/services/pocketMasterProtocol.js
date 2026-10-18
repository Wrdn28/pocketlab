// Pocket Master Native SysEx Protocol implementation
// Reverse-engineered and verified against hardware and protocol specifications

import POCKET_MASTER_COMMAND_LIBRARY from './pocketMasterCommands.js';
import { EQ_REVERSE_LOOKUP } from './pocketMasterReverseLookup.js';
import { 
  ALGID_LOCATION_MAP, 
  EFFECT_SIGNATURE_TO_NAME_MAP, 
  SIGNATURE_TO_FXID_MAP, 
  EFFECT_FINGERPRINT_TO_FXID, 
  EFFECT_FINGERPRINT_TO_NAME, 
  MODULE_NAMES 
} from './pocketMasterDecoderMaps.js';
import { POCKET_MASTER_MODULE_LIBRARY } from './pocketMasterLibrary.js';

export const FIXED_CORE_MODULES = ['DRV', 'AMP', 'IR', 'EQ'];

export const CHARACTER_MAP = {
  "0000": null, "0200": " ", "0201": "!", "0203": "#", "0205": "%", "0206": "&", "0207": "'", "0208": "(", "0209": ")", "020A": "*", "020B": "+", "020C": ",", "020D": "-", "020E": ".", "020F": "/",
  "0300": "0", "0301": "1", "0302": "2", "0303": "3", "0304": "4", "0305": "5", "0306": "6", "0307": "7", "0308": "8", "0309": "9", "030A": ":", "030B": ";", "030C": "<", "030D": "=", "030E": ">",
  "0400": "@", "0401": "A", "0402": "B", "0403": "C", "0404": "D", "0405": "E", "0406": "F", "0407": "G", "0408": "H", "0409": "I", "040A": "J", "040B": "K", "040C": "L", "040D": "M", "040E": "N", "040F": "O",
  "0500": "P", "0501": "Q", "0502": "R", "0503": "S", "0504": "T", "0505": "U", "0506": "V", "0507": "W", "0508": "X", "0509": "Y", "050A": "Z", "050B": "[", "050C": "\\", "050D": "]", "050F": "_",
  "0601": "a", "0602": "b", "0603": "c", "0604": "d", "0605": "e", "0606": "f", "0607": "g", "0608": "h", "0609": "i", "060A": "j", "060B": "k", "060C": "l", "060D": "m", "060E": "n", "060F": "o",
  "0700": "p", "0701": "q", "0702": "r", "0703": "s", "0704": "t", "0705": "u", "0706": "v", "0707": "w", "0708": "x", "0709": "y", "070A": "z", "070B": "{", "070D": "}", "070E": "~"
};

export const REVERSE_CHARACTER_MAP = Object.fromEntries(
  Object.entries(CHARACTER_MAP).map(([key, value]) => [value, key])
);

// Standard CRC-8 SMBus PEC polynomial (0x07, initial 0x00)
export function calculateSMBusPEC(hexString) {
  const bytes = hexString.match(/[0-9a-fA-F]{2}/g) || [];
  let crc = 0;
  const polynomial = 0x07;

  for (const bStr of bytes) {
    let byte = parseInt(bStr, 16);
    crc ^= byte;
    for (let i = 0; i < 8; i++) {
      if (crc & 0x80) {
        crc = (crc << 1) ^ polynomial;
      } else {
        crc <<= 1;
      }
      crc &= 0xFF;
    }
  }
  return crc.toString(16).padStart(2, '0');
}

export function isValidNameBlock(hexString) {
  if (hexString.length !== 40) return false;
  let hasFoundPadding = false;
  let hasFoundValidChar = false;

  for (let i = 0; i < 10; i++) {
    const chunk = hexString.substring(i * 4, i * 4 + 4).toUpperCase();
    if (hasFoundPadding) {
      if (chunk !== '0000') return false;
    } else {
      const char = CHARACTER_MAP[chunk];
      if (char === undefined) return false;
      if (char === null) {
        hasFoundPadding = true;
      } else {
        hasFoundValidChar = true;
      }
    }
  }
  return hasFoundValidChar;
}

export function decodeName(hexString) {
  let name = '';
  for (let i = 0; i < 10; i++) {
    const chunk = hexString.substring(i * 4, i * 4 + 4).toUpperCase();
    const char = CHARACTER_MAP[chunk];
    if (char === null) break;
    if (char !== undefined) {
      name += char;
    }
  }
  return name.trim();
}

export function parsePacketForNames(packetHex) {
  const foundNames = [];
  const NAME_HEX_LENGTH = 40;
  let offset = 0;

  while (offset + NAME_HEX_LENGTH <= packetHex.length) {
    const windowHex = packetHex.substring(offset, offset + NAME_HEX_LENGTH);
    if (isValidNameBlock(windowHex)) {
      const decoded = decodeName(windowHex);
      if (decoded.length > 0) {
        foundNames.push(decoded);
      }
      offset += NAME_HEX_LENGTH;
    } else {
      offset += 4;
    }
  }
  return foundNames;
}

export function encodeNameForSave(name) {
  const PADDING_CHAR_CODE = "0000";
  let encoded = '';
  const cleanName = (name || '').trim();

  for (let i = 0; i < 10; i++) {
    if (i >= cleanName.length) {
      encoded += PADDING_CHAR_CODE;
    } else {
      const char = cleanName[i];
      const code = REVERSE_CHARACTER_MAP[char] || "0200";
      encoded += code;
    }
  }
  return encoded;
}

export function getPresetSlotCode(index) {
  if (index < 50) {
    return `P${String(index + 1).padStart(2, '0')}`;
  } else {
    return `F${String(index - 49).padStart(2, '0')}`;
  }
}

export function parsePresetSlotCode(code) {
  const c = String(code).toUpperCase().trim();
  if (c.startsWith('P')) {
    const num = parseInt(c.slice(1), 10);
    return Math.max(0, Math.min(49, num - 1));
  }
  if (c.startsWith('F')) {
    const num = parseInt(c.slice(1), 10);
    return Math.max(50, Math.min(99, num + 49));
  }
  const parsed = parseInt(c, 10);
  return isNaN(parsed) ? 0 : Math.max(0, Math.min(99, parsed));
}

export function buildPresetSelectSysEx(index, isBle = true) {
  const hi = (Math.floor(index / 16) & 0x0F).toString(16);
  const lo = (index % 16).toString(16);
  const presetNibbles = `0${hi}0${lo}`;
  const payload = `00010000000601010403${presetNibbles}000000000000`;

  const inputHex = payload.replace(/0(.)/g, '$1');
  const crc8 = calculateSMBusPEC(inputHex);
  const expandedCRC = crc8.split('').map(n => '0' + n).join('');

  const prefix = isBle ? '8080f0' : 'f0';
  return `${prefix}${expandedCRC}${payload}f7`;
}

export function buildSavePresetSysEx(index, name, isBle = true) {
  const hi = (Math.floor(index / 16) & 0x0F).toString(16);
  const lo = (index % 16).toString(16);
  const presetBytesHex = `0${hi}0${lo}`;
  const encodedNameHex = encodeNameForSave(name);

  const payloadTemplate = "0001000001030101040a{PRESET_BYTES}000000000000{ENCODED_NAME}000000000000";
  let payload = payloadTemplate.replace('{ENCODED_NAME}', encodedNameHex);
  payload = payload.replace('{PRESET_BYTES}', presetBytesHex);

  const inputHex = payload.replace(/0(.)/g, '$1');
  const crc8 = calculateSMBusPEC(inputHex);
  const expandedCRC = crc8.split('').map(n => '0' + n).join('');

  const prefix = isBle ? '8080f0' : 'f0';
  return `${prefix}${expandedCRC}${payload}f7`;
}

// Predefined query commands
export const POCKET_MASTER_COMMANDS = {
  REQUEST_PRESET_NAMES_BLE: '8080F0000E00010000000201020400F7',
  REQUEST_PRESET_NAMES_USB: 'F0000E00010000000201020400F7',

  REQUEST_CURRENT_PRESET_BLE: '8080F0000700010000000201020403F7',
  REQUEST_CURRENT_PRESET_USB: 'F0000700010000000201020403F7',

  REQUEST_PRESET_STATE_BLE: '8080F0000900010000000201020401F7',
  REQUEST_PRESET_STATE_USB: 'F0000900010000000201020401F7',

  REQUEST_USER_IR_BLE: '8080F0020900010000000201020200F7',
  REQUEST_USER_IR_USB: 'F0020900010000000201020200F7',

  REQUEST_CLONE_AMPS_BLE: '8080F0030500010000000201020204F7',
  REQUEST_CLONE_AMPS_USB: 'F0030500010000000201020204F7',

  REQUEST_GLOBALS_BLE: '8080F00B0900010000000201020100F7',
  REQUEST_GLOBALS_USB: 'F00B0900010000000201020100F7',

  TERMINATOR_PACKET_BLE: '8080F0030601050104000200000000F7',
  SUCCESS_ACK_BLE: '8080F00B02000100000003010400080000F7'
};

export function generatePocketMasterDefaultPresets() {
  const list = [];
  for (let i = 0; i < 50; i++) {
    const slotCode = `P${String(i + 1).padStart(2, '0')}`;
    list.push({
      id: i,
      slotCode,
      type: 'user',
      index: i,
      name: `User Preset ${i + 1}`
    });
  }
  for (let i = 0; i < 50; i++) {
    const slotCode = `F${String(i + 1).padStart(2, '0')}`;
    list.push({
      id: 50 + i,
      slotCode,
      type: 'factory',
      index: 50 + i,
      name: `Factory Preset ${i + 1}`
    });
  }
  return list;
}

export { POCKET_MASTER_COMMAND_LIBRARY };

// Get module bypass command (0409)
export function getModuleBypassSysEx(moduleId, isEnabled, isBle = false) {
  const stateKey = isEnabled ? 'on' : 'off';
  let rawBleCmd = POCKET_MASTER_COMMAND_LIBRARY.moduleStates?.[moduleId]?.[stateKey];
  if (!rawBleCmd && moduleId === 9) {
    rawBleCmd = POCKET_MASTER_COMMAND_LIBRARY.moduleStates?.[3]?.[stateKey];
  }
  if (!rawBleCmd) return null;
  return isBle ? rawBleCmd : rawBleCmd.replace(/^8080/i, '');
}

// Get parameter set command (0408)
export function getParameterSysEx(moduleId, algId, value, isBle = false) {
  const valStr = String(value);
  let rawBleCmd = POCKET_MASTER_COMMAND_LIBRARY.parameters?.[moduleId]?.[algId]?.[valStr];
  if (!rawBleCmd && (moduleId === 9 || moduleId === 3)) {
    rawBleCmd = POCKET_MASTER_COMMAND_LIBRARY.parameters?.[9]?.[algId]?.[valStr] || POCKET_MASTER_COMMAND_LIBRARY.parameters?.[3]?.[algId]?.[valStr];
  }
  if (!rawBleCmd) return null;
  return isBle ? rawBleCmd : rawBleCmd.replace(/^8080/i, '');
}

// Get effect type set command (0407)
export function getEffectTypeSysEx(moduleId, fxId, isBle = false) {
  let rawBleCmd = POCKET_MASTER_COMMAND_LIBRARY.effectTypes?.[moduleId]?.[fxId];
  if (!rawBleCmd && (moduleId === 9 || moduleId === 3)) {
    rawBleCmd = POCKET_MASTER_COMMAND_LIBRARY.effectTypes?.[3]?.[fxId] || POCKET_MASTER_COMMAND_LIBRARY.effectTypes?.[9]?.[fxId];
  }
  if (!rawBleCmd) return null;
  return isBle ? rawBleCmd : rawBleCmd.replace(/^8080/i, '');
}

// Get Preset Volume command (0402)
export function getPresetVolumeSysEx(volume, isBle = false) {
  const clamped = Math.max(0, Math.min(100, Math.round(Number(volume))));
  const rawBleCmd = POCKET_MASTER_COMMAND_LIBRARY.globalCommands?.presetVolume?.[String(clamped)];
  if (rawBleCmd) {
    return isBle ? rawBleCmd : rawBleCmd.replace(/^8080/i, '');
  }

  // Fallback: dynamically generate 0402 message
  const hexVal = clamped.toString(16).padStart(2, '0');
  const valNibbles = `0${hexVal[0]}0${hexVal[1]}`;
  const payload = `000100000007010104020001020000010000${valNibbles}`;
  const inputHex = payload.replace(/0(.)/g, '$1');
  const crc8 = calculateSMBusPEC(inputHex);
  const expCrc = crc8.split('').map(n => '0' + n).join('');
  const prefix = isBle ? '8080f0' : 'f0';
  return `${prefix}${expCrc}${payload}f7`;
}

// Get Global Setting SysEx (globalVolume, inputLevel, fxRecLevel, btRecLevel, monitorLevel)
export function getGlobalSettingSysEx(paramName, value, isBle = false) {
  const valStr = String(value);
  const rawBleCmd = POCKET_MASTER_COMMAND_LIBRARY.globalCommands?.[paramName]?.[valStr];
  if (!rawBleCmd) return null;
  return isBle ? rawBleCmd : rawBleCmd.replace(/^8080/i, '');
}

// Get Amp Mode Switch SysEx (Factory = 0, Clone/NAM = 1)
export function getAmpModeSysEx(isClone, isBle = false) {
  const rawBleCmd = isClone
    ? POCKET_MASTER_COMMAND_LIBRARY.ampModes?.clone
    : POCKET_MASTER_COMMAND_LIBRARY.ampModes?.factory;
  if (!rawBleCmd) return null;
  return isBle ? rawBleCmd : rawBleCmd.replace(/^8080/i, '');
}

// Decode dB value from 2 hex nibble bytes (e.g. 0F 0E -> -2dB, 01 02 -> +18dB)
export function decodeDbValue(byte1Hex, byte2Hex) {
  const byte1 = parseInt(byte1Hex, 16);
  const byte2 = parseInt(byte2Hex, 16);

  if (byte1 === 0x0F) { // Mid-Negative Range (-1 to -16)
    return byte2 - 16;
  }
  if (byte1 === 0x0E) { // Low-Negative Range (-17 to -20)
    return byte2 - 32;
  }
  // Positive Range (0 to 20)
  return (byte1 * 16) + byte2;
}

// Decode Global Settings Dump Packet (Response to REQUEST_GLOBALS)
export function decodeGlobalSettingsDump(hexString) {
  try {
    if (!hexString || typeof hexString !== 'string') return null;
    const clean = hexString.replace(/[^0-9a-fA-F]/g, '').toUpperCase();
    if (!clean.endsWith('F7')) return null;

    let payload;
    if (clean.startsWith('8080F0')) {
      // 8080 (4) + F0 (2) + CRC (4) = 10 chars header (BLE MIDI SysEx packet structure)
      payload = clean.substring(10, clean.length - 2);
    } else if (clean.startsWith('F0')) {
      // F0 (2) + CRC (4) = 6 chars header
      payload = clean.substring(6, clean.length - 2);
    } else {
      payload = clean;
    }

    if (payload.length < 104) {
      return null;
    }

    // Global Volume: index 100-104 (bytes 50-51 of payload)
    const gv_b1 = parseInt(payload.substring(100, 102), 16);
    const gv_b2 = parseInt(payload.substring(102, 104), 16);
    let globalVolume = (gv_b1 * 16) + gv_b2;

    // Resilient fallback for Global Volume: search for Group 2, Sub 2 marker if index 100 is invalid
    if (isNaN(globalVolume) || globalVolume > 100) {
      const gvMarker = '0002000200000000';
      const mIdx = payload.indexOf(gvMarker);
      if (mIdx !== -1 && payload.length >= mIdx + gvMarker.length + 4) {
        const mgv1 = parseInt(payload.substring(mIdx + gvMarker.length, mIdx + gvMarker.length + 2), 16);
        const mgv2 = parseInt(payload.substring(mIdx + gvMarker.length + 2, mIdx + gvMarker.length + 4), 16);
        const mVal = (mgv1 * 16) + mgv2;
        if (!isNaN(mVal) && mVal >= 0 && mVal <= 100) {
          globalVolume = mVal;
        }
      }
    }

    // Input Level: index 172-176
    const inputLevel = payload.length >= 176
      ? decodeDbValue(payload.substring(172, 174), payload.substring(174, 176))
      : 0;

    // FX Rec Level: index 192-196
    const fxRecLevel = payload.length >= 196
      ? decodeDbValue(payload.substring(192, 194), payload.substring(194, 196))
      : 0;

    // Monitor Level: index 212-216
    const monitorLevel = payload.length >= 216
      ? decodeDbValue(payload.substring(212, 214), payload.substring(214, 216))
      : 0;

    // BT Rec Level: index 272-276
    const btRecLevel = payload.length >= 276
      ? decodeDbValue(payload.substring(272, 274), payload.substring(274, 276))
      : 0;

    return {
      globalVolume: isNaN(globalVolume) ? 75 : Math.max(0, Math.min(100, globalVolume)),
      inputLevel: isNaN(inputLevel) ? 0 : Math.max(-20, Math.min(20, inputLevel)),
      fxRecLevel: isNaN(fxRecLevel) ? 0 : Math.max(-20, Math.min(20, fxRecLevel)),
      monitorLevel: isNaN(monitorLevel) ? 0 : Math.max(-20, Math.min(20, monitorLevel)),
      btRecLevel: isNaN(btRecLevel) ? 0 : Math.max(-20, Math.min(20, btRecLevel))
    };
  } catch (e) {
    console.warn('Failed to decode global settings dump:', e);
    return null;
  }
}

// Decode User IR or Clone Amp Names Dump (5 slots, 32 bytes each, starting after 25-byte header)
export function decodeUserNamesDump(hexString, type = 'IR') {
  try {
    if (!hexString || typeof hexString !== 'string') return null;
    const clean = hexString.replace(/[^0-9a-fA-F]/g, '').toUpperCase();
    
    // Hardware packet starts with 8080 (or 8080F0) and PAYLOAD_START_OFFSET is 50 hex chars (25 bytes)
    // If 8080 prefix is absent (e.g. raw USB F0), the offset is 46 hex chars (23 bytes)
    const payloadStart = clean.startsWith('8080F0') ? 50 : (clean.startsWith('F0') ? 46 : 50);
    if (clean.length < payloadStart) return null;
    const hexPayload = clean.substring(payloadStart);

    const BLOCK_STRIDE = 64; // 32 bytes * 2
    const NAME_DATA_LENGTH = 40; // 20 bytes * 2
    const defaultPrefix = type === 'Clone' ? 'User Profile' : 'User IR';

    const names = [];
    for (let i = 0; i < 5; i++) {
      const blockStart = i * BLOCK_STRIDE;
      if (hexPayload.length >= blockStart + NAME_DATA_LENGTH) {
        const nameHex = hexPayload.substring(blockStart, blockStart + NAME_DATA_LENGTH);
        const decoded = decodeName(nameHex).trim();
        names.push(decoded || `${defaultPrefix} ${i + 1}`);
      } else {
        names.push(`${defaultPrefix} ${i + 1}`);
      }
    }
    return names;
  } catch (e) {
    console.warn(`Failed to decode ${type} names dump:`, e);
    return null;
  }
}

// Recreate 5 BLE packets from single USB dump
export function splitUsbDumpIntoPackets(rawHexString) {
  if (!rawHexString) return [];
  const cleanHex = rawHexString.replace(/[^0-9a-fA-F]/g, '').toUpperCase();
  
  let payloadHex = cleanHex;
  if (cleanHex.startsWith('8080F0')) {
    payloadHex = cleanHex.slice(22);
  } else if (cleanHex.startsWith('F0')) {
    payloadHex = cleanHex.slice(18);
  }
  if (payloadHex.endsWith('F7')) {
    payloadHex = payloadHex.slice(0, -2);
  }

  const hdr = "8080F00706000100000000";
  const p1 = hdr + payloadHex.slice(0, 400) + "F7";
  const p2 = hdr + payloadHex.slice(400, 800) + "F7";
  const p3 = hdr + payloadHex.slice(800, 1200) + "F7";
  const p4 = hdr + payloadHex.slice(1200, 1600) + "F7";
  let p5 = hdr + payloadHex.slice(1600);
  if (!p5.endsWith("F7")) p5 += "F7";

  return [p1, p2, p3, p4, p5];
}

// Decode Packet 0: Preset Volume, Amp Mode, Module States, and Chain Order
export function decodePresetStateAndOrder(hexString) {
  if (!hexString) return null;
  const bytes = hexString.match(/.{1,2}/g);
  if (!bytes) return null;

  const payload = bytes.slice(5, -1);
  const payloadString = payload.join('').toUpperCase();

  let presetVolume = 75;
  try {
    const volumeMarker = "01020000040000";
    const markerIndex = payloadString.indexOf(volumeMarker);
    if (markerIndex !== -1) {
      const tens_byte_index = (markerIndex + volumeMarker.length) / 2;
      const ones_byte_index = tens_byte_index + 1;
      const tens_byte_hex = payload[tens_byte_index];
      const ones_byte_hex = payload[ones_byte_index];
      presetVolume = parseInt(parseInt(tens_byte_hex, 16).toString(16) + parseInt(ones_byte_hex, 16).toString(16), 16);
    }
  } catch (e) {
    presetVolume = 75;
  }

  const chainMarker = "0A000000";
  const chainStartIndex = payloadString.lastIndexOf(chainMarker);
  if (chainStartIndex === -1) {
    return { presetVolume };
  }

  const chainByteIndex = chainStartIndex / 2;
  const globalStateByteIndex = chainByteIndex - 10;
  const nibble1Index = chainByteIndex - 13;
  const nibble2Index = chainByteIndex - 12;

  if (globalStateByteIndex < 0 || nibble1Index < 0) {
    return { presetVolume };
  }

  const nibble1 = payload[nibble1Index];
  const nibble2 = payload[nibble2Index];
  const globalStateByte = parseInt(payload[globalStateByteIndex], 16);
  const isCloneMode = (globalStateByte & 2) !== 0;
  const isRvbOn = (globalStateByte & 1) !== 0;
  const mainBitmask = parseInt(nibble1[1] + nibble2[1], 16);
  const moduleStates = {};
  for (let i = 0; i < 9; i++) {
    const moduleName = MODULE_NAMES[i];
    let isOn = (i === 8) ? isRvbOn : (mainBitmask & (1 << i)) !== 0;
    if (isCloneMode && i === 4) isOn = true;
    moduleStates[moduleName] = isOn;
  }

  const chainDataStartIndex = chainByteIndex + (chainMarker.length / 2);
  const chainData = payload.slice(chainDataStartIndex);
  const chainIds = [];
  const uniqueIds = new Set();
  let nrFoundInList = false;
  for (let i = 0; i < chainData.length - 1; i++) {
    if (chainIds.length >= 9) break;
    const id = parseInt(chainData[i], 16);
    if (MODULE_NAMES[id] !== undefined && chainData[i + 1] === '00' && !uniqueIds.has(id)) {
      chainIds.push(id);
      uniqueIds.add(id);
      if (id === 0) nrFoundInList = true;
      i++;
    }
  }
  if (!nrFoundInList && chainIds.length < 9) chainIds.unshift(0);
  const chainOrder = chainIds.map(id => MODULE_NAMES[id]);

  return {
    ampMode: isCloneMode ? 'Clone' : 'Normal',
    states: moduleStates,
    order: chainOrder,
    presetVolume
  };
}

// Decode Packet 1: Selected Effect Type per Module Slot
export function decodeSelectedEffects(hexString) {
  if (!hexString) return { selectedEffects: {} };
  const bytes = hexString.match(/.{1,2}/g);
  if (!bytes) return { selectedEffects: {} };

  const selectedEffects = {};
  for (const moduleIdStr in EFFECT_SIGNATURE_TO_NAME_MAP) {
    const moduleId = parseInt(moduleIdStr, 10);
    const { offset, length } = EFFECT_SIGNATURE_TO_NAME_MAP[moduleId];
    if (bytes.length < offset + length) continue;

    const signature = bytes.slice(offset, offset + length).join('').toUpperCase();
    const fxId = SIGNATURE_TO_FXID_MAP[moduleId]?.[signature];
    if (fxId !== undefined) {
      selectedEffects[moduleId] = fxId;
    }
  }
  return { selectedEffects };
}

// Decode Packets 2-4: Knob Parameter Values across all modules
export function decodeParameterValues(dumpPackets, selectedEffects = {}) {
  const decodedParams = {};
  const defaultSlotFxIds = {
    0: 1,
    1: 101,
    2: 201,
    3: 301,
    4: 401,
    5: 501,
    6: 106,
    7: 701,
    8: 801,
    9: 901
  };
  const sel = { ...defaultSlotFxIds, ...selectedEffects, 0: 1 };

  for (const moduleIdStr in sel) {
    const moduleId = parseInt(moduleIdStr, 10);
    const fxId = sel[moduleId];
    const effectDef = POCKET_MASTER_MODULE_LIBRARY.effectLibrary?.[String(fxId)];
    if (!effectDef || !effectDef.alg) continue;

    decodedParams[moduleId] = {};
    effectDef.alg.forEach(param => {
      const algId = param.algId;
      const mapKey = `${moduleId}_${algId}`;
      const location = ALGID_LOCATION_MAP[mapKey];

      if (location && dumpPackets[location.p]) {
        const pktBytes = dumpPackets[location.p].match(/.{1,2}/g);
        if (pktBytes && pktBytes.length >= location.o + 6) {
          const hexBlock = pktBytes.slice(location.o, location.o + 6).join('').toUpperCase();
          const finalValue = EQ_REVERSE_LOOKUP[hexBlock];
          if (finalValue !== undefined) {
            decodedParams[moduleId][algId] = finalValue;
          }
        }
      }
    });
  }
  return { parameters: decodedParams };
}

// Full Preset Dump Decoder (Handles both 5 BLE packets or single reassembled USB stream)
export function decodeFullPresetDump(dumpData, isUsb = false) {
  let packets = [];
  if (Array.isArray(dumpData)) {
    packets = dumpData;
  } else if (typeof dumpData === 'string') {
    packets = splitUsbDumpIntoPackets(dumpData);
  }

  if (packets.length < 2) return null;

  const stateData = decodePresetStateAndOrder(packets[0]) || {};
  const effectData = decodeSelectedEffects(packets[1]) || {};
  const paramData = decodeParameterValues(packets, effectData.selectedEffects || {}) || {};

  return {
    ...stateData,
    ...effectData,
    ...paramData
  };
}

// Real-time incoming SysEx message parser (0409, 0407, 0408, 0402, 0403, 0404)
export function parseRealtimeSysEx(hexString) {
  if (!hexString || typeof hexString !== 'string') return null;
  const clean = hexString.replace(/[^0-9a-fA-F]/g, '').toUpperCase();
  let normalized = clean;
  if (normalized.startsWith('F0')) {
    normalized = '8080' + normalized;
  }

  if (!normalized.startsWith('8080F0') || !normalized.endsWith('F7') || normalized.length < 30) {
    return null;
  }

  const payload = normalized.substring(22, normalized.length - 2);
  if (payload.length < 8) return null;

  const prefix = payload.substring(0, 4);
  const command = payload.substring(4, 8);

  if (prefix !== '0101' && prefix !== '0102') return null;

  const decNE = (offset) => {
    const hi = parseInt(payload.substring(offset, offset + 2), 16);
    const lo = parseInt(payload.substring(offset + 2, offset + 4), 16);
    return (hi << 4) | lo;
  };

  switch (command) {
    case '0405': { // Preset Modified / Saved Notification from hardware knob/button adjustments
      const isModified = decNE(8) === 1;
      return {
        type: 'presetModified',
        modified: isModified
      };
    }

    case '0409': { // Bypass or Amp Mode
      const moduleId = decNE(8);
      const value = decNE(24);
      if (moduleId === 9) {
        return {
          type: 'ampMode',
          mode: value === 1 ? 'Clone' : 'Normal',
          isClone: value === 1
        };
      }
      return {
        type: 'bypass',
        moduleId,
        enabled: value === 1
      };
    }

    case '0407': { // Effect Type Selection
      const moduleId = decNE(8);
      const recvTail = payload.length > 40 ? payload.substring(40) : payload.substring(24);
      const recvMod = payload.substring(8, 12);
      const fpKey = recvMod + ':' + recvTail.toUpperCase();
      const fxId = EFFECT_FINGERPRINT_TO_FXID[fpKey];
      const effectName = EFFECT_FINGERPRINT_TO_NAME[fpKey] || `FX ${fxId}`;
      return {
        type: 'effectType',
        moduleId,
        fxId,
        effectName
      };
    }

    case '0408': { // Parameter Value Knob
      const moduleId = decNE(8);
      const algId = decNE(26);
      let decodedValue = undefined;
      if (payload.length >= 56) {
        const valueHex = payload.substring(44, 56).toUpperCase();
        decodedValue = EQ_REVERSE_LOOKUP[valueHex];
      }
      return {
        type: 'parameter',
        moduleId,
        algId,
        value: decodedValue
      };
    }

    case '0402': { // Preset Volume
      const value = decNE(24);
      return {
        type: 'presetVolume',
        value
      };
    }

    case '0403': { // Preset Select
      const idx = decNE(8);
      return {
        type: 'presetSelect',
        index: idx,
        slotCode: getPresetSlotCode(idx)
      };
    }

    case '0404': { // Chain Order
      const chainIds = [];
      for (let i = 0; i < 9; i++) {
        const offset = 8 + i * 4;
        if (offset + 4 <= payload.length) {
          chainIds.push(decNE(offset));
        }
      }
      const order = chainIds.map(id => MODULE_NAMES[id] || `M${id}`);
      return {
        type: 'chainOrder',
        order
      };
    }

    case '0101': { // Realtime Global Settings change
      const group = decNE(8);
      const sub = decNE(12);
      const key = `${group}_${sub}`;
      let paramName = null;
      let isDb = true;

      if (key === '2_2') {
        paramName = 'globalVolume';
        isDb = false;
      } else if (key === '1_3') {
        paramName = 'inputLevel';
      } else if (key === '1_4') {
        paramName = 'fxRecLevel';
      } else if (key === '2_4') {
        paramName = 'monitorLevel';
      } else if (key === '5_4') {
        paramName = 'btRecLevel';
      } else if (key === '1_2') {
        // Screen / Menu navigation on hardware (e.g. entered Global Settings menu)
        return {
          type: 'screenChange',
          group,
          sub
        };
      }

      if (paramName && payload.length >= 28) {
        const valHex1 = payload.substring(24, 26);
        const valHex2 = payload.substring(26, 28);
        const value = isDb ? decodeDbValue(valHex1, valHex2) : ((parseInt(valHex1, 16) * 16) + parseInt(valHex2, 16));
        return {
          type: 'globalSetting',
          paramName,
          value
        };
      }
      return null;
    }

    default:
      return null;
  }
}

// Chain movement constraint engine:
// DRV (2), AMP (3), IR (4), and EQ (5) MUST form an indivisible, consecutive fixed block.
// Only NR (0), FX1 (1), FX2 (6), DLY (7), RVB (8) can move around.
export function moveModuleInChain(order, moduleName, direction) {
  if (!Array.isArray(order) || !moduleName || direction === 0) return null;
  if (FIXED_CORE_MODULES.includes(moduleName)) return null; // Disallow moving fixed core modules

  // Tokenize order by collapsing the 4-module fixed core into a single 'CORE' token
  const tokens = [];
  let i = 0;
  while (i < order.length) {
    if (
      order[i] === 'DRV' && 
      order[i + 1] === 'AMP' && 
      order[i + 2] === 'IR' && 
      order[i + 3] === 'EQ'
    ) {
      tokens.push('CORE');
      i += 4;
    } else {
      tokens.push(order[i]);
      i++;
    }
  }

  const tokenIdx = tokens.indexOf(moduleName);
  if (tokenIdx === -1) return null;

  const targetIdx = tokenIdx + (direction > 0 ? 1 : -1);
  if (targetIdx < 0 || targetIdx >= tokens.length) return null;

  // Swap tokens
  const temp = tokens[tokenIdx];
  tokens[tokenIdx] = tokens[targetIdx];
  tokens[targetIdx] = temp;

  // Re-expand 'CORE' into FIXED_CORE_MODULES
  const newOrder = [];
  for (const t of tokens) {
    if (t === 'CORE') {
      newOrder.push(...FIXED_CORE_MODULES);
    } else {
      newOrder.push(t);
    }
  }

  return newOrder;
}

// Generate SysEx Chain Order Command (0404)
export function getChainOrderSysEx(order, isBle = false) {
  if (!Array.isArray(order) || order.length !== 9) return null;
  const orderKey = order.join('-');

  const stored = POCKET_MASTER_COMMAND_LIBRARY.chainOrderCommands?.[orderKey];
  if (stored) {
    return isBle ? stored : stored.replace(/^8080/i, '');
  }

  // Dynamic generator with SMBus PEC
  const MOD_MAP = { NR: "0000", FX1: "0001", DRV: "0002", AMP: "0003", IR: "0004", EQ: "0005", FX2: "0006", DLY: "0007", RVB: "0008" };
  const modNibbles = order.map(m => MOD_MAP[m] || "0000").join("");
  const payload = `00010000000c01010404${modNibbles}0009`;
  const inputHex = payload.replace(/0(.)/g, "$1");
  const crc8 = calculateSMBusPEC(inputHex);
  const expCrc = crc8.split('').map(n => '0' + n).join('');
  const prefix = isBle ? '8080f0' : 'f0';
  return `${prefix}${expCrc}${payload}f7`;
}
