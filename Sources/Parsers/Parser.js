class Parser {
  parse (input) {
    throw new Error('Parser child class should implement .parse');
  }

  matchRegex ({line, regex}) {
    if (regex.constructor !== RegExp) {
      regex = new RegExp(regex);
    }
    const match = line.match(regex);
    return match ? match.groups : false;
  }
}

module.exports = Parser;
