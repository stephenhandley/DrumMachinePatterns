const Fs = require('fs');

const Parsers = require('../Parsers');

const filepath = './Patterns.txt';
const text = Fs.readFileSync(filepath, 'utf8');

const parser = new Parsers.Text();
const patterns = parser.parse(text);

console.log(`Parsed ${patterns.length} patterns.`);

const json = JSON.stringify(patterns, null, 1);
Fs.writeFileSync('./Patterns.json', json, 'utf8');
console.log('Wrote patterns to json');

process.exit(0);
