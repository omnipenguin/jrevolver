#! /usr/bin/env node
import fs from 'fs';
import path from 'path';
import shell from 'shelljs';
import colors from 'colors';
import { JR_FUNC, PREFIX, INCLUDE_TYPE, OUTPUT_JSON_INDENT, OUTPUT_FILEPATH_MIN_CHARS } from './constants.js';
import { isObject, isArray, isObjectNotArray, mergeDeep, removeComments, md5, getSelfCmd, getPropByPath } from './helpers.js';
import cloneDeep from './cloneDeep.js';
import parseMaps from './mutator.js';

/**
 * CONSTANTS
 */
const ARGS = {
  node: 0,
  script: 1,
  inputFile: 2,
  outputDir: 3
};

let inputFile;
let outputDir;
let inputFilePath;
let inputFilename;
let inputBasename;
let includePaths;
let data;
let mockHasMaps = false;

/**
 * Validate arguments
 */
if (process.argv.length !== Object.keys(ARGS).length) {
  const errorStr = ['',
    colors.red("ERROR:\tgenerate.js was invoked incorrectly"),
    colors.yellow("Expected:") + "\tnode {appPath}/generate.js {inputJsonFile/Directory} {outputFile/Directory}",
    colors.yellow("Actual") + `\t\t${getSelfCmd()}`,
  ''].join("\n");

  console.error(errorStr);
  process.exit(1);
} else {
  // input directory/file
  inputFile = path.resolve(process.argv[ARGS.inputFile]);
  inputFilePath = process.env.jInputDir || path.dirname(inputFile);
  inputFilename = path.basename(inputFile);
  inputBasename = inputFilename.substr(0, inputFilename.lastIndexOf('.'));
  includePaths = [].concat(inputFilePath, process.env.jIncludeDirs).filter(path => !!path);

  // output directory/files
  outputDir = process.env.jOutputDir || path.resolve(process.argv[ARGS.outputDir]);
}

/**
 * Load jRevolver layout (input file)
 */
let buf = fs.readFileSync(inputFile, 'utf8');
data = JSON.parse(buf);

/**
 * Print relevant pre-execution output
 */
printOutputPre();

/**
 * Parse all includes and maps
 * Supports infinitely nested includes/maps (maps within includes, includes within maps, etc...)
 */
const permutations = parseLayout(data);

/**
 * Output/write compiled JSON to disk
 */
mockHasMaps = (permutations.length > 1);
if (mockHasMaps) {
  outputDir += '/' + inputBasename;
  shell.rm('-rf', outputDir);
  shell.mkdir('-p', outputDir);

  let customFnRepeated = 0;

  for (const [p, ] of Object.entries(permutations)) {
    // generate custom filename, if it has been passed
    let customFileName = permutations[p][JR_FUNC.filename];
    if (customFileName) {
      customFileName = customFileName
          .replace(/(\{[^\}]*\})/gi, function(match, p1, offset, string) { // eslint-disable-line no-unused-vars
            const propName = p1.replace(/\}|\{/gi, '');
            return getPropByPath(permutations[p], propName) || '';
          });

      delete permutations[p][JR_FUNC.filename];
    }

    const pData = JSON.stringify(permutations[p], null, OUTPUT_JSON_INDENT);
    const customFp  = `${outputDir}/${customFileName}.json`;
    const defaultFp = `${outputDir}/${md5(pData)}.json`;

    let outputFilePath;
    if (customFileName) {
      if (!fs.existsSync(customFp)) {
        outputFilePath = customFp;
      } else {
        outputFilePath = defaultFp;
        customFnRepeated++;
      }
    } else {
      outputFilePath = defaultFp;
    }

    try {
      fs.writeFileSync(outputFilePath, pData);
    } catch (e) {
      throw e;
    }
  }

  const numSavedMocks = fs.readdirSync(outputDir).length;
  const numSavedMocksDiff = 0 || permutations.length - numSavedMocks;

  if (customFnRepeated > 0) {
    console.warn(colors.yellow(
        `You have specified an output file name that resulted in ${customFnRepeated} permutations having the same filename.\n` +
        `These mocks have been saved with their default filenames instead`
    ));
  } else if (numSavedMocksDiff !== 0) {
    console.error(colors.red(`There was an error, for some reason ${numSavedMocksDiff} permutations had the same hash`));
  }
} else {
  const outputFilePath = `${outputDir}/${inputFilename}`;
  shell.mkdir('-p', outputDir);

  if (fs.existsSync(outputFilePath)) {
    shell.rm(outputFilePath);
  }

  try {
    fs.writeFileSync(outputFilePath, JSON.stringify(permutations[0], null, OUTPUT_JSON_INDENT));
  } catch (e) {
    throw e;
  }
}

/**
 * Print relevant post-execution output
 */
printOutputPost();

/**
 * EXIT
 */
process.exit(0);



/******          ******
 ** HELPER FUNCTIONS **
 ******          ******/



/**
 * Prints relevant input about this script execution
 * @returns {void}
 */
function printOutputPre() {
  const cwd = process.cwd();
  const inputStr  = inputFile.substr(inputFile.indexOf(cwd) + cwd.length+1);

  shell.echo(inputStr.padEnd(OUTPUT_FILEPATH_MIN_CHARS));
}

/**
 * Prints relevant input about this script execution
 * @returns {void}
 */
function printOutputPost() {
  const cwd = process.cwd();
  let outputStr = outputDir.substr(outputDir.indexOf(cwd) + cwd.length+1) + '/';

  if (mockHasMaps) {
    outputStr += `/*   (${permutations.length} mocks)`;
  } else {
    outputStr += inputFilename;
  }

  const echoStr = `\t=>   ${outputStr}`;

  shell.echo(echoStr.replace(/([^:])\/\/+/g, "$1/"));
}

/**
 * Determine the full file path for an include, checking additional include base directories as well
 * @param {String} path - relative path to an included JSON file
 * @returns {String}
 */
function getIncludedFilePath(path) {
  for (const includePath of includePaths) {
    const filePath = `${includePath}/${path}`;
    if (fs.existsSync(filePath)) {
      return filePath;
    }
  }

  return '';
}

/**
 * Processes a jRevolver include, indicated by a property name and value
 *    modifies the input Object directly
 * @param {Object} json - JSON object containing the include
 * @param {Object} prop - include property key name
 * @param {Object} propData - include property value
 * @returns {Object}
 */
function processInclude(json, prop, propData) {
  /**
   * VALUE based include
   */
  if (typeof propData === 'string' && propData.substr(0, PREFIX.include.length) === PREFIX.include) {
    const relPath = propData.substr(PREFIX.include.length);
    const fn = getIncludedFilePath(relPath);

    if (fn.length) {
      const buf = fs.readFileSync(fn, 'utf8');
      json[prop] = parseIncludes(JSON.parse(buf));
    } else {
      // non-existent include: log warning, set property to "null", return
      console.warn(colors.yellow(`Invalid include file (as value): ${relPath}`));
      json[prop] = null;
    }
  }
  /**
   * KEY based include
   */
  else if (prop.substr(0, PREFIX.include.length) === PREFIX.include) {
    const relPath = prop.substr(PREFIX.include.length);
    const fn = getIncludedFilePath(relPath);

    if (fn.length) {
      const buf = fs.readFileSync(fn, 'utf8');
      let inclJson = JSON.parse(buf);
      // do additional parsing of maps in the included JSON
      const inclJsonMaps = Object.entries(inclJson).filter(
          ([iProp]) => iProp.substr(0, PREFIX.map.length) === PREFIX.map
      );

      switch (propData) {
        /**
         * include with DEFAULTS
         */
        case INCLUDE_TYPE.DEFAULTS:
        default: { // "DEFAULTS" should be the default case
          // if an included file has a map, ensure it is overridden by an identically named
          // (non-map) property in the root JSON file
          for (const [iMapProp, ] of inclJsonMaps) {
            const iBaseProp = iMapProp.substr(PREFIX.map.length);
            if (json.hasOwnProperty(iBaseProp)) {
              delete inclJson[iMapProp];
            }
          }

          json = mergeDeep({}, parseIncludes(inclJson), json);

          break;
        }
        /**
         * include with PERMUTE
         */
        case INCLUDE_TYPE.PERMUTE: {
          // if an included file has a map, ensure it is merged with an identically named
          // (non-map) property in the root JSON file
          for (const [iMapProp, ] of inclJsonMaps) {
            const iBaseProp = iMapProp.substr(PREFIX.map.length);
            if (json.hasOwnProperty(iBaseProp)) {
              json[iMapProp] = json.hasOwnProperty(iMapProp) ? json[iMapProp].concat(json[iBaseProp]) : [ json[iBaseProp] ];
              inclJson[iMapProp] = inclJson[iMapProp].concat(json[iBaseProp]);

              delete json[iBaseProp];
            }
          }

          for (const [iProp, ] of Object.entries(inclJson)) {
            // full JSON property for a --map in the included JSON file, e.g. "--map metalName"
            const inclPropMap = PREFIX.map+iProp;

            // create maps (if applicable) and merge in included properties
            if (json.hasOwnProperty(iProp)) {
              // if a map for the same property exists in both the root and included contexts, merge them
              if (iProp.substr(0, PREFIX.map.length) === PREFIX.map) {
                json[iProp] = json[iProp].concat(inclJson[iProp]);
              }
              // otherwise, create a map containing the root and included values
              else {
                json[iProp] = [].concat(...[ inclJson[iProp] ], ...[ json[iProp] ]);
                json[inclPropMap] = json[iProp];
                delete json[iProp];
              }
            }
            // if a map already exists in the root JSON, merge the included property value into it
            else if (json.hasOwnProperty(inclPropMap)) {
              json[inclPropMap].push(inclJson[iProp]);
            } else {
              json[iProp] = inclJson[iProp];
            }

            delete inclJson[iProp];
          }

          break;
        }
      }

      // remove the original include key/value
      delete json[prop];
    } else {
      // non-existent include: log warning, the do nothing as this is a value based include
      console.warn(colors.yellow(`Invalid include file (as key): ${relPath}`));
      // remove the non-existent include key/value
      delete json[prop];
    }
  }

  return json;
}

/**
 * Parses and processes all jRevolver includes
 * @param {Object} json - JSON data object to parse
 * @returns {Object}
 */
function parseIncludes(json) {
  if (json !== null && json !== undefined) {
    for (let [prop, propData] of Object.entries(json)) {
      // if the current property is:
      // an include, process it
      if (
          prop.substr(0, PREFIX.include.length) === PREFIX.include ||
          typeof propData === 'string' && propData.substr(0, PREFIX.include.length) === PREFIX.include
      ) {
        json = processInclude(cloneDeep(json), prop, propData);
      }
      // a JS Object, recursively parse includes until there are none left
      else if (isObjectNotArray(propData)) {
        do {
          json[prop] = parseIncludes(json[prop]);
        } while (JSON.stringify(json[prop]).indexOf(PREFIX.include) >= 0);
      }
      // an Array,
      else if (isArray(propData)) {
        // check if there are additional includes to parse inside
        if (JSON.stringify(propData).indexOf(PREFIX.include) >= 0) {
          for (let [idx, item] of Object.entries(propData)) {
            //// if the current element of the Array is:

            // another Array or JS Object, recursively parse includes
            if (isObject(item)) {
              json[prop][idx] = parseIncludes(item);
            }
            // an include, process it
            else if (typeof item === 'string' && item.substr(0, PREFIX.include.length) === PREFIX.include) {
              json[prop] = processInclude(cloneDeep(json[prop]), idx, item);
            }
            // else if (another primitive JSON type [string, number, boolean, null])
            // do nothing
          }
        }
      }
    }
  }

  return json;
}

/**
 * Parses a jRevolver layout -- recursively parses jRevolver includes and maps
 * @param {Object} json - JSON layout to parse
 * @returns {Array} - Array of all possible permutations
 */
export default function parseLayout(json) {
  // recursively parse the layout while these properties exist, using the respective function:
  const parsePropMap = {
    [JR_FUNC.include]: parseIncludes,
    [JR_FUNC.map]: parseMaps
  };

  let layoutPermutations = [ cloneDeep(json) ];
  do {
    for (const [parseProp, parseFunc] of Object.entries(parsePropMap)) {
      for (let p = 0; p < layoutPermutations.length; p++) {
        if (JSON.stringify(layoutPermutations[p]).includes(parseProp)) {
          const output = parseFunc(cloneDeep(layoutPermutations[p]));
          if (output.length) {
            layoutPermutations.push(...output);
          } else {
            layoutPermutations.push(output);
          }
          layoutPermutations.splice(p, 1);
        }
      }
    }
  } while (JSON.stringify(layoutPermutations).split(new RegExp(Object.keys(parsePropMap).join('|'), 'g')).length > 1);

  // remove undefined entries
  let cleanedPermutations = (layoutPermutations.length ? layoutPermutations : [ layoutPermutations ]).filter(p => p !== undefined);
  // remove comments
  cleanedPermutations = cleanedPermutations.map(p => removeComments(p));
  // remove duplicate permutations
  cleanedPermutations = [ ...new Set(cleanedPermutations.map(p => JSON.stringify(p))) ].map(p => JSON.parse(p));

  return cleanedPermutations;
}