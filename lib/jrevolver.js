#! /usr/bin/env node
Error.stackTraceLimit = 1000;

import fs from 'fs';
import path from 'path';
import shell from 'shelljs';
import colors from 'colors';
import { getSelfCmd } from './helpers.js';
import { MOCK_FILE_EXTENSION, IGNORE_DIRECTORY_FILE } from './constants.js';
const modulePath = path.dirname(new URL(import.meta.url).pathname);

/**
 * CONSTANTS
 */
const ARGS = {
  node: 0,
  script: 1,
  rootDir: 2,
  outputDir: 3,
  includeDirs: 4 // optional
};

let scriptFile; // eslint-disable-line no-unused-vars
let inputDir;
let outputDir;
let includeDirs;
let mockList;

/**
 * Validate arguments
 */
if (process.argv.length < Object.keys(ARGS).length-1) {
  const errorStr = ['',
    colors.red("ERROR:\tjRevolver.js was invoked incorrectly"),
    colors.yellow("Expected:") + "\tnode {appPath}/jrevolver.js {rootMockDirectory} {...additionalIncludeDirectories*}",
    colors.yellow("Actual:") + `\t\t${getSelfCmd()}`,
  ''].join("\n");

  console.error(errorStr);
  process.exit(1);
} else {
  scriptFile  = process.argv[ARGS.script];
  inputDir    = `${process.cwd()}/${process.argv[ARGS.rootDir]}`;
  outputDir   = `${process.cwd()}/${process.argv[ARGS.outputDir]}`;
  includeDirs = process.argv.slice(ARGS.includeDirs);
}



/**
 * Build list of mocks and invoke generate.js on each one
 */
console.log();
mockList = buildMockList(inputDir);

mockList.forEach(function(filePath) {
  const start = filePath.indexOf(inputDir) + inputDir.length+1;
  const end = filePath.lastIndexOf('/');
  const fileDir = filePath.slice(start, end);
  const mockFile = filePath.substr(filePath.lastIndexOf('/')+1);
  const mockPath = path.resolve([
    inputDir,
    fileDir,
    mockFile
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
        console.warn(colors.yellow(`\nInvalid mock file: ${filePath}\n`));
      }
    }
  });

  return fileList;
}