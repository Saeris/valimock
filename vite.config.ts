import { defineConfig } from "vite-plus";

export default defineConfig({
  // ── Linting (Oxlint) ────────────────────────────────────────────────
  lint: {
    plugins: ["oxc", "typescript", "unicorn", "import", "promise"],
    categories: {
      correctness: "warn"
    },
    env: {
      builtin: true
    },
    rules: {
      "import-x/export": "error",
      "import-x/no-empty-named-blocks": "warn",
      "import-x/no-mutable-exports": "error",
      "import-x/no-named-as-default": "warn",
      "import-x/no-named-as-default-member": "warn",
      "import-x/default": "error",
      "import-x/named": "error",
      "import-x/namespace": "error",
      "import-x/no-absolute-path": "error",
      "import-x/no-cycle": "warn",
      "import-x/no-dynamic-require": "error",
      "import-x/no-self-import": "error",
      "import-x/no-webpack-loader-syntax": "error",
      "import-x/first": ["error", "absolute-first"],
      "import-x/no-anonymous-default-export": "warn",
      "import-x/no-default-export": "warn",
      "import-x/no-duplicates": "error",
      "promise/always-return": "error",
      "promise/catch-or-return": [
        "error",
        {
          terminationMethod: ["catch", "finally"]
        }
      ],
      "promise/no-multiple-resolved": "error",
      "promise/no-nesting": "warn",
      "promise/no-new-statics": "error",
      "promise/no-promise-in-callback": "warn",
      "promise/no-return-in-finally": "error",
      "promise/no-return-wrap": "error",
      "promise/param-names": "error",
      "promise/prefer-await-to-callbacks": "error",
      "promise/prefer-await-to-then": "error",
      "promise/valid-params": "error"
    },
    settings: {
      "import-x/extensions": [".cjs", ".mjs", ".js", ".jsx", ".cts", ".mts", ".ts", ".tsx"],
      "import-x/resolver-next": [
        {
          interfaceVersion: 3,
          name: "eslint-import-resolver-typescript"
        },
        {
          interfaceVersion: 3,
          name: "eslint-plugin-import-x:node"
        }
      ]
    },
    overrides: [
      {
        files: ["**/*.?(m|c)js?(x)"],
        rules: {
          "array-callback-return": [
            "warn",
            {
              allowImplicit: true,
              checkForEach: true
            }
          ],
          "constructor-super": "error",
          "for-direction": "error",
          "getter-return": "error",
          "no-async-promise-executor": "error",
          "no-await-in-loop": "error",
          "no-class-assign": "error",
          "no-compare-neg-zero": "error",
          "no-cond-assign": ["error", "always"],
          "no-const-assign": "error",
          "no-constant-binary-expression": "error",
          "no-constant-condition": "warn",
          "no-constructor-return": "error",
          "no-control-regex": "error",
          "no-debugger": "warn",
          "no-dupe-class-members": "error",
          "no-dupe-else-if": "error",
          "no-dupe-keys": "error",
          "no-duplicate-case": "error",
          "no-duplicate-imports": [
            "error",
            {
              includeExports: true
            }
          ],
          "no-empty-character-class": "error",
          "no-empty-pattern": "error",
          "no-ex-assign": "error",
          "no-fallthrough": "error",
          "no-func-assign": "error",
          "no-import-assign": "error",
          "no-inner-declarations": "error",
          "no-invalid-regexp": "error",
          "no-irregular-whitespace": "error",
          "no-loss-of-precision": "error",
          "no-misleading-character-class": "error",
          "no-new-native-nonconstructor": "warn",
          "no-obj-calls": "error",
          "no-promise-executor-return": "error",
          "no-prototype-builtins": "error",
          "no-self-assign": "error",
          "no-self-compare": "error",
          "no-setter-return": "error",
          "no-sparse-arrays": "error",
          "no-template-curly-in-string": "error",
          "no-this-before-super": "error",
          "no-unassigned-vars": "error",
          "no-undef": "error",
          "no-unexpected-multiline": "off",
          "no-unmodified-loop-condition": "warn",
          "no-unreachable": "error",
          "no-unsafe-finally": "error",
          "no-unsafe-negation": "error",
          "no-unsafe-optional-chaining": "error",
          "no-unused-private-class-members": "warn",
          "no-unused-vars": "warn",
          "no-use-before-define": [
            "error",
            {
              functions: false
            }
          ],
          "no-useless-backreference": "error",
          "use-isnan": "error",
          "valid-typeof": "error",
          "accessor-pairs": "error",
          "arrow-body-style": ["error", "as-needed"],
          "block-scoped-var": "error",
          "capitalized-comments": "off",
          "class-methods-use-this": "off",
          complexity: "off",
          "@typescript-eslint/consistent-return": "off",
          curly: ["error", "multi-line"],
          "default-case": "error",
          "default-case-last": "error",
          "default-param-last": "error",
          "@typescript-eslint/dot-notation": [
            "error",
            {
              allowKeywords: true
            }
          ],
          eqeqeq: ["error", "smart"],
          "func-names": "off",
          "func-style": [
            "error",
            "declaration",
            {
              allowArrowFunctions: true
            }
          ],
          "grouped-accessor-pairs": "error",
          "guard-for-in": "error",
          "id-length": "off",
          "init-declarations": "off",
          "max-classes-per-file": "off",
          "max-depth": "off",
          "max-lines": "off",
          "max-lines-per-function": "off",
          "max-nested-callbacks": "off",
          "max-params": "off",
          "max-statements": "off",
          "new-cap": [
            "error",
            {
              newIsCap: true
            }
          ],
          "no-alert": "error",
          "no-array-constructor": "off",
          "no-bitwise": [
            "error",
            {
              allow: ["~"]
            }
          ],
          "no-caller": "error",
          "no-case-declarations": "error",
          "no-console": "warn",
          "no-continue": "error",
          "no-delete-var": "error",
          "no-div-regex": "error",
          "no-else-return": "error",
          "no-empty": "error",
          "no-empty-function": [
            "error",
            {
              allow: ["arrowFunctions", "constructors"]
            }
          ],
          "no-empty-static-block": "error",
          "no-eq-null": "error",
          "no-eval": "error",
          "no-extend-native": "error",
          "no-extra-bind": "error",
          "no-extra-boolean-cast": "error",
          "no-extra-label": "error",
          "no-global-assign": "error",
          "no-implicit-coercion": "off",
          "no-inline-comments": "off",
          "no-iterator": "error",
          "no-label-var": "error",
          "no-labels": "error",
          "no-lone-blocks": "error",
          "no-lonely-if": "error",
          "no-loop-func": "error",
          "no-magic-numbers": "off",
          "no-multi-assign": "error",
          "no-multi-str": "error",
          "no-negated-condition": "error",
          "no-nested-ternary": "off",
          "no-new": "error",
          "no-new-func": "error",
          "no-new-wrappers": "error",
          "no-nonoctal-decimal-escape": "error",
          "no-object-constructor": "error",
          "no-param-reassign": "error",
          "no-plusplus": "off",
          "no-proto": "error",
          "no-redeclare": "error",
          "no-regex-spaces": "error",
          "no-restricted-globals": "off",
          "no-restricted-imports": "off",
          "no-return-assign": ["error", "always"],
          "no-script-url": "error",
          "no-sequences": "error",
          "no-shadow": "error",
          "no-shadow-restricted-names": "error",
          "no-ternary": "off",
          "no-throw-literal": "error",
          "no-undefined": "error",
          "no-unneeded-ternary": "error",
          "no-unused-expressions": "off",
          "no-unused-labels": "error",
          "no-useless-call": "error",
          "no-useless-catch": "error",
          "no-useless-computed-key": "error",
          "no-useless-concat": "error",
          "no-useless-constructor": "error",
          "no-useless-escape": "error",
          "no-useless-rename": "error",
          "no-useless-return": "error",
          "no-var": "error",
          "no-void": [
            "error",
            {
              allowAsStatement: true
            }
          ],
          "no-warning-comments": "off",
          "no-with": "error",
          "operator-assignment": ["error", "always"],
          "prefer-const": "off",
          "prefer-destructuring": "off",
          "prefer-exponentiation-operator": "error",
          "prefer-numeric-literals": "error",
          "prefer-object-has-own": "error",
          "prefer-object-spread": "error",
          "prefer-promise-reject-errors": "error",
          "prefer-rest-params": "error",
          "prefer-spread": "error",
          "prefer-template": "error",
          radix: "error",
          "require-await": "error",
          "require-yield": "error",
          "sort-imports": "off",
          "sort-keys": "off",
          "sort-vars": "off",
          "symbol-description": "error",
          "vars-on-top": "error",
          yoda: "error",
          "unicode-bom": "off"
        }
      },
      {
        files: ["**/*.{spec,test}.{j,t}s?(x)"],
        rules: {
          "no-console": "off",
          "no-undefined": "off"
        }
      },
      {
        files: ["*.stories.{j,t}s?(x)", "*.config.{js,ts,mjs,mts,cjs,cts}"],
        rules: {
          "import-x/no-default-export": "off",
          "import-x/no-anonymous-default-export": "off"
        }
      },
      {
        files: ["**/*.?(m|c)ts?(x)"],
        rules: {
          "@typescript-eslint/adjacent-overload-signatures": "error",
          "@typescript-eslint/array-type": [
            "error",
            {
              default: "array-simple"
            }
          ],
          "@typescript-eslint/ban-tslint-comment": "error",
          "@typescript-eslint/class-literal-property-style": "off",
          "@typescript-eslint/consistent-generic-constructors": "error",
          "@typescript-eslint/consistent-indexed-object-style": "off",
          "@typescript-eslint/consistent-type-assertions": [
            "error",
            {
              assertionStyle: "as"
            }
          ],
          "@typescript-eslint/consistent-type-definitions": ["error", "interface"],
          "@typescript-eslint/no-confusing-non-null-assertion": "error",
          "@typescript-eslint/no-inferrable-types": [
            "warn",
            {
              ignoreParameters: true,
              ignoreProperties: true
            }
          ],
          "@typescript-eslint/prefer-for-of": "warn",
          "@typescript-eslint/prefer-function-type": "off",
          "@typescript-eslint/ban-ts-comment": "off",
          "@typescript-eslint/consistent-type-imports": "error",
          "@typescript-eslint/explicit-function-return-type": "warn",
          "@typescript-eslint/explicit-module-boundary-types": ["warn"],
          "@typescript-eslint/no-duplicate-enum-values": "error",
          "@typescript-eslint/no-dynamic-delete": "warn",
          "@typescript-eslint/no-empty-object-type": [
            "warn",
            {
              allowInterfaces: "with-single-extends"
            }
          ],
          "@typescript-eslint/no-explicit-any": [
            "warn",
            {
              ignoreRestArgs: true
            }
          ],
          "@typescript-eslint/no-extra-non-null-assertion": "error",
          "@typescript-eslint/no-extraneous-class": "off",
          "@typescript-eslint/no-import-type-side-effects": "error",
          "@typescript-eslint/no-invalid-void-type": "warn",
          "@typescript-eslint/no-misused-new": "error",
          "@typescript-eslint/no-namespace": [
            "error",
            {
              allowDeclarations: true,
              allowDefinitionFiles: true
            }
          ],
          "@typescript-eslint/no-non-null-asserted-nullish-coalescing": "error",
          "@typescript-eslint/no-non-null-asserted-optional-chain": "error",
          "@typescript-eslint/no-non-null-assertion": "off",
          "@typescript-eslint/no-require-imports": "warn",
          "@typescript-eslint/no-restricted-types": "off",
          "@typescript-eslint/no-this-alias": "error",
          "@typescript-eslint/no-unnecessary-parameter-property-assignment": "warn",
          "@typescript-eslint/no-unnecessary-type-constraint": "warn",
          "@typescript-eslint/no-unsafe-declaration-merging": "error",
          "@typescript-eslint/no-unsafe-function-type": "error",
          "@typescript-eslint/no-useless-empty-export": "error",
          "@typescript-eslint/no-wrapper-object-types": "warn",
          "@typescript-eslint/parameter-properties": "off",
          "@typescript-eslint/prefer-as-const": "warn",
          "@typescript-eslint/prefer-enum-initializers": "error",
          "@typescript-eslint/prefer-literal-enum-member": "error",
          "@typescript-eslint/prefer-namespace-keyword": "off",
          "@typescript-eslint/triple-slash-reference": [
            "error",
            {
              types: "prefer-import"
            }
          ],
          "@typescript-eslint/unified-signatures": "off",
          "class-methods-use-this": [
            "warn",
            {
              ignoreOverrideMethods: true,
              ignoreClassesThatImplementAnInterface: "public-fields"
            }
          ],
          "default-param-last": "error",
          "init-declarations": "off",
          "max-params": "off",
          "no-array-constructor": "off",
          "no-dupe-class-members": "error",
          "no-loop-func": "error",
          "no-magic-numbers": "off",
          "no-redeclare": "error",
          "no-restricted-imports": "off",
          "no-shadow": "error",
          "no-unused-expressions": "off",
          "no-unused-vars": [
            "error",
            {
              vars: "local",
              args: "none",
              ignoreRestSiblings: true
            }
          ],
          "no-use-before-define": [
            "error",
            {
              functions: true,
              classes: true
            }
          ],
          "no-useless-constructor": "error"
        }
      },
      {
        files: ["**/*.ts?(x)"],
        rules: {
          "default-param-last": "off",
          "@typescript-eslint/dot-notation": "off",
          "init-declarations": "off",
          "no-array-constructor": "off",
          "no-dupe-class-members": "off",
          "no-duplicate-imports": "off",
          "no-empty-function": "off",
          "no-loop-func": "off",
          "no-loss-of-precision": "off",
          "no-magic-numbers": "off",
          "no-redeclare": "off",
          "no-shadow": "off",
          "no-throw-literal": "off",
          "no-unused-expressions": "off",
          "no-unused-vars": "off",
          "no-use-before-define": "off",
          "no-useless-constructor": "off",
          "require-await": "off"
        }
      },
      {
        files: ["**/*.{spec,test}.{j,t}s?(x)"],
        rules: {
          "@typescript-eslint/explicit-function-return-type": "off"
        }
      },
      {
        files: ["**/*.?(m|c)ts?(x)"],
        rules: {
          "@typescript-eslint/non-nullable-type-assertion-style": "warn",
          "@typescript-eslint/prefer-find": "error",
          "@typescript-eslint/prefer-includes": "error",
          "@typescript-eslint/prefer-nullish-coalescing": [
            "error",
            {
              ignoreConditionalTests: true,
              ignoreMixedLogicalExpressions: true
            }
          ],
          "@typescript-eslint/prefer-optional-chain": "error",
          "@typescript-eslint/prefer-regexp-exec": "error",
          "@typescript-eslint/prefer-string-starts-ends-with": "warn",
          "@typescript-eslint/await-thenable": "error",
          "@typescript-eslint/consistent-type-exports": "off",
          "@typescript-eslint/no-array-delete": "error",
          "@typescript-eslint/no-base-to-string": "error",
          "@typescript-eslint/no-confusing-void-expression": [
            "error",
            {
              ignoreArrowShorthand: true
            }
          ],
          "@typescript-eslint/no-deprecated": "warn",
          "@typescript-eslint/no-duplicate-type-constituents": "error",
          "@typescript-eslint/no-floating-promises": [
            "error",
            {
              ignoreIIFE: true
            }
          ],
          "@typescript-eslint/no-for-in-array": "error",
          "@typescript-eslint/no-meaningless-void-operator": "error",
          "@typescript-eslint/no-misused-promises": "error",
          "@typescript-eslint/no-misused-spread": "error",
          "@typescript-eslint/no-mixed-enums": "error",
          "@typescript-eslint/no-redundant-type-constituents": "error",
          "@typescript-eslint/no-unnecessary-boolean-literal-compare": "warn",
          "@typescript-eslint/no-unnecessary-condition": "warn",
          "@typescript-eslint/no-unnecessary-qualifier": "warn",
          "@typescript-eslint/no-unnecessary-template-expression": "warn",
          "@typescript-eslint/no-unnecessary-type-arguments": "warn",
          "@typescript-eslint/no-unnecessary-type-assertion": "warn",
          "@typescript-eslint/no-unnecessary-type-conversion": "warn",
          "@typescript-eslint/no-unnecessary-type-parameters": "warn",
          "@typescript-eslint/no-unsafe-argument": "off",
          "@typescript-eslint/no-unsafe-assignment": "off",
          "@typescript-eslint/no-unsafe-call": "off",
          "@typescript-eslint/no-unsafe-enum-comparison": "warn",
          "@typescript-eslint/no-unsafe-member-access": "off",
          "@typescript-eslint/no-unsafe-return": "off",
          "@typescript-eslint/no-unsafe-type-assertion": "warn",
          "@typescript-eslint/no-unsafe-unary-minus": "error",
          "@typescript-eslint/prefer-readonly": "off",
          "@typescript-eslint/prefer-readonly-parameter-types": "off",
          "@typescript-eslint/prefer-reduce-type-parameter": "warn",
          "@typescript-eslint/prefer-return-this-type": "error",
          "@typescript-eslint/promise-function-async": [
            "error",
            {
              allowedPromiseNames: ["Thenable"],
              checkArrowFunctions: true,
              checkFunctionDeclarations: true,
              checkFunctionExpressions: true,
              checkMethodDeclarations: true
            }
          ],
          "@typescript-eslint/related-getter-setter-pairs": "warn",
          "@typescript-eslint/require-array-sort-compare": "warn",
          "@typescript-eslint/restrict-plus-operands": "error",
          "@typescript-eslint/restrict-template-expressions": "warn",
          "@typescript-eslint/return-await": "error",
          "@typescript-eslint/strict-boolean-expressions": "off",
          "@typescript-eslint/switch-exhaustiveness-check": "warn",
          "@typescript-eslint/unbound-method": [
            "warn",
            {
              ignoreStatic: true
            }
          ],
          "@typescript-eslint/use-unknown-in-catch-callback-variable": "warn",
          "@typescript-eslint/dot-notation": "off",
          "@typescript-eslint/consistent-return": "off",
          "@typescript-eslint/no-implied-eval": "error",
          "no-throw-literal": "off",
          "@typescript-eslint/only-throw-error": "error",
          "prefer-destructuring": "off",
          "prefer-promise-reject-errors": "off",
          "@typescript-eslint/prefer-promise-reject-errors": "error",
          "require-await": "off",
          "@typescript-eslint/require-await": "error"
        }
      },
      {
        files: ["**/*.{spec,test}.{j,t}s?(x)"],
        rules: {
          "vitest/consistent-test-filename": "off",
          "vitest/consistent-test-it": "error",
          "vitest/expect-expect": [
            "error",
            {
              assertFunctionNames: ["expect", "expect*"]
            }
          ],
          "vitest/max-expects": "off",
          "vitest/max-nested-describe": "off",
          "vitest/no-alias-methods": "warn",
          "vitest/no-commented-out-tests": "warn",
          "vitest/no-conditional-expect": "warn",
          "vitest/no-conditional-in-test": "warn",
          "vitest/no-conditional-tests": "warn",
          "vitest/no-disabled-tests": "warn",
          "vitest/no-duplicate-hooks": "error",
          "vitest/no-focused-tests": "error",
          "vitest/no-hooks": "off",
          "vitest/no-identical-title": "error",
          "vitest/no-import-node-test": "error",
          "vitest/no-interpolation-in-snapshots": "error",
          "vitest/no-large-snapshots": [
            "warn",
            {
              maxSize: 32
            }
          ],
          "vitest/no-mocks-import": "error",
          "vitest/no-restricted-matchers": "off",
          "vitest/no-standalone-expect": "error",
          "vitest/no-test-prefixes": "error",
          "vitest/no-test-return-statement": "error",
          "vitest/prefer-called-with": "warn",
          "vitest/prefer-comparison-matcher": "warn",
          "vitest/prefer-describe-function-title": "off",
          "vitest/prefer-each": "warn",
          "vitest/prefer-equality-matcher": "warn",
          "vitest/prefer-expect-resolves": "warn",
          "vitest/prefer-hooks-in-order": "warn",
          "vitest/prefer-hooks-on-top": "warn",
          "vitest/prefer-lowercase-title": "warn",
          "vitest/prefer-mock-promise-shorthand": "warn",
          "vitest/prefer-spy-on": "warn",
          "vitest/prefer-strict-equal": "off",
          "vitest/prefer-to-be": "off",
          "vitest/prefer-to-be-falsy": "off",
          "vitest/prefer-to-be-object": "warn",
          "vitest/prefer-to-be-truthy": "off",
          "vitest/prefer-to-contain": "warn",
          "vitest/prefer-to-have-length": "warn",
          "vitest/prefer-todo": "warn",
          "vitest/no-restricted-vi-methods": "warn",
          "vitest/prefer-strict-boolean-matchers": "warn",
          "vitest/require-local-test-context-for-concurrent-snapshots": "warn",
          "vitest/require-mock-type-parameters": "warn",
          "vitest/require-to-throw-message": "off",
          "vitest/require-top-level-describe": "error",
          "vitest/valid-describe-callback": "error",
          "vitest/valid-expect": "error"
        },
        plugins: ["vitest"]
      }
    ],
    options: {
      typeAware: true,
      typeCheck: true
    }
  },
  // ── Formatting (Oxfmt) ──────────────────────────────────────────────
  fmt: {
    printWidth: 120,
    tabWidth: 2,
    useTabs: false,
    semi: true,
    singleQuote: false,
    trailingComma: "none",
    bracketSpacing: true,
    jsxBracketSameLine: false,
    sortPackageJson: false,
    ignorePatterns: ["CHANGELOG.md"]
  },
  // ── Builds (tsdown) ─────────────────────────────────────────────────
  pack: {
    entry: [`./src/Valimock.ts`],
    clean: true,
    format: [`esm`],
    dts: true,
    outDir: `./dist`
  },
  // ── Testing (Vitest) ────────────────────────────────────────────────
  test: {
    name: `valimock`,
    globals: true,
    include: ["**/*.{test,spec}.{ts,tsx}"],
    exclude: ["**/node_modules/**", "**/dist/**"],
    environment: "node",
    passWithNoTests: true
  }
});
