const fs = require('fs');
const path = require('path');

const DIR_SRC = path.join(__dirname, '../src');
const DIR_DIST = path.join(__dirname, '../dist');

// Properly formats item types
function getItemType (item) {
  switch (item.TYPE) {
    case 'worldMaterial':
      if (item.VOLUME >= 10)
        return 'Honeycomb';
      return 'Voxel';
    case 'object':
      if (item.VOLUME > 0)
        return 'Element';
      return 'Generic Item';
    case 'material':
      return 'Crafting Item';
    case 'none':
      if (~item.NAME.toLowerCase().indexOf('schematic'))
        return 'Schematic';
      if (~item.NAME.toLowerCase().indexOf('blueprint'))
        return 'Blueprint';
    default:
      return 'Unknown';
  }
}

// TSV reader
function parseTsv (tsv, headers) {
  const lines = tsv.split('\n');

  // Reads a TSV line
  const readTsvLine = function (line) {
    return line.split('\t').map((value) => value.trim());
  }

  // Zips keys and values together
  const zip = function (keys, values) {
    const result = {};
    for (let i = 0; i < Math.min(keys.length, values.length); i++) {
      result[keys[i]] = values[i];
    }
    return result;
  }

  // Gets headers
  if (!headers) {
    headers = readTsvLine(lines.shift());
  }

  // Parses file
  return lines.map((line) => zip(headers, readTsvLine(line)));
}

// Main entrypoint
(async function main () {
  // Reads source
  console.info('Reading source file...');
  const tsv = fs.readFileSync(path.join(DIR_SRC, 'Items.tsv')).toString();

  // Reads TSV file
  console.info('Parsing TSV source...');
  const parsed = parseTsv(tsv);

  // Converts into our format
  console.info('Formatting data...');
  const result = {};
  parsed.forEach((item) => {
    result[item.ID] = {
      id: item.ID,
      name: item.NAME,
      type: item.TYPE,
      typeParsed: getItemType(item),
      unitMass: parseFloat(item.MASS) || null,
      unitVolume: parseFloat(item.VOLUME) || null,
      iconPath: item.ICONPATH,
    };
  });
  
  // Writes the output file
  console.info('Writing output file...');
  fs.writeFileSync(path.join(DIR_DIST, 'Items.json'), JSON.stringify(result, null, 2));
})();