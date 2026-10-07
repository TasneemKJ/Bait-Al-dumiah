import globals from 'globals';

// Minimal flat config: catch undefined names and unused imports/variables everywhere we write JavaScript.
const rules={
  'no-undef':'error',
  'no-unused-vars':['error',{vars:'local',args:'none',caughtErrors:'none',ignoreRestSiblings:true}],
};
const base={ecmaVersion:2023,sourceType:'module'};
export default [
  {files:['src/**/*.js'],languageOptions:{...base,globals:{...globals.browser}},linterOptions:{reportUnusedDisableDirectives:true},rules},
  // Node test files and build/serve scripts.
  {files:['scripts/**/*.mjs','eslint.config.js'],languageOptions:{...base,globals:{...globals.node}},rules},
  // Node tests stub the few browser globals the shipped modules touch.
  {files:['tests/**/*.mjs'],languageOptions:{...base,globals:{...globals.node,window:'writable',document:'writable'}},rules},
  // tests/art-*-checks.js are evaluated inside the page by scripts/art_check.py.
  {files:['tests/**/*.js'],languageOptions:{...base,globals:{...globals.browser,...globals.node}},rules},
];
