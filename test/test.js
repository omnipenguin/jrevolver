#! /usr/bin/env node
import { readdirSync, readFileSync } from 'fs';
import colors from 'colors';
import shell from 'shelljs';
import { isObjectNotArray, md5, consoleLogObj } from '../lib/helpers.js';
import PermutationSet, { MERGE_BEHAVIOR, REPLACE_EMPTY_BEHAVIOR } from '../lib/PermutationSet.js';

const MOCK_GENERATED_PATH = 'mockgen';
const MOCK_HASH_PATH = 'test/hashes';
const MOCK_PATHS = {
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

Error.stackTraceLimit = 1000;

shell.exec(`npm run clean-generated`);
shell.exec(`npm run generate-mocks`);

// build hash list of generated mocks
const mockHashes = {};

for (const mockPath of MOCK_PATHS.WITH_PERMUTATIONS) {
  const mockDir = `${MOCK_GENERATED_PATH}/${mockPath}`;
  mockHashes[mockDir] = {
    found: readdirSync(mockDir),
    expected: readFileSync(`${MOCK_HASH_PATH}/${mockPath}`, 'utf8').split('\n').filter(a => a),
  };
}

console.log(colors.cyan("Testing mock generation:\n"));

// keep track of invalid generated mocks
let numInvalidHashes = 0;

// validate mocks that only generate a single permutation
for (const mockFile of MOCK_PATHS.SINGLE_OUTPUT) {
  const storedHash = readFileSync(`${MOCK_HASH_PATH}/${mockFile}`, 'utf8');
  const generatedHash = md5(readFileSync(`${MOCK_GENERATED_PATH}/${mockFile}.json`, 'utf8'));
  const hashMatches = (storedHash === generatedHash);

  console.log(
    `${mockFile} : ` + (hashMatches ? colors.green('HASH MATCHES!') : colors.red('INVALID HASH!'))
  );

  if (!hashMatches) {
    numInvalidHashes++;
  }
}

/**
 * Determines if the contents of two arrays are equal
 * @param a {Array}
 * @param b {Array}
 * @returns {Boolean}
 */
function arrayEquals(a, b) {
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

// test generated mock data against stored hashes
for (const [mockPath, mocks] of Object.entries(mockHashes)) {
  if (arrayEquals(mocks.found, mocks.expected)) {
    console.log(`${mockPath}/* : ` + colors.green(`${mocks.found.length}/${mocks.expected.length} HASHES MATCH!`));
  } else {
    console.log(`${mockPath}/* : ` + colors.red(`INVALID HASHES! (${mocks.found.length} found, ${mocks.expected.length} expected)`));
    numInvalidHashes++;
  }
}

// Test PermutationSet merge functionality
console.log(colors.cyan("\nTesting PermutationSet:\n"));

let setA, setB, setC, setD;

/**
 * Resets PermutationSet input test data
 */
function resetPermutationSetTestData() {
  setA = new PermutationSet([
    { keyA: 'a1', keyB: 'b1' },
    { keyA: 'a1', keyB: 'b2' },
    { keyA: 'a1', keyB: 'b3' },
    { keyA: 'a2', keyB: 'b1' },
    { keyA: 'a2', keyB: 'b2' },
    { keyA: 'a2', keyB: 'b3' },
    { keyA: 'a3', keyB: 'b1' },
    { keyA: 'a3', keyB: 'b2' },
    { keyA: 'a3', keyB: 'b3' },
  ]);

  setB = new PermutationSet([
    { keyA: 'a4', keyC: 'c1' },
    { keyA: 'a4', keyC: 'c2' },
    { keyA: 'a4', keyC: 'c3' },
  ]);

  setC = new PermutationSet([
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
  ]);

  setD = new PermutationSet([
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
  ]);
}
resetPermutationSetTestData();

// expected mergePermutations() Results
const expectedResults = {
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

const resultMergeType = {
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
};

const _results = {};
const results = new Proxy(_results, {
  set(target, name, value, receiver) {
    resetPermutationSetTestData();
    return Reflect.set(target, name, value, receiver);
  },
});

const options = {
  mergeReplace: { mergeBehavior: MERGE_BEHAVIOR.MERGE_REPLACE },
  replace: { mergeBehavior: MERGE_BEHAVIOR.REPLACE },
  replaceDontReplaceWithEmpty: {
    mergeBehavior: MERGE_BEHAVIOR.REPLACE,
    replaceEmptyBehavior: REPLACE_EMPTY_BEHAVIOR.DONT_REPLACE_WITH_EMPTY,
  },
};

results.mergeAdd1 = setA.mergePermutations(setB);
results.mergeAdd2 = setB.mergePermutations(setA);
results.mergeAdd3 = setC.mergePermutations(setD);
results.mergeReplace1 = setA.mergePermutations(setB, options.mergeReplace);
results.mergeReplace2 = setC.mergePermutations(setB, options.mergeReplace);
results.mergeReplace3 = setC.mergePermutations(setD, options.mergeReplace);
results.replace1 = setA.mergePermutations(setB, options.replace);
results.replace2 = setC.mergePermutations(setB, options.replace);
results.replace3 = setC.mergePermutations(setD, options.replace);
results.replaceDontReplaceWithEmpty1 = setA.mergePermutations(setB, options.replaceDontReplaceWithEmpty);
results.replaceDontReplaceWithEmpty2 = setC.mergePermutations(setB, options.replaceDontReplaceWithEmpty);
results.replaceDontReplaceWithEmpty3 = setC.mergePermutations(setD, options.replaceDontReplaceWithEmpty);

// keep track of invalid merges
let numInvalidMerges = 0;

for (const [resultKey, result] of Object.entries(results)) {
  const _resultMergeType = isObjectNotArray(resultMergeType[resultKey]) ? resultMergeType[resultKey] : { mergeBehavior: resultMergeType[resultKey] };
  const mergeBehaviorString = Object.values(_resultMergeType).join(', ');

  if (
    JSON.stringify(result.permutations) === JSON.stringify(expectedResults[resultKey]?.permutations)
  ) {
    console.log(`${resultKey} [${mergeBehaviorString}]: ` + colors.green('SET MERGE MATCHES!'));
  } else {
    console.log(`${resultKey} [${mergeBehaviorString}]: ` + colors.red('INVALID SET MERGE!'));
    consoleLogObj(result);
    numInvalidMerges++;
  }
}

console.log();

// failure
if (
  numInvalidHashes > 0 ||
  numInvalidMerges > 0
) {
  process.exit(1);
}

// success
process.exit(0);