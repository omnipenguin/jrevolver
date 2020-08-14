import colors from 'colors';
import { JR_FUNC, PREFIX, MAP_CURRENT_CONTEXT_SENTINEL } from './constants.js';
import {
  uniqArray,
  isObject, isArray, isObjectNotArray, mergeDeep, deepSearch,
  getPropByPath, setPropByPath, deletePropByPath, getPermutationByPath, setPermutationByPath,
  removeComments,
  md5
} from './helpers.js';
import cloneDeep from './cloneDeep.js';
import PermutationSet from './PermutationSet.js';

let globalExcludeList = [];
let globalAllowOnlyList = [];
let globalMapKeys;
let currentContextMapName;

/**
 * Determines whether an Object matches any other Object in a list,
 *    a match is determined by all properties in the list Object matching the same properties in the input Object
 * @param {Object} obj - Object to check
 * @param {Array}  objList - The list of Objects to check against
 * @returns {Boolean}
 */
export function objMatchFromList(obj, objList) {
  // loop through objList
  for (const [, listObj] of Object.entries(objList)) {
    let itemMatch = true;

    // loop through properties of the current entry of objList
    for (const [key, listObjProp] of Object.entries(listObj)) {
      const objProp = obj && obj[key];

      // Check arrays for equivalency
      if (isArray(listObjProp)) {
        if (isArray(objProp)) {
          itemMatch = JSON.stringify(listObjProp) === JSON.stringify(objProp);
        } else {
          itemMatch = false;
        }
      }
      // Check nested Objects for equivalency (recursively)
      else if (isObjectNotArray(listObjProp)) {
        itemMatch = objMatchFromList(objProp, [ listObjProp ]);
      }

      else if (listObjProp !== objProp) {
        itemMatch = false;
        break;
      }
    }

    // if a match is found, stop the loop and just return true!
    if (itemMatch === true) {
      return true;
    }
  }

  return false;
}

/**
 * Determines if an Object/Array has maps nested within it
 * @param {Object|Array} input - Object/Array to check
 */
function objHasMaps(input) {
  return JSON.stringify(input).includes(JR_FUNC.map);
}

/**
 * Determines if a string represents a map key name
 * @param {String} key - String property to check
 */
function keyIsMap(key) {
  return (typeof key === 'string') && key.substr(0, PREFIX.map.length) === PREFIX.map;
}

/**
 * Determines if a string represents a mapKey key name
 * @param {String} key - String property to check
 */
function keyIsMapKey(key) {
  return (typeof key === 'string') && key.substr(0, PREFIX.mapKey.length) === PREFIX.mapKey;
}

/**
 * Generates all permutations for a set of maps
 * @param {Object} json
 * @returns {Array}
 */
export function generatePermutations(json) {
  let objKeys = Object.keys(json);

  /** BASE CASE: return empty Array **/
  if (objKeys.length === 0) {
    return [];
  }
  /** return an array of all possible values for a single key **/
  else if (objKeys.length === 1) {
    return json[objKeys[0]].permutations
        .map(perm => {
          let output = isArray(json) ? [] : {};
          output[objKeys[0]] = perm;
          return output;
        });
  }
  /** return all possible values for multiple keys (recursively) **/
  else {
    let result = [];

    // slice off first object property
    const firstProp = objKeys[0];
    let slicedObj = cloneDeep(json);
    delete slicedObj[firstProp];

    // get permutations for the first property
    const firstPropPerms = json[firstProp].permutations;

    // get all permutations for the rest of the Object
    let restOfObjPerms = generatePermutations(slicedObj);

    // parse permutations
    for (const [,firstPropPerm] of Object.entries(firstPropPerms)) {
      // generate an Array of all object key/value combinations
      let firstPerm = isArray(slicedObj) ? [] : {};
      firstPerm[firstProp] = firstPropPerm;

      if (restOfObjPerms && restOfObjPerms.length) {
        for (const [,restOfObjPerm] of Object.entries(restOfObjPerms)) {
          let permArr = [
            firstPerm,
            restOfObjPerm
          ];

          // combine/flatten each group of key/value combinations into a single Object
          //     => represents a single permutation
          result.push(mergeDeep(isArray(firstPerm) ? [] : {}, ...permArr));
        }
      } else {
        result.push(firstPerm);
      }
    }

    return result;
  }
}

/**
 * Merges a root JSON object with an Array of computed permutations. Mutates the permutations list.
 * @param {Array} permutationsArray - The list of computed permutations
 * @param {Object|Array} rootObj - The root JSON object to merge in
 * @modifies permutationsArray
 */
function mergePermutations(permutationsArray, rootObj) {
  for (let p = 0; p < permutationsArray.length; p++) {
    const target = () => isArray(permutationsArray[p]) && isArray(rootObj) ? [] : {};
    permutationsArray[p] = mergeDeep(target(), cloneDeep(rootObj), permutationsArray[p]);
    // if there is a current context map, merge those values into the other context, then delete the temporary property
    if (permutationsArray[p].hasOwnProperty(currentContextMapName)) {
      permutationsArray[p] = mergeDeep(target(), permutationsArray[p], permutationsArray[p][currentContextMapName]);
      delete permutationsArray[p][currentContextMapName];
    }
  }
}

/**
 * Recursively parses and processes all jRevolver maps in a JSON Object
 * @param {Object} json - JSON data to parse
 * @param {Object} [opts] - optional params
 * @param {String} [opts.path] - dot path to the current context
 * @returns {Array} - Array of all possible permutations
 */
function _parseMaps(json, opts = { path: '' }) {
  const { path } = opts;
  let permutationList = {};

  // if there is a current context map property, rename it and generate permutations normally
  const currentContextMapProp = `${PREFIX.map}${currentContextMapName}`;
  if (json.hasOwnProperty(JR_FUNC.map) && !json.hasOwnProperty(currentContextMapProp)) {
    json[currentContextMapProp] = cloneDeep(json[JR_FUNC.map]);
    delete json[JR_FUNC.map];
  }

  for (const [key, item] of Object.entries(json)) {
    const newPath = (path && `${path}.`) + key;
    const maybeMapName = keyIsMap(key) && key.substr(PREFIX.map.length);
    /**
     * property is a MAP: compute permutations and add them to the permutationList
     **/
    if (maybeMapName) {
      // set invalid map Array's to "null"
      if (!isArray(item)) {
        console.warn(colors.yellow(`Invalid map value: ${JSON.stringify(item)}`));
        json[key] = null;
      }

      const newPath = (path && `${path}.`) + maybeMapName;
      setPermutationByPath(permutationList, newPath, new PermutationSet(cloneDeep(item)));
      delete json[key];
    }
    /**
     * property is an Object or Array: recursively compute and store permutations for all nested Objects/Arrays
     **/
    else if (isObject(item) && objHasMaps(item)) {
      const newPathPerms = _parseMaps(item, { path: newPath });

      if (newPathPerms && newPathPerms.length > 0) {
        setPermutationByPath(permutationList, newPath, new PermutationSet(newPathPerms));
      }
    }
  }

  let permutationsInPath = getPermutationByPath(permutationList, path);
  let expandedPermutations = permutationsInPath ? generatePermutations(permutationsInPath) : [ json ];

  if (expandedPermutations.length) {
    mergePermutations(expandedPermutations, json);
  } else {
    expandedPermutations[0] = cloneDeep(json);
  }

  // filter generated permutations using the allow/exclude lists
  const hasExcludeList = globalExcludeList && globalExcludeList.length;
  const hasAllowOnlyList = globalAllowOnlyList && globalAllowOnlyList.length;

  for (const [p, perm] of Object.entries(expandedPermutations)) {
    const inExcludeList = hasExcludeList && objMatchFromList(perm, globalExcludeList);
    const inAllowOnlyList = hasAllowOnlyList && objMatchFromList(perm, globalAllowOnlyList);

    if (inExcludeList || (hasAllowOnlyList && !inAllowOnlyList)) {
      delete expandedPermutations[p];
    }
  }

  return expandedPermutations.filter(p => p !== undefined);
}

/**
 * Parses and processes all jRevolver maps in a JSON Object
 * @param {Object} json - JSON data to parse
 * @returns {Array} - Array of all possible permutations
 */
export default function parseMaps(json) {
  // build global list of mapKeys
  globalMapKeys = buildMapKeyList(json);
  // merge and build global allow/exclude lists
  [JR_FUNC.mapExclude, JR_FUNC.mapAllowOnly]
      .forEach(mapListName => {
        mergeMapLists(json, mapListName);
        if (json.hasOwnProperty(mapListName)) {
          validateMapList(json, mapListName);
          replaceMapKeys(json[mapListName]);
        }
      });
  // dedupe all maps
  dedupeMaps(json);

  globalExcludeList = parseMapList(json[JR_FUNC.mapExclude]);
  globalAllowOnlyList = parseMapList(json[JR_FUNC.mapAllowOnly]);
  delete json[JR_FUNC.mapExclude];
  delete json[JR_FUNC.mapAllowOnly];

  // set unique current context map name, for use if its needed
  currentContextMapName = `${MAP_CURRENT_CONTEXT_SENTINEL}${md5(JSON.stringify(json))}`;

  // recursively generate all permutations
  return _parseMaps(json);
}

/**
 * De-dupes all jRevolver map Arrays in an input Object
 * @param {Object} json
 */
function dedupeMaps(json) {
  if (isObject(json)) {
    for (const [key, item] of Object.entries(json)) {
      if (isArray(item) && keyIsMap(item)) {
        json[key] = uniqArray(item);
      } else if (isObject(json)) {
        dedupeMaps(item);
      }
    }
  }
}

/**
 * Parses the maps in a mapList and return an Array of all permutations
 * @param {Array} listRef - mapList reference
 * @returns {Array}
 */
function parseMapList(listRef) {
  if (listRef && listRef.length) {
    const rawList = cloneDeep(removeComments(listRef));
    const outputList = [];

    for (const [, listEntry] of Object.entries(rawList)) {
      const listEntryPerms = _parseMaps(listEntry);
      outputList.push(...listEntryPerms);
    }

    return outputList;
  }

  return [];
}

/**
 * Validates a mapList -- throws an exception if the list is invalid
 * @param {Object} json
 * @param {String} mapListName
 * @returns {Boolean}
 */
function validateMapList(json, mapListName) {
  const mapList = json[mapListName];
  if (isArray(mapList)) {
    for (const [, item] of Object.entries(mapList)) {
      if (!isObject(item)) {
        throw colors.yellow(`Invalid map ${mapListName} entry:`) + `${JSON.stringify(item)}\n` +
              `${mapListName} entries should be Objects`;
      }
    }
  } else {
    throw colors.yellow(`Invalid map ${mapListName}:`) + `${JSON.stringify(mapList)}\n` +
          `${mapListName} should be an Array`;
  }
}

/**
 * Parses and processes all jRevolver maps in a JSON Object
 * @param {Object} json - JSON data to parse
 * @param {String} mapListName - mapList type
 * @returns {Array} - Array of all possible permutations
 */
function mergeMapLists(json, mapListName) {
  // count the total number of mapLists existing in the JSON
  const keyCount = JSON.stringify(json).split(mapListName).length - 1;
  // if mapLists exist within, build an array of dot paths to every location
  if (keyCount > 0) {
    let paths = [];
    let refs = [];

    if (json.hasOwnProperty(mapListName)) {
      if (keyCount > 1) {
        paths.push(...deepSearch(json, mapListName));
      }
    } else {
      json[mapListName] = [];
      paths = deepSearch(json, mapListName);
    }

    // filter empty elements
    paths = paths.filter(p => p.length > 0);

    // iterate over paths, build Array of all the nested mapLists
    for (const path of paths) {
      // set up new list contexts, relative to the JSON root:
      // e.g.
      //
      //    {
      //      "a": {
      //        "b": {
      //          ...
      //          "mapListName": [
      //            "d": true,
      //            "e": 3,
      //            "f": "str"
      //          ]
      //        }
      //      }
      //    }
      //
      // becomes:
      //
      //    {
      //      "a": {
      //        "b": {
      //          ...
      //        }
      //      }
      //      "mapListName": [
      //        "a": {
      //          "b": {
      //            "d": true,
      //            "e": 3,
      //            "f": "str"
      //          }
      //        }
      //      ]
      //    }
      //

      const mapListPath = `${path}.${mapListName}`;
      const mapListContents = cloneDeep(getPropByPath(json, mapListPath));

      // iterate over items in the nested mapList, building new context for each (relative to the JSON root)
      for (const mapListItem of mapListContents) {
        const fullRef = {};
        setPropByPath(fullRef, path, mapListItem);
        refs.push(fullRef);
      }

      deletePropByPath(json, mapListPath); // remove nested property
    }

    json[mapListName].push(...refs);
  }
}

/**
 * Builds and returns an object representing all the mapKey/value pairs in a JSON object
 * @param {Object} json
 * @param {Object} [opts] - optional parameters
 * @param {Object} [opts.parentContext] - reference to the immediate parent context of the input object
 * @param {Object} [opts.contextKey] - context key/property of the immediate parent
 * @returns {Object}
 */
function buildMapKeyList(json, opts = { parentContext: undefined, contextKey: undefined }) {
  const mapKeys = {};
  const { parentContext, contextKey } = opts;

  // if the input is an Object (not Array), check if it has a mapKey
  // if so, add it to mapKeys and delete the mapKey property
  if (isObjectNotArray(json)) {
    const maybeMapKey = json[JR_FUNC.mapKey];
    const maybeMapContent = json[JR_FUNC.mapContent];

    if (maybeMapKey) {
      delete json[JR_FUNC.mapKey];

      if (maybeMapContent) {
        mapKeys[maybeMapKey] = cloneDeep(maybeMapContent);
        // overwrite current JSON context with mapContents
        parentContext[contextKey] = cloneDeep(maybeMapContent);
      } else {
        mapKeys[maybeMapKey] = cloneDeep(json);
      }
    }
  }

  // if the input is an Object or Array, recursively iterate through properties
  if (isObject(json)) {
    for (const [key, item] of Object.entries(json)) {
      // avoid unnecessary recursive calls for non Object/Array types
      if (isObject(item)) {
        Object.assign(mapKeys, buildMapKeyList(item, { parentContext: json, contextKey: key }));
      }
    }
  }

  return mapKeys;
}

/**
 * Replaces all mapKey references with their corresponding values in an object permutation
 * @param {Object} json - JSON data to parse
 */
function replaceMapKeys(json) {
  if (isObject(json)) {
    for (const [key, item] of Object.entries(json)) {
      if (keyIsMapKey(item)) {
        const mapKeyName = item.substr(PREFIX.mapKey.length);
        json[key] = globalMapKeys[mapKeyName];
      } else if (isObject(item)) {
        replaceMapKeys(item);
      }
    }
  }
}