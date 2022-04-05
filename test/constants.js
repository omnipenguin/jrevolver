import PermutationSet, { MERGE_BEHAVIOR, REPLACE_EMPTY_BEHAVIOR } from '../lib/PermutationSet.js';

export const MOCK_GENERATED_PATH = 'mockgen';
export const MOCK_HASH_PATH = 'test/hashes';

export const MOCK_PATHS = {
  SINGLE_OUTPUT: [
    'sample_include/comments',
    'sample_include/override',
    'sample_include/override_nested_single',
    'sample_include/simple',
  ],
  WITH_PERMUTATIONS: [
    'sample_include/extra_dir',
    'sample_include/override_permute',
    'sample_include/override_permute_with_map',
    'sample_include/override_with_map',
    'sample_include/permute_nested_multiple',
    'sample_include/with_map',
    'sample_map/array',
    'sample_map/exclude',
    'sample_map/exclude_nested',
    'sample_map/current_context',
    'sample_map/current_context_nested_arrays',
    'sample_map/custom_filename',
    'sample_map/custom_filename_warning',
    'sample_map/gnarly',
    'sample_map/property_multiple_types',
    'sample_map/simple',
    'sample_map/allow_only',
    'sample_combo/array_map_multiple_with_nested_array_map_include',
    'sample_combo/array_map_single_nested_array_map_include',
    'sample_combo/map_nested_array_include',
    'sample_combo/map_nested_multiple_types',
    'sample_combo/spaces_in_key_names',
  ],
};

/**
 * Initial test data for PermutationSet functionality
 * @returns {Object}
 */
export function permutationSetTestData() {
  return {
    setA: new PermutationSet([
      { keyA: 'a1', keyB: 'b1' },
      { keyA: 'a1', keyB: 'b2' },
      { keyA: 'a1', keyB: 'b3' },
      { keyA: 'a2', keyB: 'b1' },
      { keyA: 'a2', keyB: 'b2' },
      { keyA: 'a2', keyB: 'b3' },
      { keyA: 'a3', keyB: 'b1' },
      { keyA: 'a3', keyB: 'b2' },
      { keyA: 'a3', keyB: 'b3' },
    ]),

    setB: new PermutationSet([
      { keyA: 'a4', keyC: 'c1' },
      { keyA: 'a4', keyC: 'c2' },
      { keyA: 'a4', keyC: 'c3' },
    ]),

    setC: new PermutationSet([
      {
        keyA: 'a4',
        keyC: new PermutationSet([ 'aA', new PermutationSet([ 'b1', 'b2', 'b3' ]) ]),
      },
      {
        keyA: 'a4',
        keyC: new PermutationSet([ 'aA', 'cC', 'eE' ]),
      },
      {
        keyA: 'a4',
        keyC: new PermutationSet([ 'bB', 'cC' ]),
      },
      {
        keyA: 'a4',
        keyC: new PermutationSet([ 'bB', 'dD', 'fF', 'gG' ]),
      },
    ]),

    setD: new PermutationSet([
      {
        keyA: 'a4_1',
        keyC: new PermutationSet([ 'b_b', new PermutationSet([ 'c11', 'c12' ]), 'dD', 'eE' ]),
      },
      {
        keyA: 'a5',
        keyC: new PermutationSet([ 'eE', 'dD' ]),
      },
      {},
      {
        keyA: 'a6',
        keyC: new PermutationSet([ 'aA', null, 'rR' ]),
      },
    ]),
  };
}

/**
 * expected mergePermutations() results
 * @returns {Object}
 */
export function permutationSetExpectedData() {
  return {
    mergeAdd1: new PermutationSet([
      { keyA: 'a4', keyB: 'b1', keyC: 'c1' },
      { keyA: 'a4', keyB: 'b2', keyC: 'c2' },
      { keyA: 'a4', keyB: 'b3', keyC: 'c3' },
      { keyA: 'a2', keyB: 'b1' },
      { keyA: 'a2', keyB: 'b2' },
      { keyA: 'a2', keyB: 'b3' },
      { keyA: 'a3', keyB: 'b1' },
      { keyA: 'a3', keyB: 'b2' },
      { keyA: 'a3', keyB: 'b3' },
    ]),

    mergeAdd2: new PermutationSet([
      { keyA: 'a1', keyC: 'c1', keyB: 'b1' },
      { keyA: 'a1', keyC: 'c2', keyB: 'b2' },
      { keyA: 'a1', keyC: 'c3', keyB: 'b3' },
      { keyA: 'a2', keyB: 'b1' },
      { keyA: 'a2', keyB: 'b2' },
      { keyA: 'a2', keyB: 'b3' },
      { keyA: 'a3', keyB: 'b1' },
      { keyA: 'a3', keyB: 'b2' },
      { keyA: 'a3', keyB: 'b3' },
    ]),

    mergeAdd3: new PermutationSet([
      { keyA: 'a4_1', keyC: new PermutationSet([ 'aA', new PermutationSet([ 'b1', 'b2', 'b3', 'c11', 'c12' ]), 'b_b', 'dD', 'eE' ]) },
      { keyA: 'a5', keyC: new PermutationSet([ 'aA', 'cC', 'eE', 'dD' ]) },
      { keyA: 'a4', keyC: new PermutationSet([ 'bB', 'cC' ]) },
      { keyA: 'a6', keyC: new PermutationSet([ 'bB', 'dD', 'fF', 'gG', 'aA', null, 'rR' ]) },
    ]),

    mergeReplace1: new PermutationSet([
      { keyA: 'a4', keyB: 'b1', keyC: 'c1' },
      { keyA: 'a4', keyB: 'b2', keyC: 'c2' },
      { keyA: 'a4', keyB: 'b3', keyC: 'c3' },
      { keyA: 'a2', keyB: 'b1' },
      { keyA: 'a2', keyB: 'b2' },
      { keyA: 'a2', keyB: 'b3' },
      { keyA: 'a3', keyB: 'b1' },
      { keyA: 'a3', keyB: 'b2' },
      { keyA: 'a3', keyB: 'b3' },
    ]),

    mergeReplace2: new PermutationSet([
      { keyA: 'a4', keyC: 'c1' },
      { keyA: 'a4', keyC: 'c2' },
      { keyA: 'a4', keyC: 'c3' },
      {
        keyA: 'a4',
        keyC: new PermutationSet([ 'bB', 'dD', 'fF', 'gG' ]),
      },
    ]),

    mergeReplace3: new PermutationSet([
      { keyA: 'a4_1', keyC: [ 'b_b', new PermutationSet([ 'c11', 'c12', 'b3' ]), 'dD', 'eE' ] },
      { keyA: 'a5', keyC: [ 'eE', 'dD' ] },
      { keyA: 'a4', keyC: [ 'bB', 'cC' ] },
      { keyA: 'a6', keyC: [ 'aA', null, 'rR', 'gG' ] },
    ]),

    replace1: new PermutationSet([
      { keyA: 'a4', keyC: 'c1' },
      { keyA: 'a4', keyC: 'c2' },
      { keyA: 'a4', keyC: 'c3' },
      { keyA: 'a2', keyB: 'b1' },
      { keyA: 'a2', keyB: 'b2' },
      { keyA: 'a2', keyB: 'b3' },
      { keyA: 'a3', keyB: 'b1' },
      { keyA: 'a3', keyB: 'b2' },
      { keyA: 'a3', keyB: 'b3' },
    ]),

    replace2: new PermutationSet([
      { keyA: 'a4', keyC: 'c1' },
      { keyA: 'a4', keyC: 'c2' },
      { keyA: 'a4', keyC: 'c3' },
      {
        keyA: 'a4',
        keyC: new PermutationSet([ 'bB', 'dD', 'fF', 'gG' ]),
      },
    ]),

    replace3: new PermutationSet([
      {
        keyA: 'a4_1',
        keyC: new PermutationSet([ 'b_b', new PermutationSet([ 'c11', 'c12' ]), 'dD', 'eE' ]),
      },
      {
        keyA: 'a5',
        keyC: new PermutationSet([ 'eE', 'dD' ]),
      },
      {},
      {
        keyA: 'a6',
        keyC: new PermutationSet([ 'aA', null, 'rR' ]),
      },
    ]),

    replaceDontReplaceWithEmpty1: new PermutationSet([
      { keyA: 'a4', keyC: 'c1' },
      { keyA: 'a4', keyC: 'c2' },
      { keyA: 'a4', keyC: 'c3' },
      { keyA: 'a2', keyB: 'b1' },
      { keyA: 'a2', keyB: 'b2' },
      { keyA: 'a2', keyB: 'b3' },
      { keyA: 'a3', keyB: 'b1' },
      { keyA: 'a3', keyB: 'b2' },
      { keyA: 'a3', keyB: 'b3' },
    ]),

    replaceDontReplaceWithEmpty2: new PermutationSet([
      { keyA: 'a4', keyC: 'c1' },
      { keyA: 'a4', keyC: 'c2' },
      { keyA: 'a4', keyC: 'c3' },
      {
        keyA: 'a4',
        keyC: new PermutationSet([ 'bB', 'dD', 'fF', 'gG' ]),
      },
    ]),

    replaceDontReplaceWithEmpty3: new PermutationSet([
      {
        keyA: 'a4_1',
        keyC: new PermutationSet([ 'b_b', new PermutationSet([ 'c11', 'c12' ]), 'dD', 'eE' ]),
      },
      {
        keyA: 'a5',
        keyC: new PermutationSet([ 'eE', 'dD' ]),
      },
      {
        keyA: 'a4',
        keyC: new PermutationSet([ 'bB', 'cC' ]),
      },
      {
        keyA: 'a6',
        keyC: new PermutationSet([ 'aA', null, 'rR' ]),
      },
    ]),
  };
};

// mergePermutations() test data merge types
export const RESULT_MERGE_TYPE = {
  mergeAdd1: MERGE_BEHAVIOR.MERGE_ADD,
  mergeAdd2: MERGE_BEHAVIOR.MERGE_ADD,
  mergeAdd3: MERGE_BEHAVIOR.MERGE_ADD,
  mergeReplace1: MERGE_BEHAVIOR.MERGE_REPLACE,
  mergeReplace2: MERGE_BEHAVIOR.MERGE_REPLACE,
  mergeReplace3: MERGE_BEHAVIOR.MERGE_REPLACE,
  replace1: MERGE_BEHAVIOR.REPLACE,
  replace2: MERGE_BEHAVIOR.REPLACE,
  replace3: MERGE_BEHAVIOR.REPLACE,
  replaceDontReplaceWithEmpty1: {
    mergeBehavior: MERGE_BEHAVIOR.REPLACE,
    replaceEmptyBehavior: REPLACE_EMPTY_BEHAVIOR.DONT_REPLACE_WITH_EMPTY,
  },
  replaceDontReplaceWithEmpty2: {
    mergeBehavior: MERGE_BEHAVIOR.REPLACE,
    replaceEmptyBehavior: REPLACE_EMPTY_BEHAVIOR.DONT_REPLACE_WITH_EMPTY,
  },
  replaceDontReplaceWithEmpty3: {
    mergeBehavior: MERGE_BEHAVIOR.REPLACE,
    replaceEmptyBehavior: REPLACE_EMPTY_BEHAVIOR.DONT_REPLACE_WITH_EMPTY,
  },
}