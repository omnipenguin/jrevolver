#! /usr/bin/env node
import colors from 'colors';
import shell from 'shelljs';
import {
  FLAG_VALIDATE,
  MOCK_HASH_MAP_KEYS,
  RESULT_MERGE_TYPE,
  permutationSetTestData,
  permutationSetExpectedData,
} from './test-constants.js';
import { cleanObject, buildMockHashesMap } from './test-helpers.js';
import { arrayEquals, cleanArray, excludeArray, isArray, isObjectNotArray, consoleLogObj } from '../lib/helpers.js';
import { MERGE_BEHAVIOR, REPLACE_EMPTY_BEHAVIOR } from '../lib/PermutationSet.js';

Error.stackTraceLimit = 1000;

// if --validate flag is passed, don't regenerate mocks
if (!process.argv.includes(FLAG_VALIDATE)) {
  shell.exec(`yarn clean-generated`);
  shell.exec(`yarn generate-mocks`);
}

// build hash list of generated mocks
const mockHashes = buildMockHashesMap();

console.log(colors.cyan("Testing mock generation:\n"));

// keep track of invalid generated mocks
let numInvalidHashes = 0;

for (const [ mockPath, mockMap ] of Object.entries(mockHashes)) {
  const { foundFiles, foundHashes, expectedFiles, expectedHashes } = mockMap;

  const cleanedMockMap = cleanObject(mockMap);
  const expectedSinglePermutation = Object.entries(cleanedMockMap).filter(([,v]) => !isArray(v) && (typeof v === 'string')).length === MOCK_HASH_MAP_KEYS.length;
  const expectedMultiplePermutations = Object.entries(cleanedMockMap).filter(([,v]) => isArray(v)).length === MOCK_HASH_MAP_KEYS.length;
  const missingData = Object.keys(mockMap).filter(k => !cleanedMockMap.hasOwnProperty(k));

  // mock has only a single permutation
  if (expectedSinglePermutation) {
    const hashesMatch = (foundHashes === expectedHashes);
    const fileNamesMatch = (foundFiles === expectedFiles);

    if (hashesMatch) {
      if (fileNamesMatch) {
        console.log(`${mockPath} : ${colors.green('HASH MATCHES!')}`);
      } else {
        console.log(`${mockPath} : ${colors.green('VALID HASH')}, ${colors.red('INVALID FILENAME!')}`);
        numInvalidHashes++;
      }
    } else {
      if (fileNamesMatch) {
        console.log(`${mockPath} : ${colors.green('VALID FILENAME')}, ${colors.red('INVALID HASH!')}`);
        numInvalidHashes++;
      } else {
        console.log(`${mockPath} : ${colors.red('INVALID HASH AND FILENAME!')}`);
        numInvalidHashes++;
      }
    }
  }
  // mock has multiple permutations
  else if (expectedMultiplePermutations) {
    const hashesMatch = arrayEquals(foundHashes, expectedHashes);
    const fileNamesMatch = arrayEquals(foundFiles, expectedFiles);

    const invalidHashes = excludeArray(...[ foundHashes, expectedHashes ].sort((a, b) => b.length - a.length));
    const invalidFileNames = excludeArray(...[ foundFiles, expectedFiles ].sort((a, b) => b.length - a.length));

    const hashesRatio = `${foundHashes.length}/${expectedHashes.length}`;
    const filesRatio = `${foundFiles.length}/${expectedFiles.length}`;

    const hashesMatchMsg = `${hashesRatio} HASHES MATCH!`;
    const hashesValidMsg = `${hashesRatio} VALID HASHES`;
    const filesValidMsg = `${filesRatio} VALID FILENAMES`;

    const hashText = invalidHashes.length > 1 ? 'HASHES' : 'HASH';
    const fileNameText = invalidFileNames.length > 1 ? 'FILENAMES' : 'FILENAME';

    const invalidHashesMsg = `${invalidHashes.length} INVALID ${hashText} (${foundHashes.length} found, ${expectedHashes.length} expected)`;
    const invalidFileNamesMsg = `${invalidFileNames.length} INVALID ${fileNameText} (${foundFiles.length} found, ${expectedFiles.length} expected)`;

    if (hashesMatch) {
      if (fileNamesMatch) {
        console.log(`${mockPath}/* : ${colors.green(hashesMatchMsg)}`);
      } else {
        const hashesFilesOutput = cleanArray([
          (foundHashes.length || expectedHashes.length) ? colors.green(hashesValidMsg) : '',
          colors.red(invalidFileNamesMsg),
        ]).join(', ');

        console.log(`${mockPath}/* : ${hashesFilesOutput}`);
        numInvalidHashes++;
      }
    } else {
      if (fileNamesMatch) {
        const filesHashesOutput = cleanArray([
          (foundFiles.length || expectedFiles.length) ? colors.green(filesValidMsg) : '',
          colors.red(invalidHashesMsg),
        ]).join(', ');

        console.log(`${mockPath}/* : ${filesHashesOutput}`);
        numInvalidHashes++;
      } else {
        console.log(`${mockPath}/* : ${colors.red(invalidHashesMsg)}, ${colors.red(invalidFileNamesMsg)}`);
        numInvalidHashes++;
      }
    }
  }
  // ERROR: invalid test data detected
  else if (missingData.length) {
    console.log(`${mockPath} : ` + colors.red(`INVALID TEST DATA! (missing ${missingData.join(', ')})`));
    numInvalidHashes++;
  }
}

// Test PermutationSet merge functionality
console.log(colors.cyan("\nTesting PermutationSet:\n"));

// setup test data
let { setA, setB, setC, setD } = permutationSetTestData();

const _results = {};
const results = new Proxy(_results, {
  set(target, name, value, receiver) {
    ({ setA, setB, setC, setD } = permutationSetTestData());
    return Reflect.set(target, name, value, receiver);
  },
});

const mergeOptions = {
  mergeReplace: { mergeBehavior: MERGE_BEHAVIOR.MERGE_REPLACE },
  replace: { mergeBehavior: MERGE_BEHAVIOR.REPLACE },
  replaceDontReplaceWithEmpty: {
    mergeBehavior: MERGE_BEHAVIOR.REPLACE,
    replaceEmptyBehavior: REPLACE_EMPTY_BEHAVIOR.DONT_REPLACE_WITH_EMPTY,
  },
};

// test mergePermutations() functionality
results.mergeAdd1 = setA.mergePermutations(setB);
results.mergeAdd2 = setB.mergePermutations(setA);
results.mergeAdd3 = setC.mergePermutations(setD);
results.mergeReplace1 = setA.mergePermutations(setB, mergeOptions.mergeReplace);
results.mergeReplace2 = setC.mergePermutations(setB, mergeOptions.mergeReplace);
results.mergeReplace3 = setC.mergePermutations(setD, mergeOptions.mergeReplace);
results.replace1 = setA.mergePermutations(setB, mergeOptions.replace);
results.replace2 = setC.mergePermutations(setB, mergeOptions.replace);
results.replace3 = setC.mergePermutations(setD, mergeOptions.replace);
results.replaceDontReplaceWithEmpty1 = setA.mergePermutations(setB, mergeOptions.replaceDontReplaceWithEmpty);
results.replaceDontReplaceWithEmpty2 = setC.mergePermutations(setB, mergeOptions.replaceDontReplaceWithEmpty);
results.replaceDontReplaceWithEmpty3 = setC.mergePermutations(setD, mergeOptions.replaceDontReplaceWithEmpty);

// keep track of invalid merges
let numInvalidMerges = 0;

for (const [resultKey, result] of Object.entries(results)) {
  const resultMergeType = isObjectNotArray(RESULT_MERGE_TYPE[resultKey]) ? RESULT_MERGE_TYPE[resultKey] : { mergeBehavior: RESULT_MERGE_TYPE[resultKey] };
  const mergeBehaviorString = Object.values(resultMergeType).join(', ');
  const expectedData = permutationSetExpectedData();

  if (JSON.stringify(result.permutations) === JSON.stringify(expectedData[resultKey]?.permutations)) {
    console.log(`${resultKey} [${mergeBehaviorString}]: ${colors.green('SET MERGE MATCHES!')}`);
  } else {
    console.log(`${resultKey} [${mergeBehaviorString}]: ${colors.red('INVALID SET MERGE!')}`);
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