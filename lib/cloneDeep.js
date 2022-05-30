import { isArray, isObjectNotArray } from './helpers.js';
import PermutationSet, {
  MERGE_BEHAVIOR as PERMUTATION_SET_BEHAVIOR,
} from './PermutationSet.js';

/**
 * Forked from object-assign-deep: https://github.com/saikojosh/Object-Assign-Deep
 * Modified to work with PermutationSet
 */

export const TYPE = {
  ARRAY: 'array',
  OBJECT: 'object',
  STRING: 'string',
  NULL: 'null',
  UNDEFINED: 'undefined',
  PERMUTATION_SET: 'PermutationSet',
}

export const ARRAY_BEHAVIOR = {
  MERGE: 'merge',
  REPLACE: 'replace',
}

/**
 * Determines the type of input
 * @param {*} input
 * @returns {String}
 */
export function getTypeOf(input) {
  // null
  if (input === null) {
    return TYPE.NULL;
  }
  // undefined
  else if (typeof input === TYPE.UNDEFINED) {
    return TYPE.UNDEFINED;
  }
  // PermutationSet
  else if (input instanceof PermutationSet) {
    return TYPE.PERMUTATION_SET;
  }
  // Array
  else if (isArray(input)) {
    return TYPE.ARRAY;
  }
  // Object
  else if (isObjectNotArray(input)) {
    return TYPE.OBJECT;
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
  if (getTypeOf(value) === TYPE.OBJECT) {
    return quickCloneObject(value);
  }
  // Array
  else if (getTypeOf(value) === TYPE.ARRAY) {
    return quickCloneArray(value);
  }
  // PermutationSet
  else if (getTypeOf(value) === TYPE.PERMUTATION_SET) {
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

  for (const key of Object.keys(input)) {
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
    arrayBehavior: _options.arrayBehavior || ARRAY_BEHAVIOR.REPLACE,  // Can be "merge" or "replace".
    permutationSetBehavior: _options.permutationSetBehavior || PERMUTATION_SET_BEHAVIOR.ADD, // Can be "merge_add", "merge_replace", or "replace".
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
      if (type === TYPE.OBJECT) {
        if (existingValueType !== TYPE.UNDEFINED) {
          const existingValue = (existingValueType === TYPE.OBJECT ? output[key] : {});
          output[key] = executeDeepMerge({}, [ existingValue, cloneDeep(value) ], options);
        }
        else {
          output[key] = quickCloneObject(value);
        }
      }
      // Array
      else if (type === TYPE.ARRAY) {
        if (existingValueType === TYPE.ARRAY) {
          const newValue = quickCloneArray(value);
          if (options.arrayBehavior === ARRAY_BEHAVIOR.MERGE) {
            output[key] = output[key].concat(newValue);
          }
          else if (options.arrayBehavior === ARRAY_BEHAVIOR.REPLACE) {
            output[key] = newValue;
          }
        }
        else {
          output[key] = quickCloneArray(value);
        }
      }
      // PermutationSet
      else if (type === TYPE.PERMUTATION_SET) {
        const newValue = cloneValue(value);

        if (existingValueType === TYPE.PERMUTATION_SET) {
          if (options.permutationSetBehavior === PERMUTATION_SET_BEHAVIOR.ADD) {
            output[key].addPermutations(newValue);
          }
          else if (options.permutationSetBehavior === PERMUTATION_SET_BEHAVIOR.MERGE_ADD) {
            output[key].mergePermutations(newValue, { mergeBehavior: PERMUTATION_SET_BEHAVIOR.MERGE_ADD });
          }
          else if (options.permutationSetBehavior === PERMUTATION_SET_BEHAVIOR.MERGE_REPLACE) {
            output[key].mergePermutations(newValue, { mergeBehavior: PERMUTATION_SET_BEHAVIOR.MERGE_REPLACE });
          }
          else if (options.permutationSetBehavior === PERMUTATION_SET_BEHAVIOR.REPLACE) {
            output[key] = newValue;
          }
        }
        else {
          if (options.permutationSetBehavior === PERMUTATION_SET_BEHAVIOR.MERGE_ADD) {
            const newPermutationSet = new PermutationSet([ output[key], newValue ]);
            output[key] = newPermutationSet;
          }
          else {
            output[key] = newValue;
          }
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