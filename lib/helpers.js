import path from 'path';
import colors from 'colors';
import crypto from 'crypto';
import {
  JR_FUNC,
  OUTPUT_JSON_INDENT,
  CONSOLE_LOG_OBJ_ARRAY_EMPTY_INDEX_SENTINEL, CONSOLE_LOG_OBJ_PERMUTATION_SET_START, CONSOLE_LOG_OBJ_PERMUTATION_SET_END,
} from './constants.js';
import cloneDeep from './cloneDeep.js';
import PermutationSet from './PermutationSet.js';
// lodash
import assignInWith from 'lodash.assigninwith';

/**
 * Recursively flattens a nested Array
 * @param {Array} arr
 * @returns {Array}
 */
export function flattenArray(arr) {
  return isArray(arr) ? [].concat.apply([], arr.map(flattenArray)) : arr;
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
 * Deep merges Objects
 * @param {Object} target
 * @param {...Object} sources
 * @returns {Object}
 */
export function mergeDeep(target, ...sources) {
  if (!sources.length) return target;
  const source = sources.shift();

  for (const [key, ] of Object.entries(source)) {
    if (isObjectNotArray(source[key])) {
      if (!target[key]) Object.assign(target, { [key]: {} });
      mergeDeep(target[key], source[key]);
    } else {
      assignInWith(target, { [key]: source[key] }, function(objValue, srcValue, key, object, source) { // eslint-disable-line no-unused-vars
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
 * @param {String} path - the nested context to fetch
 * @returns {*|undefined}
 */
export function getPropByPath(obj, path) {
  if (!path) return obj;
  return path.split('.').reduce((a,v) => a && a[v], obj);
}

/**
 * Sets a nested property of obj using a dot path
 * @param {Object} obj - the object to mutate
 * @param {String} path - the nested context to set
 * @param {*}      value - the value to set
 */
export function setPropByPath(obj, path, value) {
  if (!path) {
    obj = value;
    return;
  }

  const pathList = path.split('.');
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
 * @param {String} path - the nested context to set
 */
export function deletePropByPath(obj, path) {
  if (!path || getPropByPath(obj, path) === undefined) {
    return;
  }

  const pathList = path.split('.');
  const key = pathList.pop();
  const pointer = pathList.reduce((a,v) => a[v], obj);

  delete pointer[key];
}

/**
 * Returns a nested permutation of obj using a dot path
 * @param {Object} obj - the object to analyze
 * @param {String} path - the nested context to fetch
 * @returns {*|undefined}
 */
export function getPermutationByPath(obj, path) {
  if (!path) return obj;

  const pathList = path.split('.');
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
 * @param {String} path - the nested permutation to set
 * @param {*}      perm - the perm to set
 */
export function setPermutationByPath(obj, path, perm) {
  if (!path) {
    obj = perm;
    return;
  }

  const pathList = path.split('.');
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
 * Removes all jRevolver comments from a JSON object
 * @param {Object} json - JSON object
 * @returns {Object}
 */
export function removeComments(json) {
  if (JSON.stringify(json).includes(`"${JR_FUNC.comment}`)) {
    if (isArray(json)) {
      for (const [i, v] of Object.entries(json)) {
        if (typeof v === 'string' && v.substring(0, JR_FUNC.comment.length) === JR_FUNC.comment) {
          json.splice(i, 1);
        }
      }
    }

    for (const [k, v] of Object.entries(json)) {
      if (k.substring(0, JR_FUNC.comment.length) === JR_FUNC.comment) {
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
    if (isArray(val)) {
      const arr = [];
      for (const a of val) {
        arr.push((a === undefined) ? CONSOLE_LOG_OBJ_ARRAY_EMPTY_INDEX_SENTINEL : a);
      }
      return arr;
    }

    return val;
  }, OUTPUT_JSON_INDENT);
}

/**
 * Logs an Object to console in human readable format
 * @param obj {*} obj
 * @returns {String}
 */
export function consoleLogObj(obj) {
  const pSetStart = CONSOLE_LOG_OBJ_PERMUTATION_SET_START;
  const pSetEnd = CONSOLE_LOG_OBJ_PERMUTATION_SET_END;

  //const pattern = String.raw`\[\n\s*"${pSetStart}",\n\s*\[([\s\S]*?)\n\s*\],\n\s*"${pSetEnd}"\n(\s*)\]`;
  const pattern = '\\[\\n\\s*"' + pSetStart + '",\\n\\s*\\[([\\s\\S]*?)\\n\\s*\\],\\n\\s*"' + pSetEnd + '"\\n(\\s*)\\]';
  const stringifiedObj = stringifyObj(obj)
      .replace(
          new RegExp(pattern, 'ig'),
          colors.cyan(`<PermutationSet> <[$1\n$2]>`)
      );

  console.log(stringifiedObj);
}