import { existsSync, readFileSync, readdirSync } from 'fs';
import path from 'path';
import { cleanArray, md5 } from '../lib/helpers.js';
import {
  HASH_FILENAME_SPLIT_SENTINEL as MOCK_HASH_SPLIT,
  MOCK_HASH_MAP as MH,
  MOCK_GENERATED_PATH,
  MOCK_HASH_PATH,
  MOCK_PATHS,
} from './test-constants.js';

/**
 * Cleans null/undefined/empty values from an object
 * @param {Object} obj
 * @returns {Object}
 */
function cleanObjValues(obj) {
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, !!v && v.length ? v : undefined]));
}

/**
 * Cleans null/undefined key/value pairs from an object
 * @param {Object} obj
 * @returns {Object}
 */
export function cleanObject(obj) {
  return Object.fromEntries(Object.entries(obj).filter(([,v]) => v !== undefined && v !== null));
}

/**
 * Builds a map of all the expected hash values for generated mocks
 * @returns {Object}
 */
export function buildMockHashesMap() {
  const mockHashes = {};

  // build hash list of generated mocks that only generate a single permutation
  for (const mockFile of MOCK_PATHS.SINGLE_PERMUTATION) {
    const mockPath = `${MOCK_GENERATED_PATH}/${mockFile}.json`;
    const mockHashPath = `${MOCK_HASH_PATH}/${mockFile}`;
    const [ expectedFiles = undefined, expectedHashes = undefined ] = existsSync(mockHashPath) ? readFileSync(mockHashPath, 'utf8').split(MOCK_HASH_SPLIT) : [];

    mockHashes[mockPath] = cleanObjValues({
      [MH.foundFiles]: mockPath.substring(mockPath.lastIndexOf('/')+1),
      [MH.foundHashes]: md5(readFileSync(mockPath, 'utf8')),
      [MH.expectedFiles]: expectedFiles,
      [MH.expectedHashes]: expectedHashes,
    });
  }

  // build hash list of generated mocks with multiple permutations
  for (const mockPath of MOCK_PATHS.WITH_PERMUTATIONS) {
    const mockDir = `${MOCK_GENERATED_PATH}/${mockPath}`;
    const mockDirContents = readdirSync(mockDir);
    const mockHashPath = `${MOCK_HASH_PATH}/${mockPath}`;
    const expectedHashMap = existsSync(mockHashPath) ? readFileSync(mockHashPath, 'utf8').split('\n').filter(f => f) : [];

    mockHashes[mockDir] = cleanObjValues({
      [MH.foundFiles]: mockDirContents,
      [MH.foundHashes]: mockDirContents.map(f => md5(readFileSync(path.join(mockDir, f), 'utf8'))),
      [MH.expectedFiles]: cleanArray(expectedHashMap.map(f => f.split(MOCK_HASH_SPLIT)[0])),
      [MH.expectedHashes]: cleanArray(expectedHashMap.map(f => {
        const [ eFile, eHash ] = f.split(MOCK_HASH_SPLIT);
        return eHash ?? eFile.substring(0, eFile.lastIndexOf('.'));
      })),
    });
  }

  return mockHashes;
}
