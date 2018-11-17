const Showdown = require('showdown');
const {JSDOM} = require('jsdom');

const Parser = require('./Parser');
const {SoundByCode} = require('./Maps');

class PatternParserMarkdown extends Parser {
  parse (input) {
    this.input = input;
    const html = this.parseMarkdown(input);
    const sections = this.sections(html);
    let patterns = [];
    for (const section of sections) {
      const section_patterns = this.parseSection(section);
      patterns = [...patterns, ...section_patterns];
    }
    return patterns;
  }

  parseMarkdown (markdown) {
    const converter = new Showdown.Converter({
      tables: true
    });
    converter.setFlavor('github');
    markdown = this.trim(markdown);
    return converter.makeHtml(markdown);
  }

  trim (markdown) {
    const start = '## Patterns from the book *200 Drum machine patterns*';
    const end = '## Patterns from the book *260 Drum machine patterns*';
    const start_index = markdown.indexOf(start) + start.length;
    const end_index = markdown.indexOf(end);
    return markdown.slice(start_index, end_index);
  }

  sections (html) {
    const h3_open = '<h3';
    return html.split(h3_open).map((section)=> {
      return `${h3_open}${section}`;
    }).slice(1);
  }

  parseSection (section) {
    const dom = new JSDOM(section);
    const doc = dom.window.document;

    const query = doc.querySelector.bind(doc);
    const queryAll = doc.querySelectorAll.bind(doc);

    const title_prefix = query('h3').textContent;

    const details = query('p').textContent;
    let {signature, tempo_low, tempo_high} = this.matchDetails(details);

    const subtitles = queryAll('h4');
    const tables = queryAll('table');

    const patterns = [];
    for (let i = 0; i < subtitles.length; i++) {
      const subtitle = subtitles[i].textContent;
      const title = `${title_prefix}${subtitle}`.replace(/\s/g, '');
      const table = tables[i];
      const length = parseInt(table.querySelector('thead tr :last-child').textContent);
      const lanes = {};
      const pattern = {title, signature, length, lanes}

      for (let row of table.querySelectorAll('tbody tr')) {
        row = Array.from(row.querySelectorAll('td'));
        let [sound, ...notes] = row.map((col)=> col.textContent);
        const is_accent = (sound === 'AC');
        const one_val = is_accent ? 'Accent' : 'Note';
        notes = notes.map((note)=> (note === '1') ? one_val : 'Rest');
        if (is_accent) {
          pattern.accent = notes;
        } else {
          sound = SoundByCode[sound];
          lanes[sound] = notes;
        }
      };
      patterns.push(pattern);
    }

    return patterns;
  }

  matchDetails (line) {
    // 4/4, quarter note 112-139
    const regex = /^\s*(?<signature>\d+\/\d+)[^\d]*((?<tempo_low>\d+)(-(?<tempo_high>\d+))?)?\s*$/;
    return this.matchRegex({line, regex});
  }
}

module.exports = PatternParserMarkdown;
