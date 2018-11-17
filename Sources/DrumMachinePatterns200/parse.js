const Fs = require('fs');

const Parsers = require('../Parsers');

const filepath = './Raw.md';
const markdown = Fs.readFileSync(filepath, 'utf8');

const md_parser = new Parsers.Markdown();
const patterns = md_parser.parse(markdown);

console.log(`Parsed ${patterns.length} patterns.`);

const json = JSON.stringify(patterns, null, 1);
Fs.writeFileSync('./Patterns.json', json, 'utf8');
console.log('Wrote patterns to json');

console.log('Generating text');
const text = Parsers.Text.generate(patterns);
Fs.writeFileSync('./Patterns.txt', text, 'utf8');
console.log('Wrote patterns to text');

process.exit(0);
