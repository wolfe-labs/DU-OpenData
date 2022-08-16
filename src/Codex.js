/**
 * This file contains EXTRA things to be added to the Codex, such as Lua globals, etc.
 * They will be merged with the normal Codex AFTER it has been generated, so keep in mind anything here WILL OVERRIDE the Codex data.
 */

module.exports = {
  globals: {
    // The good-old globals
    library: { type: 'Library' },
    system: { type: 'System' },
    unit: { type: 'ControlUnit' },
    player: { type: 'Player' },
    construct: { type: 'Construct' },

    // New stuff
    DULibrary: { type: 'Library' },
    DUSystem: { type: 'System' },
    DUPlayer: { type: 'Player' },
    DUConstruct: { type: 'Construct' },
  }
};