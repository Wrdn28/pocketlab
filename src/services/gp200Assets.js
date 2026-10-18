/**
 * Valeton GP-200 Asset Mapping & UI Theme Helpers
 * Extracted and reverse-engineered from Valeton GP-200 Windows V1.8.1
 */

export const GP200_MODULE_TAG_MAP = {
  PRE: 'PRE',
  DRV: 'DST',
  DST: 'DST',
  NR: 'NR',
  AMP: 'AMP',
  CLONE: 'AMP',
  IR: 'CAB',
  CAB: 'CAB',
  EQ: 'EQ',
  MOD: 'MOD',
  FX1: 'PRE',
  FX2: 'MOD',
  DLY: 'DLY',
  RVB: 'RVB',
  VOL: 'VOL',
  WAH: 'WAH'
};

/**
 * Returns the authentic 180x180 Valeton GP-200 chain icon path
 */
export function getGp200ChainIcon(moduleName, isOn = true, isSelected = false) {
  const upper = (moduleName || '').toUpperCase();
  const tag = GP200_MODULE_TAG_MAP[upper] || 'AMP';
  const state = isOn ? 'on' : 'off';
  const sel = isSelected ? '_selected' : '';
  return `/gp200/Background/chain_icon_${tag}_${state}${sel}.png`;
}

/**
 * Maps effect model names to authentic Valeton GP-200 faceplate images
 */
export function getGp200Faceplate(moduleName, effectName) {
  if (!effectName) return null;
  const modUpper = (moduleName || '').toUpperCase();
  const ef = (effectName || '').trim();
  const efLower = ef.toLowerCase();

  // 1. Amplifiers
  if (modUpper === 'AMP') {
    if (efLower.includes('halen') || efLower.includes('5150') || efLower.includes('ev 51')) return '/gp200/effects_bg/AMP/EV 51.png';
    if (efLower.includes('dizz')) return '/gp200/effects_bg/AMP/Dizz VH.png';
    if (efLower.includes('flyman') || efLower.includes('flagman')) return '/gp200/effects_bg/AMP/Flagman 1.png';
    if (efLower.includes('b-man b') || efLower.includes('bellman 59b')) return '/gp200/effects_bg/AMP/Bellman 59B.png';
    if (efLower.includes('b-man n') || efLower.includes('bellman 59n')) return '/gp200/effects_bg/AMP/Bellman 59N.png';
    if (efLower.includes('twin')) return '/gp200/effects_bg/AMP/Dark Twin.png';
    if (efLower.includes('twd delux') || efLower.includes('dark dlx')) return '/gp200/effects_bg/AMP/Dark DLX.png';
    if (efLower.includes('voks 30tb') || efLower.includes('ac pre 2')) return '/gp200/effects_bg/AMP/AC Pre 2.png';
    if (efLower.includes('voks') || efLower.includes('ac pre')) return '/gp200/effects_bg/AMP/AC Pre.png';
    if (efLower.includes('eng 120') || efLower.includes('eng power') || efLower.includes('eagle')) return '/gp200/effects_bg/AMP/Eagle 120.png';
    if (efLower.includes('brit 45')) return '/gp200/effects_bg/AMP/UK 45.png';
    if (efLower.includes('brit 50jp')) return '/gp200/effects_bg/AMP/UK 50JP.png';
    if (efLower.includes('brit 800') || efLower.includes('uk 800')) return '/gp200/effects_bg/AMP/UK 800.png';
    if (efLower.includes('sol 100')) return '/gp200/effects_bg/AMP/Flagman +1.png';
    if (efLower.includes('calif') || efLower.includes('dual')) return '/gp200/effects_bg/AMP/Bog RedM.png';
    if (efLower.includes('bog')) return '/gp200/effects_bg/AMP/Bog RedM.png';
    if (efLower.includes('bass')) return '/gp200/effects_bg/AMP/Classic Bass.png';
    return '/gp200/effects_bg/AMP/EV 51.png';
  }

  // 2. Overdrive / Distortion
  if (modUpper === 'DRV' || modUpper === 'DST') {
    if (efLower.includes('scream') || efLower.includes('ts')) return '/gp200/effects_bg/DST/Green OD.png';
    if (efLower.includes('butter') || efLower.includes('yellow')) return '/gp200/effects_bg/DST/Yellow OD.png';
    if (efLower.includes('jp dist') || efLower.includes('chief') || efLower.includes('ds-1')) return '/gp200/effects_bg/DST/Chief.png';
    if (efLower.includes('mouse') || efLower.includes('rat')) return '/gp200/effects_bg/DST/Darktale.png';
    if (efLower.includes('shark') || efLower.includes('revolt')) return '/gp200/effects_bg/DST/Revolt.png';
    if (efLower.includes('grey fuzz')) return '/gp200/effects_bg/DST/Sora Fuzz.png';
    if (efLower.includes('red fuzz')) return '/gp200/effects_bg/DST/Red Haze.png';
    if (efLower.includes('bass')) return '/gp200/effects_bg/DST/Bass OD.png';
    return '/gp200/effects_bg/DST/Green OD.png';
  }

  // 3. Noise Reduction
  if (modUpper === 'NR') {
    return '/gp200/effects_bg/NR/Gate 1.png';
  }

  // 4. FX1 (Compressor / Filter / Wah)
  if (modUpper === 'FX1' || modUpper === 'PRE') {
    if (efLower.includes('comp')) return '/gp200/effects_bg/PRE/COMP.png';
    if (efLower.includes('touch') || efLower.includes('t-wah')) return '/gp200/effects_bg/WAH/T-Wah.png';
    if (efLower.includes('auto wah') || efLower.includes('a-wah')) return '/gp200/effects_bg/WAH/A-Wah.png';
    if (efLower.includes('boost')) return '/gp200/effects_bg/PRE/Boost.png';
    if (efLower.includes('a-chorus')) return '/gp200/effects_bg/MOD/A-Chorus.png';
    if (efLower.includes('b-chorus')) return '/gp200/effects_bg/MOD/B-Chorus.png';
    if (efLower.includes('flanger')) return '/gp200/effects_bg/MOD/Jet.png';
    if (efLower.includes('phaser')) return '/gp200/effects_bg/MOD/O-Phase.png';
    if (efLower.includes('vibe')) return '/gp200/effects_bg/MOD/Vibe.png';
    if (efLower.includes('vibrato')) return '/gp200/effects_bg/MOD/Vibrato.png';
    if (efLower.includes('trem')) return '/gp200/effects_bg/MOD/Triangle Trem.png';
    if (efLower.includes('ac g') || efLower.includes('sim')) return '/gp200/effects_bg/PRE/AC Sim.png';
    return '/gp200/effects_bg/PRE/COMP.png';
  }

  // 5. FX2 (Modulation)
  if (modUpper === 'FX2' || modUpper === 'MOD') {
    if (efLower.includes('comp')) return '/gp200/effects_bg/PRE/COMP.png';
    if (efLower.includes('touch') || efLower.includes('t-wah')) return '/gp200/effects_bg/WAH/T-Wah.png';
    if (efLower.includes('auto wah') || efLower.includes('a-wah')) return '/gp200/effects_bg/WAH/A-Wah.png';
    if (efLower.includes('octave')) return '/gp200/effects_bg/PRE/OCTA.png';
    if (efLower.includes('pitch')) return '/gp200/effects_bg/PRE/Pitch.png';
    if (efLower.includes('detune')) return '/gp200/effects_bg/MOD/Detune.png';
    if (efLower.includes('boost')) return '/gp200/effects_bg/PRE/Boost.png';
    if (efLower.includes('a-chorus')) return '/gp200/effects_bg/MOD/A-Chorus.png';
    if (efLower.includes('b-chorus')) return '/gp200/effects_bg/MOD/B-Chorus.png';
    if (efLower.includes('flanger')) return '/gp200/effects_bg/MOD/Jet.png';
    if (efLower.includes('phaser')) return '/gp200/effects_bg/MOD/O-Phase.png';
    if (efLower.includes('vibe')) return '/gp200/effects_bg/MOD/Vibe.png';
    if (efLower.includes('vibrato')) return '/gp200/effects_bg/MOD/Vibrato.png';
    if (efLower.includes('trem')) return '/gp200/effects_bg/MOD/Triangle Trem.png';
    return '/gp200/effects_bg/MOD/A-Chorus.png';
  }

  // 6. Delay
  if (modUpper === 'DLY') {
    if (efLower.includes('pure')) return '/gp200/effects_bg/DLY/Pure.png';
    if (efLower.includes('slap')) return '/gp200/effects_bg/DLY/Slapback.png';
    if (efLower.includes('warm') || efLower.includes('sweet')) return '/gp200/effects_bg/DLY/Sweet Echo.png';
    if (efLower.includes('mag') || efLower.includes('vintage')) return '/gp200/effects_bg/DLY/Vintage Rack.png';
    if (efLower.includes('tube')) return '/gp200/effects_bg/DLY/Tube.png';
    if (efLower.includes('rev')) return '/gp200/effects_bg/DLY/Rev Echo.png';
    if (efLower.includes('analog')) return '/gp200/effects_bg/DLY/Analog.png';
    if (efLower.includes('sweep')) return '/gp200/effects_bg/DLY/Sweep Echo.png';
    if (efLower.includes('ping')) return '/gp200/effects_bg/DLY/Ping Pong.png';
    return '/gp200/effects_bg/DLY/Pure.png';
  }

  // 7. Reverb
  if (modUpper === 'RVB') {
    if (efLower.includes('air')) return '/gp200/effects_bg/RVB/Sweet Space.png';
    if (efLower.includes('room')) return '/gp200/effects_bg/RVB/Room.png';
    if (efLower.includes('hall')) return '/gp200/effects_bg/RVB/Hall.png';
    if (efLower.includes('church')) return '/gp200/effects_bg/RVB/Church.png';
    if (efLower.includes('plate')) return '/gp200/effects_bg/RVB/Plate.png';
    if (efLower.includes('spring')) return '/gp200/effects_bg/RVB/Spring.png';
    if (efLower.includes('light')) return '/gp200/effects_bg/RVB/N-Star.png';
    if (efLower.includes('ocean')) return '/gp200/effects_bg/RVB/Deepsea.png';
    if (efLower.includes('dream')) return '/gp200/effects_bg/RVB/Shimmer.png';
    return '/gp200/effects_bg/RVB/Hall.png';
  }

  // 8. Equalizer
  if (modUpper === 'EQ') {
    if (efLower.includes('bass')) return '/gp200/effects_bg/EQ/Bass EQ 1.png';
    return '/gp200/effects_bg/EQ/Guitar EQ 1.png';
  }

  // 9. Cabinets / IR
  if (modUpper === 'CAB' || modUpper === 'IR') {
    return '/gp200/Background/CabBackGround.png';
  }

  return null;
}
