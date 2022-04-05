const DISABLED = 0;
const WARN = 1;
const ERROR = 2;

module.exports = {
  env: {
    node: true,
    es6: true,
  },
  globals: {
    document: true,
    window: true,
  },
  parser: 'babel-eslint',
  parserOptions: {
    ecmaVersion: 6,
    sourceType: 'module',
    ecmaFeatures: {
      impliedStrict: false,
      legacyDecorators: true,
    },
  },
  plugins: [
    'import',
  ],
  rules: {
    'array-callback-return': ERROR,
    'block-scoped-var': WARN,
    'camelcase': [ERROR, {
      'properties': 'never',
    }],
    'comma-dangle': [WARN, 'always-multiline'],
    'complexity': DISABLED,
    'consistent-this': [DISABLED, 'self'],
    'curly': [WARN, 'multi-line'],
    'dot-notation': [DISABLED, {
      'allowKeywords': true,
    }],
    'eqeqeq': WARN,
    'global-strict': DISABLED,
    'guard-for-in': WARN,
    'import/first': ERROR,
    'import/newline-after-import': ERROR,
    'import/no-duplicates': ERROR,
    'max-depth': DISABLED,
    'max-params': DISABLED,
    'max-statements': DISABLED,
    'new-cap': [ERROR, {
      'newIsCap': true,
      'capIsNew': false,
    }],
    'no-array-constructor': ERROR,
    'no-bitwise': WARN,
    'no-caller': ERROR,
    'no-cond-assign': DISABLED,
    'no-const-assign': ERROR,
    'no-debugger': DISABLED,
    'no-empty': DISABLED,
    'no-empty-pattern': WARN,
    'no-eval': ERROR,
    'no-iterator': DISABLED,
    'no-loop-func': DISABLED,
    'no-multi-str': DISABLED,
    'no-new': DISABLED,
    'no-new-object': ERROR,
    'no-plusplus': DISABLED,
    'no-proto': DISABLED,
    'no-script-url': DISABLED,
    'no-shadow': DISABLED,
    'no-undef': ERROR,
    'no-unused-vars': [ERROR, {
      'vars': 'all',
      'args': 'after-used',
    }],
    'no-use-before-define': [ERROR, 'nofunc'],
    'no-useless-escape': WARN,
    'object-shorthand': ERROR,
    'prefer-const': WARN,
    'prefer-destructuring': [WARN, {
      'array': false,
    }],
    'prefer-template': WARN,
    'spaced-comment': [DISABLED, 'always', {
      'markers': ['global'],
    }],
    'strict': DISABLED,
    'require-jsdoc': WARN,
    'valid-jsdoc': [DISABLED, {
      'requireReturn': false,
    }],
    'wrap-iife': [WARN, 'inside'],
  },
};
