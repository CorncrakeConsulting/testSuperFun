module.exports = {
  default: {
    requireModule: ['ts-node/register'],
    require: ['tests/step-definitions/**/*.ts', 'tests/support/**/*.ts'],
    format: ['progress', 'html:cucumber-report.html'],
    formatOptions: { snippetInterface: 'async-await' },
    parallel: 2
  },
  headed: {
    requireModule: ['ts-node/register'],
    require: ['tests/step-definitions/**/*.ts', 'tests/support/**/*.ts'],
    format: ['progress'],
    formatOptions: { snippetInterface: 'async-await' },
    parallel: 1
  }
};
