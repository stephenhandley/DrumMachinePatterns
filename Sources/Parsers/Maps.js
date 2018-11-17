function invertMap (map) {
  return Object.entries(map).reduce((result, [k, v])=> {
    result[v] = k;
    return result;
  }, {});
}

const SoundByCode = {
  BD: 'BassDrum',
  SD: 'SnareDrum',
  LT: 'LowTom',
  MT: 'MediumTom',
  HT: 'HighTom',
  CH: 'ClosedHiHat',
  OH: 'OpenHiHat',
  CY: 'Cymbal',
  RS: 'RimShot',
  CP: 'Clap',
  CB: 'Cowbell',
  TM: 'Tambourine'
};

const ValueByCode = {
  ' ': 'Rest',
  'o': 'Note',
  'x': 'Flam',
  '*': 'Accent'
};

const CodeBySound = invertMap(SoundByCode);
const CodeByValue = invertMap(ValueByCode);

module.exports = {
  SoundByCode,
  CodeBySound,
  ValueByCode,
  CodeByValue
};
