import path from 'path';
import colors from 'colors';
import crypto from 'crypto';
import {
  JR_FUNC,
  OUTPUT_JSON_INDENT as INDENT,
  CLOBJ_ARRAY_EMPTY_INDEX_SENTINEL,
  CLOBJ_PERMUTATION_SET_START_SENTINEL,
  CLOBJ_PERMUTATION_SET_END_SENTINEL,
  CLOBJ_PERMUTATION_SET_START as CLO_PS_START,
  CLOBJ_PERMUTATION_SET_END as CLO_PS_END,
} from './constants.js';
import cloneDeep from './cloneDeep.js';
import PermutationSet from './PermutationSet.js';
// lodash
import escapeRegExp from 'lodash.escaperegexp';
import assignInWith from 'lodash.assigninwith';

/**
 * Cleans null/undefined/falsy values from an array
 * @param {Array} arr
 * @returns {Array}
 */
export function cleanArray(arr) {
  return arr.filter(v => v);
}

/**
 * Cleans undefined values from an array
 * @param {Array} arr
 * @returns {Array}
 */
export function cleanUndefined(arr) {
  return arr.filter(v => v !== undefined);
}

/**
 * Recursively flattens a nested Array
 * @param {Array} arr
 * @returns {Array}
 */
export function flattenArray(arr) {
  return isArray(arr) ? [].concat.apply([], arr.map(flattenArray)) : arr;
}

/**
 * Excludes the elements in one array from the other. Returns a new array.
 * @param {Array} arr
 * @param {...Array} excludeArrs - Arrays of elements to exclude
 * @returns {Array}
 */
export function excludeArray(arr, ...excludeArrs) {
  return arr.filter(el => !flattenArray(excludeArrs).includes(el));
}

/**
 * Removes duplicate values from an Array
 * @param {Array} arr
 * @returns {Array} Array with duplicate values removed
 */
export function uniqArray(arr) {
  return [ ...new Set([].concat(arr)) ];
}

/**
 * Determines if the contents of two arrays are equal
 * @param a {Array}
 * @param b {Array}
 * @returns {Boolean}
 */
export function arrayEquals(a, b) {
  if (a === b) {
    return true;
  }

  if (
    (a == null || b == null) || // eslint-disable-line eqeqeq
    (a.length !== b.length)
  ) {
    return false;
  }

  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }

  return true;
}

/**
 * Determines if the param is a plain Object
 * @param {*} obj
 * @returns {Boolean}
 */
export function isObject(obj) {
  return Object(obj) === obj;
}

/**
 * Determines if the param is an Array
 * @param {*} arr
 * @returns {Boolean}
 */
export function isArray(arr) {
  return Array.isArray(arr);
}

/**
 * Determines if the param is a plain Object and NOT an Array
 * @param {*} obj
 * @returns {Boolean}
 */
export function isObjectNotArray(obj) {
  return Object(obj) === obj && !isArray(obj);
}

/**
 * Determines if the param is a number
 * @param {*} num
 * @returns {Boolean}
 */
export function isNumber(num) {
  return !isNaN(Number(num));
}

/**
 * Determines if a JSON key/value invokes a jrevolver function
 * @param {String} str - string to check
 * @param {String} val - value to check for
 * @param {Number} [start] - start position for substring match
 * @returns {Boolean}
 */
export function jrFuncMatch(str, val, start = 0) {
  return (typeof str === 'string') && str.substring(start, val.length) === val;
}

/**
 * Takes a jRevolver function name and a JSON property name, validates the jRevolver function, then returns a JSON key that invokes that jRevolver function
 * @param {String} funcName - jRevolver function
 * @param {String} prop - JSON property
 * @returns {String}
 */
export function jrFuncProp(funcName, prop) {
  if (!Object.values(JR_FUNC).includes(funcName)) {
    throw new Error(`${colors.brightYellow(funcName)} ${colors.yellow('is not a valid function')}`);
  }

  return `${funcName} ${prop}`;
}

/**
 * Parses a string and returns a key name if the string invokes a jRevolver function
 * @param {String} key - JSON property
 * @returns {String}
 */
export function jrFuncBaseProp(key) {
  const funcName = key.substring(0, key.indexOf(' '));
  const baseProp = key.substring(key.indexOf(' ') + 1);

  if (!Object.values(JR_FUNC).includes(funcName)) {
    throw new Error(`${colors.brightYellow(funcName)} ${colors.yellow('is not a valid function')}`);
  }

  return baseProp;
}

/**
 * Parses a string and returns a map key name if the string invokes a jRevolver map function
 * @param {String} key - String property to check
 * @param {Array|String} [jrFunctions] - jRevolver functions that should pass validation
 */
export function maybeGetFunctionName(key) {
  const funcName = key.substring(0, key.indexOf(' '));

  if (!Object.values(JR_FUNC).includes(funcName)) {
    throw new Error(`${colors.brightYellow(funcName)} ${colors.yellow('is not a valid function')}`);
  }

  return funcName;
}

/**
 * Determines if an Object has one or more of a list of properties
 * @param {Object} obj
 * @param {Array} props
 * @returns {Boolean}
 */
export function hasSomeProperty(obj, props) {
  return (isArray(props) ? props : [ props ]).some(p => obj.hasOwnProperty(p));
}

/**
 * Deep merges Objects
 * @param {Object} target
 * @param {...Object} sources
 * @returns {Object}
 */
export function mergeDeep(target, ...sources) {
  if (!sources.length) return target;
  const source = sources.shift();

  for (const key of Object.keys(source)) {
    if (isObjectNotArray(source[key])) {
      if (!target[key]) Object.assign(target, { [key]: {} });
      mergeDeep(target[key], source[key]);
    } else {
      assignInWith(target, { [key]: source[key] }, function(objValue, srcValue) {
        if (isArray(objValue) && isArray(srcValue)) {
          for (const [idx, item] of Object.entries(srcValue)) {
            if (item !== undefined) {
              objValue[idx] = srcValue[idx];
            }
          }

          return objValue;
        }

        return undefined;
      });
    }
  }

  return mergeDeep(target, ...sources);
}

/**
 * Zipper merges two or more arrays
 * @param {...Array} arrays
 * @returns {Array}
 */
export function zipperMerge(...arrays) {
  const arrayLengths = cleanUndefined(arrays.map(a => a && a.length));
  return flattenArray(Array(Math.max(...arrayLengths)).fill().map((_,i) => cleanUndefined(arrays).map(a => a[i])));
}

/**
 * Formats inputs for zipperMerge, then calls zipperMerge with all inputs
 * @param {...*} inputs
 * @returns {Array}
 */
export function mapZipperMerge(...inputs) {
  for (let i = 0; i < inputs.length; i++) {
    if (!isArray(inputs[i])) {
      if (inputs[i] === undefined) {
        inputs[i] = [];
      } else {
        inputs[i] = cleanUndefined([ inputs[i] ]);
      }
    }
  }

  return cleanUndefined(zipperMerge(...inputs.filter(a => a.length)));
}

/**
 * Recursively searches an Object for a key; returns an array of dot paths to each reference
 * @param {Object} json - JSON object to search
 * @param {Object} findKey - key/property to find
 * @param {Object} [contextPath=''] - path to the current context in parent the object during recursion
 * @returns {Array}
 */
export function deepSearch(json, findKey, contextPath = '') {
  const dotPaths = [];

  // short circuit if findKey doesn't exist in json
  if (JSON.stringify(json).includes(`"${findKey}":`)) {
    for (const [key, item] of Object.entries(json)) {
      if (key === findKey) {
        dotPaths.push(contextPath);
      }

      if (isObject(item)) {
        const newContextPath = (contextPath && `${contextPath}.`) + key;
        dotPaths.push(...deepSearch(item, findKey, newContextPath));
      }
    }
  }

  return dotPaths;
}

/**
 * Returns a nested property of obj using a dot path
 * @param {Object} obj - the object to analyze
 * @param {String} dotPath - the nested context to fetch
 * @returns {*|undefined}
 */
export function getPropByPath(obj, dotPath) {
  if (!dotPath) return obj;
  return dotPath.split('.').reduce((a,v) => a && a[v], obj);
}

/**
 * Sets a nested property of obj using a dot path
 * @param {Object} obj - the object to mutate
 * @param {String} dotPath - the nested context to set
 * @param {*}      value - the value to set
 */
export function setPropByPath(obj, dotPath, value) {
  if (!dotPath) {
    obj = value;
    return;
  }

  const pathList = dotPath.split('.');
  let pointer = obj;
  for (let p = 0; p < pathList.length; p++) {
    const curProp = pathList[p];
    const nextProp = pathList[p+1];

    // we've reached the end of the pathList, so set the property value
    if (nextProp === undefined) {
      pointer[curProp] = value;
      break;
    }

    // property doesn't exist, so create it
    if (pointer[curProp] === undefined) {
      // use the next nested property in pathList to determine the type of the current property
      pointer[curProp] = isNumber(nextProp) ? [] : {};
    }

    pointer = pointer[curProp];
  }

  return obj;
}

/**
 * Deletes a nested property of obj using a dot path
 * @param {Object} obj - the object to mutate
 * @param {String} dotPath - the nested context to set
 */
export function deletePropByPath(obj, dotPath) {
  if (!dotPath || getPropByPath(obj, dotPath) === undefined) {
    return;
  }

  const pathList = dotPath.split('.');
  const key = pathList.pop();
  const pointer = pathList.reduce((a,v) => a[v], obj);

  delete pointer[key];
}

/**
 * Returns a nested permutation of obj using a dot path
 * @param {Object} obj - the object to analyze
 * @param {String} dotPath - the nested context to fetch
 * @returns {*|undefined}
 */
export function getPermutationByPath(obj, dotPath) {
  if (!dotPath) return obj;

  const pathList = dotPath.split('.');
  let pointer = obj;
  for (let p = 0; p < pathList.length; p++) {
    const curProp = pathList[p];

    if (pointer[curProp] === undefined) {
      return undefined;
    }
    else if (pointer[curProp] instanceof PermutationSet) {
      pointer = pointer[curProp].permutations;
      break;
    }

    pointer = pointer[curProp];
  }

  return pointer;
}

/**
 * Sets a nested permuted property of obj using a dot path
 * @param {Object} obj - the object to mutate
 * @param {String} dotPath - the nested permutation to set
 * @param {*}      perm - the perm to set
 */
export function setPermutationByPath(obj, dotPath, perm) {
  if (!dotPath) {
    obj = perm;
    return;
  }

  const pathList = dotPath.split('.');
  let pointer = obj;
  for (let p = 0; p < pathList.length; p++) {
    const curProp = pathList[p];
    const nextProp = pathList[p+1];

    // we've reached the end of the pathList, so set the property permutation
    if (nextProp === undefined) {
      pointer[curProp] = perm;
      break;
    }

    // property doesn't exist, so create it
    if (pointer[curProp] === undefined) {
      // use the next nested property in pathList to determine the type of the current property
      pointer[curProp] = isNumber(nextProp) ? [] : {};
    }

    if (pointer[curProp] instanceof PermutationSet) {
      const newPerms = cloneDeep(pointer[curProp].permutations);
      setPermutationByPath(newPerms, pathList.slice[p].join('.'), perm);
      pointer[curProp].permutations = newPerms;
      break;
    }

    pointer = pointer[curProp];
  }

  return pointer;
}

/**
 * Deletes properties from an object
 * @param {Object} obj
 * @param {Array|...String} props - properties to delete from obj
 */
export function deleteProp(obj, ...props) {
  const propsArr = isArray(props) ? (props.length === 1 ? props[0] : props) : [ props ];
  for (const prop of propsArr) {
    delete obj[prop];
  }
}

/**
 * Removes all jRevolver comments from a JSON object
 * @param {Object} json - JSON object
 * @returns {Object}
 */
export function removeComments(json) {
  if (JSON.stringify(json).includes(`"${JR_FUNC.comment}`)) {
    if (isArray(json)) {
      for (const [i, v] of Object.entries(json)) {
        if (jrFuncMatch(v, JR_FUNC.comment)) {
          json.splice(i, 1);
        }
      }
    }

    for (const [k, v] of Object.entries(json)) {
      if (jrFuncMatch(k, JR_FUNC.comment)) {
        delete json[k];
      } else if (isObject(v)) {
        json[k] = removeComments(v);
      }
    }
  }

  return json;
}

/**
 * Computes the md5 hash of input string str
 * @param {String} str
 * @returns {String}
 */
export function md5(str) {
  return crypto.createHash('md5').update(str).digest('hex');
}

/**
 * Returns the command that was used to invoke the current script
 * @returns {String}
 */
export function getSelfCmd() {
  const cmd = process.argv.join(' ').replace(`${process.cwd()}/`, '');
  return cmd.substring(path.dirname(process.execPath).length+1);
}

/**
 * Stringifies an Object in human readable format
 * @param obj {*} obj
 * @returns {String}
 */
export function stringifyObj(obj) {
  return JSON.stringify(obj, function(key, val) {
    if (this[key] instanceof PermutationSet) {
      return this[key].prettyPrintJSON();
    }
    else if ([ CLO_PS_START, CLO_PS_END ].includes(val)) {
      return val;
    }
    else if (isArray(this[key])) {
      const arr = [];
      for (const a of this[key]) {
        arr.push((a === undefined) ? CLOBJ_ARRAY_EMPTY_INDEX_SENTINEL : a);
      }
      return arr;
    }

    return val;
  }, INDENT);
}

/**
 * Logs an Object to console in human readable format
 * @param obj {*} obj
 * @returns {String}
 */
export function consoleLogObj(obj) {
  const startPattern = String.raw`\[(\s+)"${CLOBJ_PERMUTATION_SET_START_SENTINEL}",\s+\[`;
  const endPattern = String.raw`\],(\s+)"${CLOBJ_PERMUTATION_SET_END_SENTINEL}",?\s+\]`;
  const colorPattern = String.raw`( *?)?${escapeRegExp(CLO_PS_START)}\n(( *?)([\{\[]\n)?)( *?)([\s\S]+?)\n\5( {${INDENT}})?${escapeRegExp(CLO_PS_END)}`;
  const colorPatternReplace = colors.cyan(`$1${CLO_PS_START}\n$5$6\n$5${CLO_PS_END}`);

  // replace PermutationSet sentinel values
  let strObj = stringifyObj(obj)
      .replace(new RegExp(startPattern, 'gi'), CLO_PS_START)
      .replace(new RegExp(endPattern, 'gi'), CLO_PS_END);

  // alter output color of PermutationSet's
  // TODO FIX: color gets messed up when logging nested PermutationSets
  let newStrObj = strObj;
  do {
    newStrObj = strObj.replace(new RegExp(colorPattern, 'gis'), colorPatternReplace);

    if (strObj === newStrObj) {
      break;
    }

    strObj = newStrObj;
  } while (true);

  console.log(strObj);
}