const fs = require('fs');
const path = require('path');
const child_process = require('child_process');

const DIR_LIB = path.join(__dirname, '../lib');
const DIR_TEMP = path.join(__dirname, '../temp');

// Main entrypoint
(async function main () {
  // Processes arguments
  const args = process.argv.slice(2);
  const file = args[0];
  const out = args[1];

  // Sanity check
  if (!fs.existsSync(file)) {
    console.error('File not found:', file);
    process.exit(1);
  }

  // Reads source Lua
  console.info('Reading source file...');
  const rawLua = fs.readFileSync(file).toString();
  
  // Checks if we're following the "return {...}" syntax
  if (!rawLua.startsWith('return')) {
    console.error('The source file must follow the "return {...}" format!')
    process.exit(1);
  }

  // Extracts the actual return value
  const rawLuaValue = rawLua.substring('return'.length).trim();

  // Checks for Lua table
  if (!rawLuaValue.startsWith('{')) {
    console.error('Source file is not a Lua table!')
    process.exit(1)
  }

  // Checks for Lua environment
  if (!rawLuaValue.startsWith('{')) {
    console.error('Source file is not a Lua table!')
    process.exit(1)
  }

  // Checks for Lua runtime
  console.info('Checking Lua runtime...');
  try {
    child_process.execSync('lua -v');
  } catch (err) {
    console.error('Lua executable error!');
    process.exit(1);
  }

  // Time for the fun part! Let's build the Lua and extract that value!
  console.info('Creating Lua application...');
  const jsonLua = fs.readFileSync(path.join(DIR_LIB, 'json.lua')).toString();
  const tempLua = `
  local json = (function () ${jsonLua} end)()
  local data = (function () return ${rawLuaValue} end)()
  local result = json.encode(data)
  print(result)
  `
  const tempLuaFile = path.join(DIR_TEMP, 'lua2json.lua');
  fs.writeFileSync(tempLuaFile, tempLua);

  // Runs the app
  console.info('Running Lua application');
  const luaProcess = child_process.spawn('lua', [tempLuaFile]);

  // Listens on stdout
  const luaAppResult = [];
  luaProcess.stdout.on('data', (data) => {
    luaAppResult.push(data.toString());
  });

  // Waits for closing
  luaProcess.on('close', (code) => {
    // Handles errors
    if (code != 0) {
      console.error('Failed to run Lua application!');
      process.exit(1);
    }

    // Parses our JSON
    const resultJson = JSON.parse(luaAppResult.join(''));

    // Writes output
    console.info('Writing output...');
    fs.writeFileSync(out, JSON.stringify(resultJson, null, 2));

    // Deletes Lua app
    fs.unlinkSync(tempLuaFile);
  });
})();