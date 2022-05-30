export const JR_FUNC = {
  map: '--map',
  mapZipper: '--mapZipper',
  mapKey: '--mapKey',
  mapContent: '--mapContent',
  mapExclude: '--mapExclude',
  mapAllowOnly: '--mapAllowOnly',
  include: '--include',
  comment: '--comment',
  filename: '--filename',
};

const flippedFunctions = Object.fromEntries(Object.entries(JR_FUNC).map(kvp => kvp.reverse()));
const copyFunctions = (newFunctionMap, cpyFuncs) => cpyFuncs.forEach(f => newFunctionMap[flippedFunctions[f]] = f);

export const JR_MAP_FUNCTIONS = {};
copyFunctions(JR_MAP_FUNCTIONS, [ JR_FUNC.map, JR_FUNC.mapZipper ]);

export const PREFIX = {};
for (const [func, funcPropPrefix] of Object.entries(JR_FUNC)) {
  PREFIX[func] = `${funcPropPrefix} `;
}

export const INCLUDE_TYPE = {
  DEFAULTS: 'DEFAULTS',
  OVERRIDES: 'OVERRIDES',
  PERMUTE: 'PERMUTE',
};

export const ICON = {
  WARNING: '\u26A0', // ⚠
  ERROR:   '\u2716', // ✖
};

export const BASE_APP_DIRECTORY  = 'lib';
export const BASE_MOCK_DIRECTORY = 'mocks';
export const MOCK_FILE_EXTENSION = '.json';
export const IGNORE_DIRECTORY_FILE = '.ignore';
export const OUTPUT_JSON_INDENT = 2;
export const OUTPUT_FILEPATH_MIN_CHARS = 55;
export const MAP_CURRENT_CONTEXT_SENTINEL = '__J_';
export const CLOBJ_ARRAY_EMPTY_INDEX_SENTINEL = '__EMPTY__';
export const CLOBJ_PERMUTATION_SET_START_SENTINEL = '__PERMUTATION_SET_START__';
export const CLOBJ_PERMUTATION_SET_END_SENTINEL = '__PERMUTATION_SET_END__';
export const CLOBJ_PERMUTATION_SET_START = '<PermutationSet> <[';
export const CLOBJ_PERMUTATION_SET_END = ']>';