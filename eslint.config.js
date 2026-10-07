import globals from 'globals';

// Minimal flat config: catch undefined names and unused imports in the shipped source.
export default [
  {
    files:['src/**/*.js'],
    languageOptions:{ecmaVersion:2023,sourceType:'module',globals:{...globals.browser}},
    linterOptions:{reportUnusedDisableDirectives:true},
    rules:{
      'no-undef':'error',
      'no-unused-vars':['error',{vars:'local',args:'none',caughtErrors:'none',ignoreRestSiblings:true}],
    },
  },
];
