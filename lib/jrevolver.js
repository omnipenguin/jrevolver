#! /usr/bin/env node
import fs from 'fs';
import path from 'path';
import shell from 'shelljs';
import colors from 'colors';
import { getSelfCmd } from './helpers.js';
import { ICON, MOCK_FILE_EXTENSION, IGNORE_DIRECTORY_FILE } from './constants.js';

Error.stackTraceLimit = 1000;

/**
 * CONSTANTS
 */

// required args
const ARGS = {
  node: 0,
  script: 1,
  rootDir: 2,
  outputDir: 3,
};

// optional args
const OPTIONAL_ARGS = {
  includeDirs: 4, // optional
}

// get module/script name and path
const modulePath = path.dirname(new URL(import.meta.url).pathname);
const scriptRelPath = path.relative(path.basename('./'), process.argv[ARGS.script]);
const scriptFileName = scriptRelPath.substring(scriptRelPath.lastIndexOf('/')+1);

/**
 * Validate arguments
 */
if (process.argv.length < Object.keys(ARGS).length) {
  const errorStr = [
    colors.brightRed(`${ICON.ERROR} ${scriptFileName} was invoked incorrectly`),
    colors.red('  Expected:') + `\tnode ${scriptRelPath} {rootMockDirectory} {outputMockDirectory} {...additionalIncludeDirectories*}`,
    colors.red('  Actual:') + `\t${getSelfCmd()}`,
  ].join("\n");

  console.error(`\n${errorStr}\n`);
  process.exit(1);
}

const scriptFile  = process.argv[ARGS.script]; // eslint-disable-line no-unused-vars
const inputDir    = `${process.cwd()}/${process.argv[ARGS.rootDir]}`;
const outputDir   = `${process.cwd()}/${process.argv[ARGS.outputDir]}`;
// optional args
const includeDirs = process.argv.slice(OPTIONAL_ARGS.includeDirs);



/**
 * Build list of mocks and invoke generate.js on each one
 */
console.log();
const mockList = buildMockList(inputDir);

mockList.forEach(function(filePath) {
  const start = filePath.indexOf(inputDir) + inputDir.length+1;
  const end = filePath.lastIndexOf('/');
  const fileDir = filePath.slice(start, end);
  const mockFile = filePath.substring(filePath.lastIndexOf('/')+1);
  const mockPath = path.resolve([
    inputDir,
    fileDir,
    mockFile,
  ].join('/'));
  const outputPath = path.join(outputDir, fileDir, '/');

  process.env.jInputDir  = path.resolve(inputDir);
  process.env.jOutputDir = path.resolve(outputPath);
  process.env.jIncludeDirs = includeDirs.map(dir => path.resolve(dir));

  shell.exec(`node --no-warnings ${modulePath}/generate.js ${mockPath} ${outputPath}`, { env: process.env });
});
console.log();

/**
 * EXIT
 */
process.exit(0);



/******          ******
 ** HELPER FUNCTIONS **
 ******          ******/

/**
 * Recursively lists all files in a directory
 * @param {String} targetDir
 * @returns {Array}
 */
function buildMockList(targetDir) {
  const files = fs.readdirSync(targetDir);
  let fileList = [];

  files.forEach(function(file) {
    const filePath = `${targetDir}/${file}`;

    if (fs.statSync(filePath).isDirectory()) {
      // ignore directory if it contains a ".ignore" file
      if (!fs.existsSync(`${filePath}/${IGNORE_DIRECTORY_FILE}`)) {
        fileList = fileList.concat(buildMockList(filePath));
      }
    } else {
      if (filePath.slice(-MOCK_FILE_EXTENSION.length) === MOCK_FILE_EXTENSION) {
        fileList.push(filePath);
      } else {
        console.warn(colors.yellow(`\n${ICON.WARNING} Invalid mock file: ${filePath}\n`));
      }
    }
  });

  return fileList;
}