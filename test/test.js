#! /usr/bin/env node
import colors from 'colors';
import shell from 'shelljs';
import { permutationSetTestData, permutationSetExpectedData, RESULT_MERGE_TYPE } from './constants.js';
import { buildMockHashesMap } from './test-helpers.js';
import { arrayEquals, isArray, isObjectNotArray, consoleLogObj } from '../lib/helpers.js';
import { MERGE_BEHAVIOR, REPLACE_EMPTY_BEHAVIOR } from '../lib/PermutationSet.js';

Error.stackTraceLimit = 1000;

shell.exec(`npm run clean-generated`);
shell.exec(`npm run generate-mocks`);

// build hash list of generated mocks
const mockHashes = buildMockHashesMap();

console.log(colors.cyan("Testing mock generation:\n"));

// keep track of invalid generated mocks
let numInvalidHashes = 0;

for (const [ mockPath, mockMap ] of Object.entries(mockHashes)) {
  const { found, expected } = mockMap;
  // mock has multiple permutations
  if (isArray(found) && isArray(expected)) {
    if (arrayEquals(found, expected)) {
      console.log(`${mockPath}/* : ` + colors.green(`${found.length}/${expected.length} HASHES MATCH!`));
    } else {
      console.log(`${mockPath}/* : ` + colors.red(`INVALID HASHES! (${found.length} found, ${expected.length} expected)`));
      numInvalidHashes++;
    }
  }
  // mock has only a single permutation
  else {
    if (found === expected) {
      console.log(`${mockPath} : ${colors.green('HASH MATCHES!')}`);
    } else {
      console.log(`${mockPath} : ${colors.red('INVALID HASH!')}`);
      numInvalidHashes++;
    }
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