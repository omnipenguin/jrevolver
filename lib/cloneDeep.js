import { isArray, isObjectNotArray } from './helpers.js';
import PermutationSet from './PermutationSet.js';

/**
 * Forked from object-assign-deep: https://github.com/saikojosh/Object-Assign-Deep
 * Modified to work with PermutationSet
 */

const NULL = 'null';
const TYPE_ARRAY  = 'array';
const TYPE_OBJECT = 'object';
const TYPE_UNDEFINED = 'undefined';
const TYPE_PERMUTATION_SET = 'PermutationSet';

const ARRAY_BEHAVIOR_MERGE = 'merge';
const ARRAY_BEHAVIOR_REPLACE = 'replace';

/**
 * Determines the type of input
 * @param {*} input
 * @returns {String}
 */
function getTypeOf(input) {
  // null
  if (input === null) {
    return NULL;
  }
  // undefined
  else if (typeof input === TYPE_UNDEFINED) {
    return TYPE_UNDEFINED;
  }
  // PermutationSet
  else if (input instanceof PermutationSet) {
    return TYPE_PERMUTATION_SET;
  }
  // Array
  else if (isArray(input)) {
    return TYPE_ARRAY;
  }
  // Object
  else if (isObjectNotArray(input)) {
    return TYPE_OBJECT;
  }

  // other
  return typeof input;
}

/**
 * Clones a value based on type
 * @param {*} value
 * @returns {*}
 */
function cloneValue(value) {
  // Object
  if (getTypeOf(value) === TYPE_OBJECT) {
    return quickCloneObject(value);
  }
  // Array
  else if (getTypeOf(value) === TYPE_ARRAY) {
    return quickCloneArray(value);
  }
  // PermutationSet
  else if (getTypeOf(value) === TYPE_PERMUTATION_SET) {
    return new PermutationSet(cloneDeep(value.permutations));
  }

  // other
  return value;
}

/**
 * Deep clones an Array (breaks references)
 * @param {Array} input
 * @returns {Array}
 */
function quickCloneArray(input) {
  return input.map(cloneValue);
}

/**
 * Deep clones an Object (ignores prototype chain, breaks references)
 * @param {Object} input
 * @returns {Object}
 */
function quickCloneObject(input) {
  const output = {};

  for (const [key,] of Object.entries(input)) {
    output[key] = cloneValue(input[key]);
  }

  return output;
}

/**
 * Does the work for deep merging inputs
 * @param {Object|Array} target
 * @param {Array} [_objects = []]
 * @param {Object} [_options = {}]
 * @returns {Object|Array}
 */
function executeDeepMerge(target, _objects = [], _options = {}) {
  const options = {
    arrayBehavior: _options.arrayBehavior || ARRAY_BEHAVIOR_REPLACE,  // Can be "merge" or "replace".
  };

  // Ensure we have actual objects for each.
  const objects = _objects.map(object => object || {});
  const output = target || {};

  // Enumerate the objects and their keys.
  for (let oIdx = 0; oIdx < objects.length; oIdx++) {
    const object = objects[oIdx];
    const keys = Object.keys(object);

    for (let kIdx = 0; kIdx < keys.length; kIdx++) {
      const key = keys[kIdx];
      const value = object[key];
      const type = getTypeOf(value);
      const existingValueType = getTypeOf(output[key]);
      // Object
      if (type === TYPE_OBJECT) {
        if (existingValueType !== TYPE_UNDEFINED) {
          const existingValue = (existingValueType === TYPE_OBJECT ? output[key] : {});
          output[key] = executeDeepMerge({}, [ existingValue, cloneDeep(value) ], options);
        }
        else {
          output[key] = quickCloneObject(value);
        }
      }
      // Array
      else if (type === TYPE_ARRAY) {
        if (existingValueType === TYPE_ARRAY) {
          const newValue = quickCloneArray(value);
          output[key] = (options.arrayBehavior === ARRAY_BEHAVIOR_MERGE ? output[key].concat(newValue) : newValue);
        }
        else {
          output[key] = quickCloneArray(value);
        }
      }
      // PermutationSet
      else if (type === TYPE_PERMUTATION_SET) {
        const newValue = cloneValue(value);
        if (existingValueType === TYPE_PERMUTATION_SET) {
          if (options.arrayBehavior === ARRAY_BEHAVIOR_MERGE) {
            output[key].addPermutations(newValue);
          } else {
            output[key] = newValue;
          }
        }
        else {
          output[key] = newValue;
        }
      }
      // other
      else {
        output[key] = value;
      }
    }
  }

  return output;
}

/**
 * Deeply clones an Object and returns it
 * @param {*} obj
 * @return {*}
 */
export default function cloneDeep(obj) {
  const target = isArray(obj) ? [] : isObjectNotArray(obj) ? {} : undefined;
  return !target ? obj : executeDeepMerge(target, [ obj ]);
}

/**
 * Merge all the supplied Objects into the target Object, breaking all references, including those of nested Objects
 * and Arrays, and even Objects nested inside Arrays. The first parameter is not mutated unlike Object.assign().
 * Properties in later Objects will always overwrite.
 * @param {Object} target
 * @param {...Object} objects
 * @return {Object}
 */
export function objectAssignDeep(target, ...objects) {
  return executeDeepMerge(target, objects);
}

/**
 * Same as objectAssignDeep() except it doesn't mutate the target Object and returns an entirely new Object.
 * @param {...Object} objects
 * @return {Object}
 */
export function objectAssignDeepNoMutate(...objects) {
  return executeDeepMerge({}, objects);
}

/**
 * Allows an options Object to be passed in to customise the behavior of the function.
 * @param {Object} target
 * @param {Array} objects
 * @param {Object} options
 * @return {Object}
 */
export function objectAssignDeepInto(target, objects, options) {
  return executeDeepMerge(target, objects, options);
}