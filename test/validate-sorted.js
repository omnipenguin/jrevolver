#! /usr/bin/env node
import colors from 'colors';
import fs from 'fs';
import path from 'path';
import shell from 'shelljs';
import sortKeysRecursive from 'sort-keys-recursive';
import { ICON } from '../lib/constants.js';
import { MOCK_FILE_EXTENSION, MOCK_GENERATED_PATH } from './test-constants.js'
import { cleanUndefined, getSelfCmd, md5 } from '../lib/helpers.js';

/**
 * CONSTANTS
 */

// required args
const ARGS = {
  node: 0,
  script: 1,
};

// optional args
const OPTIONAL_ARGS = {
  currentMockGenDir: 2,
  oldMockGenDir: 3,
  oldSortedMockGenDir: 4,
};

// get script name and path
const scriptRelPath = path.relative(path.basename('./'), process.argv[ARGS.script]);
const scriptFileName = scriptRelPath.substring(scriptRelPath.lastIndexOf('/')+1);

// default arguments
const mockGenDir = process.argv[OPTIONAL_ARGS.currentMockGenDir] ?? MOCK_GENERATED_PATH;
const mockGenPath = mockGenDir.substring(0, mockGenDir.lastIndexOf('/'));
// optional default arguments
const oldMockGenDir = process.argv[OPTIONAL_ARGS.oldMockGenDir] ?? path.join(mockGenPath, '_mockgen');
const oldSortedMockGenDir = process.argv[OPTIONAL_ARGS.oldSortedMockGenDir] ?? path.join(mockGenPath, '_mockgen__sorted');

// check if mock directories exist
const mockGenDirExists = fs.existsSync(mockGenDir);
const oldMockGenDirExists = fs.existsSync(oldMockGenDir);
const oldSortedMockGenDirExists = fs.existsSync(oldSortedMockGenDir);

/**
 * Validate arguments
 */
if (
  process.argv.length < Object.keys(ARGS).length ||
  !mockGenDirExists ||
  !oldMockGenDirExists ||
  !oldSortedMockGenDirExists
) {
  const isDirMissingErr = (dirExists, dirArg, dirPath) =>
    !dirExists ? colors.yellow(`  ${dirArg} `) + colors.brightYellow(`"${dirPath}"`) + colors.yellow(' does not exist') : undefined;

  const errorStr = cleanUndefined([
    colors.brightRed(`${ICON.ERROR} ${scriptFileName} was invoked incorrectly`),
    colors.red('  Expected:') + `\tnode ${scriptRelPath} {currentMockGenDir} {oldMockGenDir} {oldSortedMockGenDir}`,
    colors.red('  Actual:') + `\t${getSelfCmd()}`,
    '',
    isDirMissingErr(mockGenDirExists, '{currentMockGenDir}', mockGenDir),
    isDirMissingErr(oldMockGenDirExists, '{oldMockGenDir}', oldMockGenDir),
    isDirMissingErr(oldSortedMockGenDirExists, '{oldSortedMockGenDir}', oldSortedMockGenDir),
  ]).join("\n");

  console.error(`\n${errorStr}\n`);
  process.exit(1);
}

/**
 * Recursively lists all the files in a directory
 * @param {String} dir
 * @param {Array} fileArr
 * @returns {Array}
 */
function listMocks(dir, fileArr = []) {
  fs.readdirSync(dir).forEach(file => {
    const absolutePath = path.join(dir, file);
    if (fs.statSync(absolutePath).isDirectory()) {
      return listMocks(absolutePath, fileArr);
    } else {
      return fileArr.push(absolutePath);
    }
  });
}

const unsortedOldMockFiles = [];
listMocks(path.relative(process.cwd(), oldMockGenDir), unsortedOldMockFiles);

const currentMockFiles = [];
listMocks(path.relative(process.cwd(), mockGenDir), currentMockFiles);

shell.rm('-rf', path.join(process.cwd(), oldSortedMockGenDir));

for (const mockFilePath of unsortedOldMockFiles) {
  const baseDir = mockFilePath.substring(0, mockFilePath.indexOf(oldMockGenDir) - 1);
  const relMockDir = mockFilePath.substring(mockFilePath.indexOf(oldMockGenDir) + oldMockGenDir.length + 1);
  const mockDir = relMockDir.substring(0, relMockDir.lastIndexOf('/'));
  const mockFileName = mockFilePath.substring(mockFilePath.lastIndexOf('/') + 1);
  const mockData = JSON.parse(fs.readFileSync(mockFilePath));
  const sortedData = sortKeysRecursive(mockData);
  const formattedJson = JSON.stringify(sortedData, null, 2);
  const newMockDir = path.join(baseDir, oldSortedMockGenDir, mockDir);

  const newMockFileName = /^[a-f0-9]{32}\.json$/gi.test(mockFileName) ? `${md5(formattedJson)}${MOCK_FILE_EXTENSION}` : mockFileName;
  const newMockPath = `${newMockDir}/${newMockFileName}`;

  shell.mkdir('-p', newMockDir);

  try {
    fs.writeFileSync(newMockPath, formattedJson);
  } catch (e) {
    throw e;
  }
}

const sortedOldMockFiles = [];
listMocks(path.join(process.cwd(), oldSortedMockGenDir), sortedOldMockFiles);

const newCurrentMockFiles = [];

for (const mockFilePath of currentMockFiles) {
  const relMockDir = mockFilePath.substring(mockFilePath.indexOf(mockGenDir) + mockGenDir.length + 1);
  const mockDir = relMockDir.substring(0, relMockDir.lastIndexOf('/'));
  const mockFileName = mockFilePath.substring(mockFilePath.lastIndexOf('/') + 1);
  const mockRelPath = `${mockDir}/${mockFileName}`;

  const foundSortedOldMockFile = sortedOldMockFiles.find(f => f.includes(mockRelPath));
  const sortedOldMockFileIndex = sortedOldMockFiles.findIndex(f => f.includes(mockRelPath));
  if (foundSortedOldMockFile) {
    sortedOldMockFiles.splice(sortedOldMockFileIndex, 1);
  } else {
    newCurrentMockFiles.push(mockFilePath);
  }
}

console.log(colors.cyan("\nOld mock files which are different:\n"));
console.log(sortedOldMockFiles.length ? sortedOldMockFiles : colors.green('None!'));
console.log();
console.log(colors.cyan("New generated mock files:\n"));
console.log(newCurrentMockFiles.length ? newCurrentMockFiles : colors.green('None!'));
console.log();