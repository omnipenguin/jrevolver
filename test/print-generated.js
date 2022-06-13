#! /usr/bin/env node
import colors from 'colors';
import { readFileSync } from 'fs';
import path from 'path';
import shell from 'shelljs';

import { MOCK_FILE_EXTENSION } from '../lib/constants.js';
import { cleanArray, md5 } from '../lib/helpers.js';

/**
 * CONSTANTS
 */

const ARGS = {
  node: 0,
  script: 1,
  mockGenDir: 2,
};

// get module/script name and path
//const modulePath = path.dirname(new URL(import.meta.url).pathname);
//const scriptRelPath = path.relative(path.basename('./'), process.argv[ARGS.script]);
//const scriptFileName = scriptRelPath.substring(scriptRelPath.lastIndexOf('/')+1);
const cwd = process.cwd();
const MOCKGEN_DIR = process.argv[ARGS.mockGenDir];
const MOCKGEN_PATH = path.join(cwd, MOCKGEN_DIR);

const mockgenOutput = `${MOCKGEN_PATH}:\n` + shell.exec(`ls -pR1 ${MOCKGEN_PATH}`, { silent: true }).stdout; // eslint-disable-line prefer-template
const outputByDir = mockgenOutput.split(/\n(?=.+:\n)/gi);
const mockgenByDir = outputByDir.filter(d => d.includes(MOCK_FILE_EXTENSION)).map(d => d.split("\n"));

const mockgenMap = {};
for (const mockDirArr of mockgenByDir) {
  const [ mockDir, ...mockgenDirFiles ] = mockDirArr;
  mockgenMap[mockDir] = cleanArray(mockgenDirFiles.filter(f => f.includes(MOCK_FILE_EXTENSION)));
}

for (const mockDir in mockgenMap) {
  if (mockgenMap.hasOwnProperty(mockDir)) {
    const mockFiles = mockgenMap[mockDir];
    const mockPath = mockDir.substring(0, mockDir.lastIndexOf(':'));
    const fmtMockDir = mockDir.substring(mockDir.lastIndexOf(MOCKGEN_DIR));
    const fmtMockFiles = mockFiles.map(f => `${f}\t\t${md5(readFileSync(path.join(mockPath, f), 'utf8'))}`);

    console.log();
    console.log(colors.cyan(fmtMockDir));
    console.log(fmtMockFiles.join("\n"))
    console.log();
  }
}