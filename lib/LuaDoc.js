/**
 * LuaDoc parser in JS, only intended to read stuff on the DU API Mockup so things might not follow the pattern exactly
 */

// Our regexes
const REGEX_CLASS = /---\s*@class (.*)/i;
const REGEX_MULTICOMMENT = /---\s*(.*)/i;
const REGEX_PARAM = /---\s*@param (.*)/i;
const REGEX_DEPRECATED = /---\s*@deprecated\s*(.*)?/i;
const REGEX_RETURN = /---\s*@return (.*)/i;
const REGEX_PARENT = /self = (.*?)\(.*?\)/i;
const REGEX_METHOD = /function self\.(.*?)\s*\(.*?\)/i;
const REGEX_EVENT = /self\.(.*?)\s*=\s*Event:new()/i;

module.exports = function LuaDoc (luaString) {
  // This is where we'll store each of the classes we find
  const classes = {};
  
  // Breaks down our massive Lua string into individual lines
  const source = luaString.split('\n');

  // This is our last line of code parsed, will come helpful later
  let lastLine = '';

  // Tracks down if we're in a class
  let currentClass = null;
  let currentClassName = null;

  // Tracks our current object, generically
  let shouldCommit = false;
  let currentObject = {};
  let currentObjectName = null;
  let currentObjectType = null;
  
  // Loops through code
  source.forEach((line) => {
    // Trims the line
    line = line.trim();

    // If current line and last line were breaks, commits the current object into class
    if (line == '' && lastLine == '') {
      shouldCommit = true;
    }

    // Should we commit the current object?
    if (shouldCommit) {
      // Commits object
      if (currentClass && currentObjectName && currentObjectType) {
        currentClass[currentObjectType] = (currentClass[currentObjectType] || {});
        currentClass[currentObjectType][currentObjectName] = currentObject;
      }

      // Clears current object and stops processing
      currentObject = {};
      currentObjectName = null;
      currentObjectType = null;
      shouldCommit = false;
    }

    // This variable will be used for regex matching
    let match = null;

    // Detects if we're changing a class now
    if (match = REGEX_CLASS.exec(line)) {
      // Saves current class (if any)
      if (currentClass) {
        classes[currentClassName] = currentClass;
      }
      
      // Extracts class name for the new class we're scanning
      currentClass = {};
      currentClassName = match[1];

      // Stops processing this line
      return;
    }

    // Detects parent class
    if (match = REGEX_PARENT.exec(line)) {
      currentClass.parent = match[1];
      return;
    }

    // Detects methods
    if (match = REGEX_METHOD.exec(line)) {
      currentObjectName = match[1];
      currentObjectType = 'methods';
      shouldCommit = true;
      return;
    }

    // Detects events
    if (match = REGEX_EVENT.exec(line)) {
      currentObjectName = match[1];
      currentObjectType = 'events';
      shouldCommit = true;
      return;
    }

    // Detects params
    if (match = REGEX_PARAM.exec(line)) {
      const parsed = match[1].split(' ');
      currentObject.params = currentObject.params || [];
      currentObject.params.push({
        name: parsed[0],
        type: parsed[1] || '',
        description: parsed.slice(2).join(' '),
      });
      return;
    }

    // Detects returns
    if (match = REGEX_RETURN.exec(line)) {
      const parsed = match[1].split(' ');
      currentObject.returns = currentObject.returns || [];
      currentObject.returns.push({
        type: parsed[0],
        description: parsed.slice(1).join(' '),
      });
      return;
    }

    // Detects deprecateds
    if (match = REGEX_DEPRECATED.exec(line)) {
      currentObject.deprecated = true;
      currentObject.description = ((currentObject.description || '') + '\n' + match[1]).trim();
      return;
    }

    // Detects general comments, this should always be last as it will match everything with ---
    if (match = REGEX_MULTICOMMENT.exec(line)) {
      currentObject.description = ((currentObject.description || '') + '\n' + match[1]).trim();
      return;
    }
  });

  // Saves last class found
  classes[currentClassName] = currentClass;

  // Returns the whole tree we built
  return {
    classes,
  };
}