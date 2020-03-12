import colors from 'colors';
import { CONSOLE_LOG_OBJ_PERMUTATION_SET_START, CONSOLE_LOG_OBJ_PERMUTATION_SET_END } from './constants.js';
import { isArray, stringifyObj } from './helpers.js';

const _permutations = Symbol();

export default class PermutationSet {
  constructor(inputPermutations) {
    if (PermutationSet._validateInput(inputPermutations)) {
      this[_permutations] = inputPermutations;
    } else {
      this[_permutations] = [];
    }
  }

  static _validateInput(input) {
    // Array
    if (isArray(input)) {
      return true;
    }
    // any other type of input
    else if (input) {
      throw new Error(colors.yellow(`Attempted to set an invalid set of permutations, expected an Array:` + stringifyObj(input)));
    }

    return false;
  }

  get permutations() {
    return this[_permutations];
  }

  set permutations(inputPermutations) {
    this.constructor(inputPermutations);
  }

  addPermutations(addPermutations) {
    if (PermutationSet._validateInput(addPermutations)) {
      this[_permutations].push(...addPermutations);
    }

    return this[_permutations];
  }

  toJSON() {
    return [
      CONSOLE_LOG_OBJ_PERMUTATION_SET_START,
      [
        ...this[_permutations]
      ],
      CONSOLE_LOG_OBJ_PERMUTATION_SET_END
    ];
  }
}