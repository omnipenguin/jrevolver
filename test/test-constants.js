import PermutationSet, { MERGE_BEHAVIOR, REPLACE_EMPTY_BEHAVIOR } from '../lib/PermutationSet.js';

export const FLAG_VALIDATE = '--validate';

export const HASH_FILENAME_SPLIT_SENTINEL = /\s?\|\s?/i;
export const MOCK_HASH_MAP_KEYS = [ 'foundFiles', 'foundHashes', 'expectedFiles', 'expectedHashes' ];
export const MOCK_HASH_MAP = Object.fromEntries(MOCK_HASH_MAP_KEYS.map(k => [k,k]));

export const MOCK_GENERATED_PATH = 'mockgen';
export const MOCK_HASH_PATH = 'test/hashes';

export const MOCK_PATHS = {
  SINGLE_PERMUTATION: [
    'comments',

    'sample_include/defaults/defaults',
    'sample_include/defaults/nested_single',
    'sample_include/defaults/simple_value',
    'sample_include/defaults/merge_mapExclude',

    'sample_include/overrides/overrides',

    'sample_merge/concat',
    'sample_merge/concat_with_include',
    'sample_merge/zipperMerge',
    'sample_merge/zipperMerge_with_include',
  ],
  WITH_PERMUTATIONS: [
    'sample_combo/defaults/array_map_multiple_with_nested_array_map_include',
    'sample_combo/defaults/array_map_single_nested_array_map_include',
    'sample_combo/defaults/map_nested_array_include',
    'sample_combo/defaults/map_nested_multiple_types',
    'sample_combo/defaults/spaces_in_key_names',

    'sample_include/defaults/array_value_with_map',
    'sample_include/defaults/defaults_with_map',
    'sample_include/defaults/merge_mapAllowOnly',
    'sample_include/defaults/nested_map',

    'sample_include/overrides/overrides_with_map',

    'sample_include/permute/extra_dir',
    'sample_include/permute/permute',
    'sample_include/permute/permute_nested_multiple',
    'sample_include/permute/permute_with_map',
    'sample_include/permute/permute_with_mapZipper',

    'sample_map/array_with_mapKey_mapContent',
    'sample_map/current_context',
    'sample_map/current_context_nested_arrays',
    'sample_map/custom_filename',
    'sample_map/custom_filename_warning',
    'sample_map/gnarly',
    'sample_map/mapAllowOnly',
    'sample_map/mapExclude_nested_with_mapKey_mapContent',
    'sample_map/mapExclude_with_mapKey',
    'sample_map/nested_property_multiple_types',
    'sample_map/simple',
    'sample_map/simple_mapZipper',
    'sample_map/special_chars_in_keynames',
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
}

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