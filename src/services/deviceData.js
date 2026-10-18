// Device models metadata and authentic module definitions for Sonicake Pocket Master (QME20)
import { POCKET_MASTER_MODULE_LIBRARY } from './pocketMasterLibrary';

export const SUPPORTED_DEVICES = [
  {
    id: 'qme20',
    name: 'Sonicake Pocket Master',
    code: 'QME20',
    dataFile: '/assets/assets/data/qme20_module_data.json',
    image: '/assets/assets/images/pocket_master_device.png',
    guideImage: '/assets/assets/images/pocket_master_device_bt_guide.png',
    description: 'Ultra-portable Multi-Effects Processor with NAM neural amp modeling & IR cab support',
    banks: 25,
    totalPresets: 100,
    defaultPresetName: 'P01 Clean Lead'
  }
];

export function getModuleLabel(name) {
  switch (name) {
    case 'NR': return 'Noise Reduction';
    case 'FX1': return 'Modulation 1';
    case 'PRE': return 'Preamp / Boost';
    case 'DRV': return 'Overdrive / Dist';
    case 'AMP': return 'Amplifier';
    case 'IR':
    case 'CAB': return 'Cabinet / IR';
    case 'EQ': return 'Equalizer';
    case 'FX2': return 'Modulation 2';
    case 'DLY': return 'Delay';
    case 'RVB': return 'Reverb';
    case 'Clone': return 'NAM Model';
    default: return name;
  }
}

export function getModuleColor(name) {
  switch (name) {
    case 'NR': return '#64748b';
    case 'FX1': return '#06b6d4';
    case 'PRE': return '#3b82f6';
    case 'DRV': return '#f59e0b';
    case 'AMP': return '#ef4444';
    case 'IR':
    case 'CAB': return '#8b5cf6';
    case 'EQ': return '#10b981';
    case 'FX2': return '#3b82f6';
    case 'DLY': return '#6366f1';
    case 'RVB': return '#a855f7';
    case 'Clone': return '#ec4899';
    default: return '#94a3b8';
  }
}

export function getModuleIcon(name) {
  const n = name.toLowerCase();
  if (['amp', 'cab', 'dly', 'drv', 'eq', 'fx1', 'fx2', 'ir', 'nr', 'pre', 'rvb'].includes(n)) {
    return `/assets/assets/images/${n}_on.svg`;
  }
  return `/assets/assets/images/fx_on.svg`;
}

// Build authentic 9-module chain directly from reverse-engineered Pocket Master library
export function buildPocketMasterModules() {
  const lib = POCKET_MASTER_MODULE_LIBRARY;
  const defaultChainModules = [0, 1, 2, 3, 4, 5, 6, 7, 8];

  return defaultChainModules.map(modId => {
    const modDef = lib.modules.find(x => x.moduleId === modId);
    if (!modDef) return null;

    const effects = (modDef.effects || []).map(fxId => {
      const def = lib.effectLibrary[String(fxId)] || {};
      const originMatch = def.descriptionEn ? def.descriptionEn.split('\n')[0].replace(/^Based on (famous |the legendary |legendary )?/i, '').replace(/\*.*$/, '') : '';

      return {
        fxid: fxId,
        name: def.name || `Effect ${fxId}`,
        type: def.name,
        origin: originMatch,
        summaryEn: def.descriptionEn || '',
        alg: (def.alg || []).map(a => ({
          name: a.name,
          algId: a.algId,
          defaultValue: a.defaultValue !== undefined ? a.defaultValue : 50,
          min: a.min !== undefined ? a.min : 0,
          max: a.max !== undefined ? a.max : 100,
          step: a.step !== undefined ? a.step : 1,
          value: a.defaultValue !== undefined ? a.defaultValue : 50,
          unit: a.unit || ''
        }))
      };
    });

    return {
      moduleId: modDef.moduleId,
      name: modDef.name,
      label: getModuleLabel(modDef.name),
      color: getModuleColor(modDef.name),
      icon: getModuleIcon(modDef.name),
      enabled: true,
      currentFxIndex: 0,
      effects
    };
  }).filter(Boolean);
}

export function getAmpModuleDefinition(isClone = false) {
  const lib = POCKET_MASTER_MODULE_LIBRARY;
  const targetId = isClone ? 9 : 3;
  const modDef = lib.modules.find(x => x.moduleId === targetId);
  if (!modDef) return null;

  const effects = (modDef.effects || []).map(fxId => {
    const def = lib.effectLibrary[String(fxId)] || {};
    const originMatch = def.descriptionEn ? def.descriptionEn.split('\n')[0].replace(/^Based on (famous |the legendary |legendary )?/i, '').replace(/\*.*$/, '') : '';

    return {
      fxid: fxId,
      name: def.name || `Effect ${fxId}`,
      type: def.name,
      origin: originMatch,
      summaryEn: def.descriptionEn || '',
      alg: (def.alg || []).map(a => ({
        name: a.name,
        algId: a.algId,
        defaultValue: a.defaultValue !== undefined ? a.defaultValue : 50,
        min: a.min !== undefined ? a.min : 0,
        max: a.max !== undefined ? a.max : 100,
        step: a.step !== undefined ? a.step : 1,
        value: a.defaultValue !== undefined ? a.defaultValue : 50,
        unit: a.unit || ''
      }))
    };
  });

  return {
    moduleId: isClone ? 9 : 3,
    name: 'AMP',
    label: isClone ? 'NAM Neural Amp' : 'Amplifier',
    color: isClone ? '#ec4899' : '#ef4444',
    icon: '/assets/assets/images/amp_on.svg',
    enabled: true,
    currentFxIndex: 0,
    effects
  };
}

export const FALLBACK_MODULES = buildPocketMasterModules();

export async function loadDeviceModules() {
  return buildPocketMasterModules();
}

export async function loadDrumDictionary() {
  try {
    const res = await fetch('/assets/assets/data/drumdict.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    return {};
  }
}
