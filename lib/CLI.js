const colors = require('colors');

module.exports = class CLI {
  // Prints a normal message
  static print () {
    console.log(...Array.from(arguments));
  }

  // Prints a warning message
  static warn () {
    this.print(
      '[WARNING]'.yellow.bold,
      ...Array.from(arguments)
    );
  }
}