const fs = require('fs/promises');
const fsutil = require('fs');
const path = require('path');
const _ = require('lodash');

const Git = require('../lib/GitClient');
const LuaDoc = require('../lib/LuaDoc');

const DIR_TEMP = 'temp';
const DIR_DIST = 'dist';
const DIR_REPO = path.join(DIR_TEMP, 'du-api');

const REGEX_FILE_LUA = /(.*?)\.lua$/i;

// Our entrypoint
(async function main () {
  // Creates temp working directory
  if (!fsutil.existsSync(DIR_TEMP)) fsutil.mkdirSync(DIR_TEMP);
  
  // Checks if the repo has been cloned already
  if (fsutil.existsSync(DIR_REPO)) {
    // Updates to most recent
    console.info('Updating official Lua API Mockup...');
    Git.pull(DIR_REPO);
  } else {
    // Clones directory
    console.info('Downloading official Lua API Mockup...');
    Git.clone('https://github.com/dual-universe/lua-examples.git', DIR_REPO);
  }

  // Mark as complete
  console.info('Lua API Mockup updated! Loading files...');

  // Reads directory
  const DIR_MOCK = path.join(DIR_REPO, 'api-mockup');
  const files = await fs.readdir(DIR_MOCK);

  // Processes each of the files and merges them all
  const codex = _.merge(...files
    // Maps the files into their parsed LuaDocs
    .map((file) => {
      const filepath = path.join(DIR_MOCK, file);

      // Skips non-Lua files
      if (!REGEX_FILE_LUA.test(file)) return null;

      // Skips directories
      if (!fsutil.statSync(filepath).isFile()) return null;

      // Updates UI
      console.info(`Processing file: ${file}`);

      // Temporarily reads the Element file
      const content = fsutil.readFileSync(filepath).toString();

      // Parses LuaDoc and returns
      return LuaDoc(content);
    })

    // Excludes any null values
    .filter((file) => !!file),

    // Merges with the globals and other settings
    require('../src/Codex')
  );

  // Prepares output
  const DIR_DIST_LUA = path.join(DIR_DIST, 'Lua');
  if (!fsutil.existsSync(DIR_DIST)) await fs.mkdir(DIR_DIST);
  if (!fsutil.existsSync(DIR_DIST_LUA)) await fs.mkdir(DIR_DIST_LUA);
  
  // Writes file
  console.info('Writing Codex file...');
  await fs.writeFile(path.join(DIR_DIST_LUA, 'Codex.json'), JSON.stringify(codex, null, 2));
})();