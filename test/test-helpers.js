import { readdirSync, readFileSync } from 'fs';
import { md5 } from '../lib/helpers.js';
import { MOCK_GENERATED_PATH, MOCK_HASH_PATH, MOCK_PATHS } from './constants.js';

/**
 * Builds a map of all the expected hash values for generated mocks
 * @returns {Object}
 */
export function buildMockHashesMap() {
  const mockHashes = {};

  // build hash list of generated mocks that only generate a single permutation
  for (const mockFile of MOCK_PATHS.SINGLE_OUTPUT) {
    const mockDir = `${MOCK_GENERATED_PATH}/${mockFile}.json`;
    const mockHashDir = `${MOCK_HASH_PATH}/${mockFile}`;
    mockHashes[mockDir] = {
      found: md5(readFileSync(mockDir, 'utf8')),
      expected: readFileSync(mockHashDir, 'utf8'),
    };
  }

  // build hash list of generated mocks with multiple permutations
  for (const mockPath of MOCK_PATHS.WITH_PERMUTATIONS) {
    const mockDir = `${MOCK_GENERATED_PATH}/${mockPath}`;
    const mockHashDir = `${MOCK_HASH_PATH}/${mockPath}`;
    mockHashes[mockDir] = {
      found: readdirSync(mockDir),
      expected: readFileSync(mockHashDir, 'utf8').split('\n').filter(a => a),
    };
  }

  return mockHashes;
}
