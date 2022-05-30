import colors from 'colors';
import {
  CLOBJ_PERMUTATION_SET_START_SENTINEL,
  CLOBJ_PERMUTATION_SET_END_SENTINEL,
} from './constants.js';
import {
  isArray, isObject,
  uniqArray,
  stringifyObj,
} from './helpers.js';
import cloneDeep, { objectAssignDeepInto } from './cloneDeep.js';

export const MERGE_BEHAVIOR = {
  ADD: 'add', // replace/merge values, always ADD permutation sets together
  MERGE_ADD: 'merge_add', // replace/merge values, always MERGE sub-permutation sets together (order is important)
  MERGE_REPLACE: 'merge_replace', // replace/merge values, always REPLACE n sub-permutations (order is important)
  REPLACE: 'replace', // replace/merge values, always REPLACE all non-empty sub-permutations
};

export const REPLACE_EMPTY_BEHAVIOR = {
  DONT_REPLACE_WITH_EMPTY: 'dont_replace_with_empty', // DON'T replace existing permutations with empty Arrays/Objects (order is important)
  REPLACE_WITH_EMPTY: 'replace_with_empty', // REPLACE existing permutations with empty Arrays/Objects (order is important)
}

const _permutations = Symbol();

export default class PermutationSet {
  constructor(inputPermutations) {
    this._setPermutations(inputPermutations);
  }

  static _validateInput(input) {
    // Array
    if (isArray(input)) {
      return true;
    }
    // any other type of input
    else if (input) {
      throw new Error(colors.yellow(`Attempted to set an invalid set of permutations, expected an Array: ${stringifyObj(input)}`));
    }

    return false;
  }

  _setPermutations(inputPermutations) {
    if (PermutationSet._validateInput(inputPermutations)) {
      this[_permutations] = inputPermutations;
    } else {
      this[_permutations] = [];
    }
  }

  get permutations() {
    return this[_permutations];
  }

  set permutations(inputPermutations) {
    this._setPermutations(inputPermutations);
  }

  addPermutations(addPermutations) {
    if (PermutationSet._validateInput(addPermutations)) {
      this.permutations.push(...addPermutations);
    }

    return this;
  }

  mergePermutations(_mergePermutations, _options = {}) {
    const mergePermutations = _mergePermutations instanceof PermutationSet ? _mergePermutations.permutations : _mergePermutations;
    const options = {
      mergeBehavior: _options.mergeBehavior || MERGE_BEHAVIOR.MERGE_ADD,
      replaceEmptyBehavior: _options.replaceEmptyBehavior || REPLACE_EMPTY_BEHAVIOR.REPLACE_WITH_EMPTY,
    }

    if (PermutationSet._validateInput(mergePermutations)) {
      const originalSetSize = this.permutations.length;
      for (let pIdx = 0; pIdx < originalSetSize && pIdx < mergePermutations.length; pIdx++) {
        const mergeTarget = this.permutations[pIdx];
        const mergeItem = mergePermutations[pIdx];

        // we are merging INTO a PermutationSet
        if (mergeTarget instanceof PermutationSet) {
          // we are merging a PermutationSet INTO a PermutationSet
          if (mergeItem instanceof PermutationSet) {
            const mergePerms = cloneDeep(mergeItem.permutations);
            // MERGE_ADD: add permutations to existing set
            if (options.mergeBehavior === MERGE_BEHAVIOR.MERGE_ADD) {
              mergeTarget.addPermutations(mergePerms);
            }
            // MERGE_REPLACE: replace n permutations in existing set
            else if (options.mergeBehavior === MERGE_BEHAVIOR.MERGE_REPLACE) {
              // replace first n permutations
              if (mergeTarget.permutations.length > mergePerms.length) {
                mergeTarget.permutations = mergePerms.concat(mergeTarget.permutations.slice(mergePerms.length));
              }
              // replace all permutations
              else {
                mergeTarget.permutations = mergePerms;
              }
            }
            // REPLACE: replace ALL permutations in existing set
            else if (options.mergeBehavior === MERGE_BEHAVIOR.REPLACE) {
              mergeTarget.permutations = mergePerms;
            }
          }
          // we are merging a value INTO a PermutationSet
          else {
            // MERGE_ADD: add value to existing set
            if (options.mergeBehavior === MERGE_BEHAVIOR.MERGE_ADD) {
              mergeTarget.addPermutations([ mergeItem ]);
            }
            // MERGE_REPLACE: replace permutations in existing set
            else if (options.mergeBehavior === MERGE_BEHAVIOR.MERGE_REPLACE) {
              mergeTarget.mergePermutations([ mergeItem ], options);
            }
            // REPLACE: overwrite
            else if (options.mergeBehavior === MERGE_BEHAVIOR.REPLACE) {
              this.permutations[pIdx] = mergeItem;
            }
          }
        } else {
          // Object or Array
          if (isObject(mergeTarget)) {
            // REPLACE: replace entire existing permutation (if non-empty)
            if (options.mergeBehavior === MERGE_BEHAVIOR.REPLACE) {
              if (
                options.replaceEmptyBehavior === REPLACE_EMPTY_BEHAVIOR.REPLACE_WITH_EMPTY ||
                (options.replaceEmptyBehavior === REPLACE_EMPTY_BEHAVIOR.DONT_REPLACE_WITH_EMPTY && Object.keys(mergeItem).length)
              ) {
                this.permutations[pIdx] = mergePermutations[pIdx];
              }
            }
            // any other merge type: merge permutations
            else {
              objectAssignDeepInto(
                mergeTarget,
                [ mergeItem ],
                { permutationSetBehavior: options.mergeBehavior },
              );
            }
          }
          // any other type
          else {
            // MERGE_ADD: add value to existing set
            if (options.mergeBehavior === MERGE_BEHAVIOR.MERGE_ADD) {
              this.permutations.push(mergeItem);
            }
            // MERGE_REPLACE: replace value in existing set
            else if (options.mergeBehavior === MERGE_BEHAVIOR.MERGE_REPLACE) {
              this.permutations[pIdx] = mergePermutations[pIdx];
            }
          }
        }
      }

      if (mergePermutations.length > originalSetSize) {
        this.addPermutations(mergePermutations.slice(originalSetSize));
      }
    }

    this[_permutations] = uniqArray(this[_permutations]);

    return this;
  }

  toJSON() {
    return this.permutations;
  }

  prettyPrintJSON() {
    return [
      CLOBJ_PERMUTATION_SET_START_SENTINEL,
      this.permutations,
      CLOBJ_PERMUTATION_SET_END_SENTINEL,
    ];
  }
}