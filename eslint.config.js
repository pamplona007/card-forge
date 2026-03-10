import js from '@eslint/js'
import perfectionist from 'eslint-plugin-perfectionist'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default defineConfig([
  globalIgnores(['dist']),
  {
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
            rules: {
            '@typescript-eslint/no-unused-expressions': 'off',
            '@typescript-eslint/no-unused-vars': 'warn',
            'array-bracket-newline': ['warn', { multiline: true }],
            'array-element-newline': ['warn', 'consistent'],

            'arrow-parens': [
                'error',
                'always',
            ],
            'arrow-spacing': 'warn',
            'block-spacing': 'warn',
            'brace-style': 'warn',
            'comma-dangle': ['warn', 'always-multiline'],
            'comma-spacing': 'warn',

            'computed-property-spacing': 'warn',
            'curly': ['warn', 'all'],
            'default-param-last': 'warn',
            'dot-location': [
                'warn',
                'property',
            ],
            'dot-notation': 'warn',

            'eol-last': [
                'error',
                'always',
            ],
            'eqeqeq': ['error', 'smart'],
            'func-call-spacing': 'warn',
            'function-call-argument-newline': ['warn', 'consistent'],
            'function-paren-newline': [
                'warn',
                'multiline-arguments',
            ],
            'generator-star-spacing': [
                'warn',
                { after: true, before: false },
            ],

            'implicit-arrow-linebreak': 'warn',

            'indent': [
                'error',
                4,
                { SwitchCase: 1 },
            ],
            'key-spacing': 'warn',
            'keyword-spacing': 'warn',

            'linebreak-style': [
                'error',
                'unix',
            ],
            'lines-between-class-members': [
                'warn',
                'always',
                { exceptAfterSingleLine: true },
            ],
            'max-statements-per-line': 'warn',
            'multiline-ternary': ['warn', 'always-multiline'],
            'new-cap': 'warn',
            'newline-per-chained-call': 'warn',
            'no-constant-binary-expression': 'error',
            'no-duplicate-imports': 'off',
            'no-empty': 'warn',
            'no-extra-parens': [
                'warn',
                'functions',
            ],
            'no-extra-semi': 'warn',
            'no-inline-comments': 'warn',
            'no-lone-blocks': 'warn',
            'no-lonely-if': 'warn',
            'no-mixed-operators': 'warn',
            'no-multi-spaces': 'warn',
            'no-multiple-empty-lines': [
                'warn',
                { max: 1, maxBOF: 0 },
            ],
            'no-nested-ternary': 'warn',
            'no-self-compare': 'error',
            'no-template-curly-in-string': 'warn',
            'no-trailing-spaces': 'warn',
            'no-unneeded-ternary': 'warn',
            'no-unreachable-loop': 'error',

            'no-unused-expressions': [
                'warn',
                {
                    allowShortCircuit: true,
                },
            ],
            'no-useless-rename': 'warn',
            'no-var': 'error',
            'no-warning-comments': 'warn',
            'no-whitespace-before-property': 'warn',
            'object-curly-newline': ['warn'],

            'object-curly-spacing': [
                'error',
                'always',
            ],
            'object-property-newline': [
                'warn',
                {
                    allowAllPropertiesOnSameLine: true,
                },
            ],
            'operator-linebreak': [
                'warn',
                'after',
                {
                    overrides: {
                        ':': 'before',
                        '?': 'before',
                    },
                },
            ],
            'padded-blocks': [
                'warn',
                'never',
            ],
            'perfectionist/sort-imports': [
                'warn',
                {
                    customGroups: {
                        type: {
                            react: 'react',
                        },
                        value: {
                            antd: ['antd', 'antd/*', '@antd/*'],
                            react: ['react', 'react-*'],
                        },
                    },
                    groups: [
                        'type',
                        'react',
                        'antd',
                        ['builtin', 'external'],
                        'internal-type',
                        'internal',
                        ['parent-type', 'sibling-type', 'index-type'],
                        ['parent', 'sibling', 'index'],
                        'side-effect',
                        'style',
                        'object',
                        'unknown',
                    ],
                    newlinesBetween: 'always',
                },
            ],
            'prefer-arrow-callback': [
                'warn',
                { allowNamedFunctions: true },
            ],
            'prefer-const': 'warn',
            'prefer-exponentiation-operator': 'warn',
            'prefer-promise-reject-errors': [
                'warn',
                { allowEmptyReject: true },
            ],
            'prefer-rest-params': 'warn',
            'prefer-spread': 'warn',
            'prefer-template': 'warn',
            'quote-props': [
                'warn',
                'consistent-as-needed',
            ],

            'quotes': [
                'error',
                'single',
            ],
            'require-await': 'off',
            'require-yield': 'warn',
            'rest-spread-spacing': 'warn',

            'semi': [
                'error',
                'always',
            ],
            'space-before-blocks': 'warn',
            'space-in-parens': 'warn',
            'space-unary-ops': 'warn',
            'switch-colon-spacing': 'warn',
            'template-curly-spacing': ['warn', 'never'],
            'template-tag-spacing': 'warn',
            'wrap-iife': [
                'warn',
                'any',
            ],
            'yield-star-spacing': [
                'warn',
                'after',
            ],

            'yoda': [
                'error',
                'always',
            ],
        },

  },
  perfectionist.configs['recommended-natural'],
])
