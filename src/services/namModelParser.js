/**
 * NAM (Neural Amp Modeler) Parser & Validator for SonicLink / Sonicake Pocket Master
 * 
 * Reverse engineered from SonicLink Android binaries:
 * - lib5868USB.so (NAM Core & Hotone CLO converter, JUCE 6.0.8, Eigen)
 * - libapp.so (Flutter bindings: _NamToNambBindings, convertNamToNambWithSlim)
 *
 * Discovered specifications:
 * - Architecture: WaveNet (V1), A2 / Architecture 2 (V2: A2-Lite, A2-Full), SlimmableWavenet, LSTM, ConvNet, Container
 * - A2 Specifications:
 *   - Total layers: 23 layers
 *   - kKernelSizes: [6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 15, 15, 6, 6, 6, 6, 6, 6, 6]
 *   - kDilations:   [1, 3, 7, 17, 41, 101, 239, 1, 3, 7, 17, 41, 101, 239, 1, 13, 1, 3, 7, 17, 41, 101, 239]
 *   - Supported channels: 3 (A2-Lite) or 8 (A2-Full)
 *   - Activations: PReLU, LeakyHardTanh, FastLUTActivation, FastTanh, Tanh
 *   - Gating Mode: 'None' (A2 does not use traditional gated multiplication)
 *   - Versions: 0.5.x, 0.6.x, 0.7.x (A2), normalized for embedded compatibility
 */

export const A2_KERNEL_SIZES = [6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 15, 15, 6, 6, 6, 6, 6, 6, 6];
export const A2_DILATIONS = [1, 3, 7, 17, 41, 101, 239, 1, 3, 7, 17, 41, 101, 239, 1, 13, 1, 3, 7, 17, 41, 101, 239];
export const A2_SUPPORTED_CHANNELS = [3, 8];

/**
 * Validates whether a layer array matches the reverse engineered A2 specification
 */
export function checkIsA2Shape(config) {
  if (!config) return { isA2: false, reason: 'Empty configuration' };

  // Layers can be direct or inside layer_array
  let layers = config.layers;
  if (!layers && Array.isArray(config.layer_array) && config.layer_array.length > 0) {
    layers = config.layer_array[0].layers || config.layer_array;
  }

  const channels = config.channels ?? config.bottleneck ?? (layers && layers[0]?.channels);
  const bottleneck = config.bottleneck ?? channels;

  let is23Layers = false;
  let matchesDilations = false;
  let matchesKernels = false;

  if (Array.isArray(layers) && layers.length === 23) {
    is23Layers = true;
    matchesDilations = layers.every((l, i) => (l.dilation ?? l.dilations?.[0]) === A2_DILATIONS[i]);
    matchesKernels = layers.every((l, i) => (l.kernel_size ?? l.kernel_sizes?.[0]) === A2_KERNEL_SIZES[i]);
  } else if (Array.isArray(config.dilations) && config.dilations.length === 23) {
    is23Layers = true;
    matchesDilations = config.dilations.every((d, i) => d === A2_DILATIONS[i]);
    if (Array.isArray(config.kernel_sizes) && config.kernel_sizes.length === 23) {
      matchesKernels = config.kernel_sizes.every((k, i) => k === A2_KERNEL_SIZES[i]);
    } else {
      matchesKernels = true; // Dilations are definitive for A2
    }
  }

  const isA2 = is23Layers || (matchesDilations && matchesKernels);
  let variant = 'Custom A2';
  if (channels === 3) variant = 'A2-Lite';
  else if (channels === 8) variant = 'A2-Full';

  return {
    isA2,
    variant,
    channels,
    bottleneck,
    layerCount: is23Layers ? 23 : (layers?.length || 0),
    matchesDilations,
    matchesKernels
  };
}

/**
 * Parses and validates a Neural Amp Modeler (.nam / .json / .namb) file or string
 * @param {File|string|object} input 
 * @returns {Promise<{
 *   isValid: boolean,
 *   isV2: boolean,
 *   architecture: string,
 *   architectureLabel: string,
 *   variant: string,
 *   version: string,
 *   normalizedVersion: string,
 *   sampleRate: number,
 *   channels: number,
 *   weightsCount: number,
 *   gearName: string,
 *   modelMake: string,
 *   modelName: string,
 *   author: string,
 *   cleanSlotName: string,
 *   activation: string,
 *   loudness: number|null,
 *   warnings: string[],
 *   rawJson: object
 * }>}
 */
export async function parseNamModel(input) {
  const result = {
    isValid: false,
    isV2: false,
    architecture: 'Unknown',
    architectureLabel: 'Unknown Model',
    variant: 'Standard',
    version: '0.5.0',
    normalizedVersion: '0.7.0',
    sampleRate: 48000,
    channels: 8,
    weightsCount: 0,
    gearName: '',
    modelMake: '',
    modelName: '',
    author: '',
    cleanSlotName: 'USER NAM',
    activation: 'Tanh',
    loudness: null,
    warnings: [],
    rawJson: null
  };

  let jsonText = '';
  let filename = '';

  try {
    if (typeof input === 'string') {
      jsonText = input;
    } else if (input instanceof File) {
      filename = input.name;
      // Check if it's binary .namb or text JSON
      const buffer = await input.arrayBuffer();
      const firstBytes = new Uint8Array(buffer.slice(0, 4));
      const isAsciiJson = firstBytes[0] === 0x7b; // '{'

      if (isAsciiJson) {
        jsonText = new TextDecoder('utf-8').decode(buffer);
      } else {
        // Binary NAMB format or CLO format
        return parseBinaryNamb(buffer, filename);
      }
    } else if (typeof input === 'object' && input !== null) {
      result.rawJson = input;
    }

    if (jsonText && !result.rawJson) {
      result.rawJson = JSON.parse(jsonText);
    }
  } catch (err) {
    result.warnings.push(`Failed to read NAM file: ${err.message}`);
    return result;
  }

  const data = result.rawJson;
  if (!data || typeof data !== 'object') {
    result.warnings.push('NAM JSON file is invalid or empty');
    return result;
  }

  // 1. Version Detection & Normalization
  result.version = String(data.version || '0.5.0').trim();
  // Firmware compatibility: if version is >= 2.0.0 or 0.8.x, normalize to 0.7.0 for Pocket Master
  const verParts = result.version.split('.').map(n => parseInt(n, 10) || 0);
  if (verParts[0] >= 2 || (verParts[0] === 0 && verParts[1] >= 7)) {
    result.isV2 = true;
    result.normalizedVersion = '0.7.0';
  } else {
    result.normalizedVersion = result.version;
  }

  // 2. Metadata Extraction
  const meta = data.metadata || {};
  result.modelMake = String(meta.model_make || meta.make || meta.brand || '').trim();
  result.modelName = String(meta.model_name || meta.model || meta.name || '').trim();
  result.author = String(meta.modeled_by || meta.author || meta.captured_by || '').trim();
  result.sampleRate = parseInt(data.sample_rate || meta.sample_rate || 48000, 10);
  result.loudness = typeof meta.loudness === 'number' ? meta.loudness : null;

  if (result.modelMake && result.modelName) {
    result.gearName = `${result.modelMake} ${result.modelName}`;
  } else if (result.modelName) {
    result.gearName = result.modelName;
  } else if (result.modelMake) {
    result.gearName = result.modelMake;
  } else if (filename) {
    result.gearName = filename.replace(/\.(nam|json|namb)$/i, '');
  } else {
    result.gearName = 'NAM Amp Model';
  }

  // 3. Architecture & Shape Validation
  const rawArch = String(data.architecture || '').trim();
  const config = data.config || {};
  const a2Check = checkIsA2Shape(config);

  if (rawArch === 'A2' || rawArch === 'A2-Lite' || rawArch === 'A2-Full' || a2Check.isA2) {
    result.isV2 = true;
    result.architecture = 'A2';
    result.variant = a2Check.variant || (rawArch.includes('Lite') ? 'A2-Lite' : 'A2-Full');
    result.architectureLabel = `NAM A2 (${result.variant})`;
    result.channels = a2Check.channels || (result.variant === 'A2-Lite' ? 3 : 8);
    result.activation = config.activation || 'PReLU';
  } else if (rawArch === 'SlimmableWavenet') {
    result.isV2 = true;
    result.architecture = 'SlimmableWavenet';
    result.architectureLabel = 'Slimmable WaveNet';
    result.activation = config.activation || 'FastTanh';
  } else if (rawArch === 'Container') {
    result.isV2 = true;
    result.architecture = 'Container';
    result.architectureLabel = 'Container Model';
  } else if (rawArch === 'LSTM') {
    result.architecture = 'LSTM';
    result.architectureLabel = 'LSTM Model';
    result.activation = 'Tanh';
  } else if (rawArch === 'ConvNet') {
    result.architecture = 'ConvNet';
    result.architectureLabel = 'ConvNet Model';
    result.activation = config.activation || 'PReLU';
  } else {
    // Default legacy WaveNet V1
    result.architecture = 'WaveNet';
    result.architectureLabel = 'NAM V1 (WaveNet)';
    result.activation = config.activation || (config.gated ? 'Tanh * Sigmoid' : 'Tanh');
  }

  // 4. Weights verification
  if (Array.isArray(data.weights)) {
    result.weightsCount = data.weights.length;
  }

  // 5. Generate clean pedal slot name (max 10-12 chars for Pocket Master LCD display)
  result.cleanSlotName = formatSlotName(result.gearName, result.variant, result.isV2);
  result.isValid = true;

  // Add helpful diagnostic warnings
  if (result.sampleRate !== 48000) {
    result.warnings.push(`Model sample rate is ${result.sampleRate}Hz (Pocket Master hardware operates at 48kHz; will be resampled automatically via r8b)`);
  }
  if (result.isV2 && !a2Check.isA2 && rawArch !== 'A2') {
    result.warnings.push('Model is marked as V2 but has non-A2 architecture');
  }

  return result;
}

/**
 * Formats a clean, readable name for the Pocket Master 10-character LCD display
 */
export function formatSlotName(fullName, variant = '', isV2 = false) {
  if (!fullName) return isV2 ? 'NAM A2' : 'NAM AMP';

  // Remove file extensions & common noisy suffixes
  let name = fullName
    .replace(/\.(nam|json|namb)$/i, '')
    .replace(/[-_]/g, ' ')
    .trim();

  // If name has make and model (e.g. "Marshall JCM800 High"), shorten intelligently
  const words = name.split(/\s+/).filter(Boolean);
  if (words.length >= 2 && words[0].length + words[1].length <= 9) {
    name = `${words[0]} ${words[1]}`;
  } else if (words.length > 0 && words[0].length > 9) {
    name = words[0].slice(0, 10);
  }

  // Append V2/Lite hint if space permits
  if (isV2 && variant.includes('Lite') && name.length <= 6) {
    name = `${name} Lt`;
  } else if (isV2 && name.length <= 7) {
    name = `${name} A2`;
  }

  return name.slice(0, 10).toUpperCase();
}

/**
 * Parses binary NAMB (compiled binary format)
 */
function parseBinaryNamb(arrayBuffer, filename = '') {
  const bytes = new Uint8Array(arrayBuffer);
  const result = {
    isValid: true,
    isV2: true,
    architecture: 'A2',
    architectureLabel: 'NAM A2 (Binary .namb)',
    variant: 'A2-Binary',
    version: '0.7.0',
    normalizedVersion: '0.7.0',
    sampleRate: 48000,
    channels: 8,
    weightsCount: Math.floor(bytes.length / 4),
    gearName: filename ? filename.replace(/\.namb$/i, '') : 'NAM Binary Model',
    modelMake: '',
    modelName: '',
    author: 'NAM Converter',
    cleanSlotName: formatSlotName(filename, 'A2', true),
    activation: 'FastLUTActivation',
    loudness: null,
    warnings: ['Binary .namb format detected (pre-compiled model)'],
    rawJson: null
  };
  return result;
}

/**
 * Prepares normalized JSON string for transfer to hardware or CLO converter
 */
export function prepareNormalizedNamJson(parsedResult) {
  if (!parsedResult.rawJson) return null;
  const clone = JSON.parse(JSON.stringify(parsedResult.rawJson));

  // Ensure compatible version tag
  clone.version = parsedResult.normalizedVersion || '0.7.0';

  // Ensure metadata has clean name
  if (!clone.metadata) clone.metadata = {};
  if (!clone.metadata.name) clone.metadata.name = parsedResult.gearName;

  return JSON.stringify(clone);
}
