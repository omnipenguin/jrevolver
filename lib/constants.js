export const JR_FUNC = {
  map: '--map',
  mapKey: '--mapKey',
  mapContent: '--mapContent',
  mapExclude: '--mapExclude',
  mapAllowOnly: '--mapAllowOnly',
  include: '--include',
  comment: '--comment',
  filename: '--filename',
};

export const PREFIX = {};
for (const [func, funcPropPrefix] of Object.entries(JR_FUNC)) {
  PREFIX[func] = `${funcPropPrefix} `;
}

export const INCLUDE_TYPE = {
  DEFAULTS: 'DEFAULTS',
  PERMUTE: 'PERMUTE',
};

export const ICON = {
  WARNING: '\u26A0', // ⚠
  ERROR:   '\u2716', // ✖
}

export const BASE_APP_DIRECTORY  = 'lib';
export const BASE_MOCK_DIRECTORY = 'mocks';
export const MOCK_FILE_EXTENSION = '.json';
export const IGNORE_DIRECTORY_FILE = '.ignore';
export const OUTPUT_JSON_INDENT = 2;
export const OUTPUT_FILEPATH_MIN_CHARS = 55;
export const MAP_CURRENT_CONTEXT_SENTINEL = '__J_';
export const CONSOLE_LOG_OBJ_ARRAY_EMPTY_INDEX_SENTINEL = '__EMPTY__';
export const CONSOLE_LOG_OBJ_PERMUTATION_SET_START = '__PERMUTATION_SET_START__';
export const CONSOLE_LOG_OBJ_PERMUTATION_SET_END = '__PERMUTATION_SET_END__';