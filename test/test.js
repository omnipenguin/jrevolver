#! /usr/bin/env node
Error.stackTraceLimit = 1000;

import { readdirSync, readFileSync, statSync } from 'fs';
import shell from 'shelljs';
import colors from 'colors';
import { md5 } from '../lib/helpers.js';

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
  ]
};

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

// validate mocks that generate multiple permutations against stored hashes
function arrayEquals(a, b) {
  if (a === b) {
    return true;
  }

  if (
    (a == null || b == null) ||
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

for (const [mockPath, mocks] of Object.entries(mockHashes)) {
  if (arrayEquals(mocks.found, mocks.expected)) {
    console.log(`${mockPath}/* : ` + colors.green(`${mocks.found.length}/${mocks.expected.length} HASHES MATCH!`));
  } else {
    console.log(`${mockPath}/* : ` + colors.red(`INVALID HASHES! (${mocks.found.length} found, ${mocks.expected.length} expected)`));
    numInvalidHashes++;
  }
}

if (numInvalidHashes === 0) {
  process.exit(0);
} else {
  process.exit(1);
}