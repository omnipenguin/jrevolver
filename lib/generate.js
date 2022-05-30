#! /usr/bin/env node
import fs from 'fs';
import path from 'path';
import shell from 'shelljs';
import colors from 'colors';
import sortKeysRecursive from 'sort-keys-recursive';
import {
  JR_FUNC, JR_MAP_FUNCTIONS, PREFIX,
  INCLUDE_TYPE,
  ICON,
  OUTPUT_JSON_INDENT, OUTPUT_FILEPATH_MIN_CHARS,
} from './constants.js';
import {
  isArray, isObject, isObjectNotArray,
  cleanUndefined, excludeArray, uniqArray, hasSomeProperty,
  mergeDeep, mapZipperMerge,
  getPropByPath, deleteProp,
  jrFuncMatch,
  removeComments,
  md5,
  getSelfCmd,
} from './helpers.js';
import cloneDeep from './cloneDeep.js';
import parseMaps, {
  keyIsMap,
  maybeGetMapFunction,
  maybeGetMapName,
} from './mutator.js';

/**
 * CONSTANTS
 */

// required args
const ARGS = {
  node: 0,
  script: 1,
  inputFile: 2,
  outputDir: 3,
};

// get script name and path
const scriptRelPath = path.relative(path.basename('./'), process.argv[ARGS.script]);
const scriptFileName = scriptRelPath.substring(scriptRelPath.lastIndexOf('/')+1);

/**
 * Validate arguments
 */
if (process.argv.length < Object.keys(ARGS).length) {
  const errorStr = [
    colors.brightRed(`${ICON.ERROR} ${scriptFileName} was invoked incorrectly`),
    colors.red('  Expected:') + `\tnode ${scriptRelPath} {inputJsonFile/Directory} {outputFile/Directory}`,
    colors.red('  Actual:') + `\t${getSelfCmd()}`,
  ].join("\n");

  console.error(`\n${errorStr}\n`);
  process.exit(1);
}

// input directory/file
const inputFile = path.resolve(process.argv[ARGS.inputFile]);
const inputFilePath = process.env.jInputDir || path.dirname(inputFile);
const inputFilename = path.basename(inputFile);
const inputBasename = inputFilename.substring(0, inputFilename.lastIndexOf('.'));
const includePaths = [].concat(inputFilePath, process.env.jIncludeDirs).filter(includePath => !!includePath);

// output directory/files
let outputDir = process.env.jOutputDir || path.resolve(process.argv[ARGS.outputDir]);

/**
 * Load jRevolver layout (input file)
 */
const inputBuf = fs.readFileSync(inputFile, 'utf8');
const data = JSON.parse(inputBuf);

/**
 * Print relevant pre-execution output
 */
printOutputPre();

/**
 * Parse all includes and maps
 * Supports infinitely nested includes/maps (maps within includes, includes within maps, etc...)
 */
const permutations = parseLayout(data);
const mockHasMaps = (permutations.length > 1);

/**
 * Output/write compiled JSON to disk
 */
if (mockHasMaps) {
  outputDir = path.join(outputDir, inputBasename);

  shell.rm('-rf', outputDir);
  shell.mkdir('-p', outputDir);

  let customFnRepeated = 0;

  for (const p of Object.keys(permutations)) {
    // generate custom filename, if it has been passed
    let customFileName = permutations[p][JR_FUNC.filename];
    if (customFileName) {
      customFileName = customFileName
          .replace(/({[^}]*})/gi, function(match, p1, offset, string) { // eslint-disable-line no-unused-vars
            const propName = p1.replace(/[}{]/gi, '');
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
    console.warn(
      colors.brightYellow(`${ICON.WARNING} You have specified an output filename that resulted in ${customFnRepeated} permutations having the same filename\n`) +
      colors.yellow(`  These mocks have been saved with their default filenames instead`)
    );
  } else if (numSavedMocksDiff !== 0) {
    console.error(colors.brightRed(`${ICON.ERROR} There was an error, for some reason ${numSavedMocksDiff} permutations had the same hash`));
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
  const inputStr  = inputFile.substring(inputFile.indexOf(cwd) + cwd.length+1);

  shell.echo(inputStr.padEnd(OUTPUT_FILEPATH_MIN_CHARS));
}

/**
 * Prints relevant input about this script execution
 * @returns {void}
 */
function printOutputPost() {
  const cwd = process.cwd();
  let outputStr = outputDir.substring(outputDir.indexOf(cwd) + cwd.length+1) + '/';

  if (mockHasMaps) {
    outputStr += `/*   (${permutations.length} mocks)`;
  } else {
    outputStr += inputFilename;
  }

  const echoStr = `\t=>   ${outputStr}`;

  shell.echo(echoStr.replace(/([^:])\/\/+/g, "$1/"));
}

/**
 * Parses a string and returns the path for an include
 * @param {String} str
 * @returns {String}
 */
function getIncludePath(str) {
  return jrFuncMatch(str, PREFIX.include) && str.substring(PREFIX.include.length).trim();
}

/**
 * Determine the full file path for an include, checking additional include base directories as well
 * @param {String} relPath - relative path to an included JSON file
 * @returns {String}
 */
function getIncludedFilePath(relPath) {
  for (const includePath of includePaths) {
    const filePath = `${includePath}/${relPath}`;
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
  if (jrFuncMatch(propData, PREFIX.include)) {
    const relPath = getIncludePath(propData);
    const fn = getIncludedFilePath(relPath);

    if (fn.length) {
      const buf = fs.readFileSync(fn, 'utf8');
      json[prop] = parseIncludes(JSON.parse(buf));
    } else {
      // non-existent include: log warning, set property to "null", return
      console.warn(
        colors.brightYellow(`${ICON.WARNING} Invalid include file\n`) +
        colors.yellow(`  (included as value): "${relPath}"`)
      );
      json[prop] = null;
    }
  }
  /**
   * KEY based include
   */
  else if (jrFuncMatch(prop, PREFIX.include)) {
    const relPath = getIncludePath(prop);
    const fn = getIncludedFilePath(relPath);

    if (fn.length) {
      const buf = fs.readFileSync(fn, 'utf8');
      const inclJson = JSON.parse(buf);

      // do additional parsing of maps in the included JSON
      const rootJsonMaps = Object.keys(json).filter(k => keyIsMap(k));
      const inclJsonMaps = Object.keys(inclJson).filter(k => keyIsMap(k));
      const jsonMaps = uniqArray([ ...rootJsonMaps, ...inclJsonMaps ]); // eslint-disable-line no-unused-vars

      // determine whether included maps/properties override maps/properties in the root context
      // or root context maps/properties override included maps/properties in included contexts
      const includeIsOverride = (propData === INCLUDE_TYPE.OVERRIDES);

      let baseJson;
      let baseJsonMaps;
      let overrideJson;
      let overrideJsonMaps;

      if (includeIsOverride) {
        baseJson = json;
        baseJsonMaps = rootJsonMaps; // eslint-disable-line no-unused-vars
        overrideJson = inclJson;
        overrideJsonMaps = inclJsonMaps;
      } else {
        baseJson = inclJson;
        baseJsonMaps = inclJsonMaps; // eslint-disable-line no-unused-vars
        overrideJson = json;
        overrideJsonMaps = rootJsonMaps;
      }

      switch (propData) {
        /**
         * include with PERMUTE
         */
        case INCLUDE_TYPE.PERMUTE: {
          // if an included file has a map,
          // ensure it is merged with a map in the root JSON file
          for (const _mapProp of jsonMaps) {
            const mapFunction = maybeGetMapFunction(_mapProp);
            const baseProp = maybeGetMapName(_mapProp);

            const mapProp = `${JR_MAP_FUNCTIONS.map} ${baseProp}`;
            const mapZipperProp = `${JR_MAP_FUNCTIONS.mapZipper} ${baseProp}`;

            if (
              hasSomeProperty(baseJson, [ baseProp, mapProp ]) ||
              hasSomeProperty(overrideJson, [ baseProp, mapProp ])
            ) {
              if (mapFunction === JR_MAP_FUNCTIONS.mapZipper) {
                baseJson[mapZipperProp] = mapZipperMerge(
                  baseJson[baseProp],
                  baseJson[mapProp],
                  baseJson[mapZipperProp],
                  overrideJson[baseProp],
                  overrideJson[mapProp],
                  overrideJson[mapZipperProp],
                );

                deleteProp(baseJson, [ baseProp, mapProp ]);
                deleteProp(overrideJson, [ baseProp, mapProp, mapZipperProp ]);
              } else {
                baseJson[mapProp] = uniqArray(cleanUndefined([
                  baseJson[baseProp],
                  ...(baseJson[mapProp] || []),
                  overrideJson[baseProp],
                  ...(overrideJson[mapProp] || []),
                ]));

                deleteProp(baseJson, [ baseProp ]);
                deleteProp(overrideJson, [ baseProp, mapProp ]);
              }
            }
          }

          // ensure included map and non-map properties are merged into a combined map in the root JSON file
          for (const baseProp of excludeArray(
            uniqArray(Object.keys(baseJson).concat(Object.keys(overrideJson))),
            jsonMaps,
          )) {
            const mapProp = `${JR_MAP_FUNCTIONS.map} ${baseProp}`;

            if (!jrFuncMatch(baseProp, PREFIX.include)) {
              baseJson[mapProp] = uniqArray(cleanUndefined([
                baseJson[baseProp],
                ...(baseJson[mapProp] || []),
                overrideJson[baseProp],
                ...(overrideJson[mapProp] || []),
              ]));

              deleteProp(baseJson, [ baseProp ]);
              deleteProp(overrideJson, [ baseProp ]);
            }
          }

          json = mergeDeep({}, parseIncludes(baseJson), overrideJson);

          break;
        }
        /**
         * include with DEFAULTS
         * include with OVERRIDES
         */
        case INCLUDE_TYPE.DEFAULTS:
        case INCLUDE_TYPE.OVERRIDES:
        default: { // "DEFAULTS" should be the default case
          for (const oProp of overrideJsonMaps) {
            const baseProp = keyIsMap(oProp) ? maybeGetMapName(oProp) : oProp;
            const mapProp = `${JR_MAP_FUNCTIONS.map} ${baseProp}`;
            const mapZipperProp = `${JR_MAP_FUNCTIONS.mapZipper} ${baseProp}`;

            if (hasSomeProperty(overrideJson, [ baseProp, mapProp, mapZipperProp ])) {
              // if an included file has a property, ensure it overrides an identically named map property in the root JSON file
              // if an included file has a map, ensure it overrides an identically named (non-map) property in the root JSON file
              deleteProp(baseJson, [ baseProp, mapProp, mapZipperProp ]);
            }
          }

          for (const oProp of excludeArray(Object.keys(overrideJson), overrideJsonMaps)) {
            const baseProp = keyIsMap(oProp) ? maybeGetMapName(oProp) : oProp;
            const mapProp = `${JR_MAP_FUNCTIONS.map} ${baseProp}`;
            const mapZipperProp = `${JR_MAP_FUNCTIONS.mapZipper} ${baseProp}`;

            deleteProp(baseJson, [ baseProp, mapProp, mapZipperProp ]);
          }

          if (includeIsOverride) {
            json = mergeDeep({}, baseJson, parseIncludes(overrideJson));
          } else {
            json = mergeDeep({}, parseIncludes(baseJson), overrideJson);
          }

          break;
        }
      }

      // remove the original include key/value
      delete json[prop];
    } else {
      // non-existent include: log warning, the do nothing as this is a value based include
      console.warn(
        colors.brightYellow(`${ICON.WARNING} Invalid include file\n`) +
        colors.yellow(`  (included as key): "${relPath}"`)
      );
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
    for (const [prop, propData] of Object.entries(json)) {
      // if the current property is:
      // an include, process it
      if (
        jrFuncMatch(prop, PREFIX.include) ||
        jrFuncMatch(propData, PREFIX.include)
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
        if (JSON.stringify(propData).indexOf(`"${PREFIX.include}`) >= 0) {
          for (const [idx, item] of Object.entries(propData)) {
            //// if the current element of the Array is:

            // another Array or JS Object, recursively parse includes
            if (isObject(item)) {
              json[prop][idx] = parseIncludes(item);
            }
            // an include, process it
            else if (jrFuncMatch(item, PREFIX.include)) {
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
 * @param {Object} [opts] - Optional params
 * @param {Boolean} [opts.sortKeys=true] - Sort output JSON objects/files by key
 * @returns {Array} - Array of all possible permutations
 */
export default function parseLayout(json, { sortKeys } = { sortKeys: true }) {
  // recursively parse the layout while these properties exist, using the respective function:
  const parsePropMap = {
    [JR_FUNC.include]: parseIncludes,
    [JR_FUNC.map]: parseMaps,
    [JR_FUNC.mapZipper]: parseMaps,
  };

  const layoutPermutations = [ cloneDeep(json) ];
  do {
    for (const [parseProp, parseFunc] of Object.entries(parsePropMap)) {
      for (let p = 0; p < layoutPermutations.length; p++) {
        if (JSON.stringify(layoutPermutations[p]).includes(`"${parseProp}`)) {
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
  } while (JSON.stringify(layoutPermutations).split(new RegExp(`"${Object.keys(parsePropMap).join('|"')}`, 'g')).length > 1);

  // remove undefined entries
  let cleanedPermutations = cleanUndefined(layoutPermutations.length ? layoutPermutations : [ layoutPermutations ]);
  // remove comments
  cleanedPermutations = cleanedPermutations.map(p => removeComments(p));
  // remove duplicate permutations
  cleanedPermutations = uniqArray(cleanedPermutations.map(p => sortKeys ? sortKeysRecursive(p) : p));

  return cleanedPermutations;
}