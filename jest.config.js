module.exports = {
  preset: 'jest-preset-angular',
  setupFilesAfterEnv: ['<rootDir>/node_modules/jest-preset-angular/build/setup-jest.js'],
  testMatch: ['**/*.spec.ts'],
  globals: {
    'ts-jest': {
      tsConfig: 'tsconfig.spec.json'
    }
  },
  moduleDirectories: ['node_modules']
};
