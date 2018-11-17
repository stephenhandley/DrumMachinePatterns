const Parser = require('./Parser');
const {
  SoundByCode,
  CodeBySound,
  ValueByCode,
  CodeByValue
} = require('./Maps');

const State = [
  'Ready',
  'Header',
  'Guide',
  'Pattern',
  'Error',
  'Success'
].reduce((states, state)=> {
  states[state] = state;
  return states;
}, {});

function nDashes (n) {
  let len = n + 'xx: '.length;
  let dashes = '';
  for (let i = 0; i < len; i++) {
    dashes += '-';
  }
  return dashes;
}

function nGuide (n) {
  let guide = '%   ';
  for (let i = 1; i <= n; i++) {
    const str = i.toString();
    const char = str[str.length - 1];
    guide += char;
  }
  return guide;
}

function invertNotes (notes) {
  return notes.map((note)=> CodeByValue[note]);
}

class PatternParserText extends Parser {
  constructor () {
    super();
    this.state = State.Ready;
    this.line_number = 0;
    this.line = null;
    this.pattern = {};
    this.patterns = [];
  }

  static generate (patterns) {
    return patterns.map((pattern)=> {
      const {title, signature, length, lanes, accent} = pattern;
      const header_title = `${title} ${signature}`;
      const header_dashes = nDashes(length);
      const header_guide = nGuide(length);
      const lines = [
        header_title,
        header_dashes,
        header_guide
      ];

      if (accent) {
        const accent_codes = invertNotes(accent).join('');
        const accent_line = `    ${accent_codes}`;
        lines.push(accent_line);
      }

      for (const [sound, notes] of Object.entries(lanes)) {
        const sound_code = CodeBySound[sound];
        const note_codes = invertNotes(notes).join('');
        const line = `${sound_code}: ${note_codes}`;
        lines.push(line);
      }
      return lines.join('\n');
    }).join('\n\n');
  }

  parse (input) {
    this.input = input;
    this.lines = input.split('\n');

    while (!this.inState(State.Error, State.Success)) {
      this.parseLine();
    }

    const {state} = this;
    switch (state) {
      case State.Success:
        return this.patterns;
      case State.Error:
        throw this.error;
      default:
        throw new Error(`Parser in invalid final state: ${state}`);
    }
  }

  parseLine () {
    const {line_number, lines, state} = this;

    this.line = lines[line_number];

    if (this.isComment(this.line)) {
      this.line_number++;
      return;
    }

    switch (state) {
      case State.Ready:
        this.parseHeader();
        break;
      case State.Header:
        this.parsePattern();
        break;
      default:
        this.setError(`Parser is in bad state: ${state}`);
    }

    this.line_number++;
    if (this.line_number >= this.lines.length) {
      this.state = State.Success;
    }
  }

  parseHeader () {
    const title_match = this.matchTitle(this.line);
    if (!title_match) {
      this.setError('Invalid header: title');
      return;
    }
    const {title, signature} = title_match;

    const dashes_line = this.lines[this.line_number + 1];
    const dashes_match = this.matchDashes(dashes_line);
    if (!dashes_match) {
      this.setError('Invalid header: dashes missing');
      return;
    }

    const guide_line = this.lines[this.line_number + 2];
    const guide_match = this.matchGuide(guide_line);
    if (!guide_match) {
      return this.setError('Invalid header: guide');
      return;
    }
    const {length} = guide_match.guide;

    Object.assign(this.pattern, {title, signature, length});
    this.line_number = this.line_number + 2;
    this.state = State.Header;
  }

  parsePattern () {
    this.state = State.Pattern;

    this.pattern.lanes = {};
    while (this.inState(State.Pattern)) {
      this.parseLane();
    }

    this.patterns.push(this.pattern);
    this.pattern = {};
  }

  parseLane () {
    if (this.isBlank(this.line)) {
      this.state = State.Ready;
      return;
    }

    const accent_match = this.matchAccent(this.line);
    if (accent_match) {
      const {accent} = accent_match;
      this.pattern.accent = this.parseNotes(accent);
    } else {
      const lane_match = this.matchLane(this.line);
      if (!lane_match) {
        return this.setError('Invalid lane');
      }
      const {snd, pattern} = lane_match;
      const sound = SoundByCode[snd];
      const notes = this.parseNotes(pattern);
      this.pattern.lanes[sound] = notes;
    }

    this.line_number++;
    this.line = this.lines[this.line_number];
  }

  parseNotes (pattern) {
    const notes = pattern.split('').map((c)=> ValueByCode[c]);
    while (notes.length < this.pattern.length) {
      notes.push(ValueByCode[' ']);
    }
    return notes;
  }

  isGuide (line) {
    return line.startsWith('%');
  }

  isComment (line) {
    return line.startsWith('#');
  }

  isBlank (line) {
    return line.match(/^\s*$/);
  }

  matchDashes (line) {
    return line.match(/^-+$/);
  }

  matchTitle (line) {
    const regex = /^(?<title>[^ ]+) +(?<signature>\d+\/\d+)$/;
    return this.matchRegex({line, regex});
  }

  matchGuide (line) {
    const regex = /^%   (?<guide>\w+)$/;
    return this.matchRegex({line, regex});
  }

  matchAccent (line) {
    const regex = `^    (?<accent>[ *]+)$`;
    return this.matchRegex({line, regex});
  }

  matchLane (line) {
    const sounds = Object.keys(SoundByCode).join('|');
    const regex = `^(?<snd>${sounds}): (?<pattern>[ ox]+)`;
    return this.matchRegex({line, regex});
  }

  inState (/* states */) {
    const states = Array.from(arguments);
    const {state} = this;
    return states.includes(state);
  }

  setError (message) {
    const {line_number, line} = this;
    message = `Parse error ${message} on line ${line_number}: ${line}`;
    this.error = new Error(message);
    this.state = State.Error;
  }
}

module.exports = PatternParserText;
