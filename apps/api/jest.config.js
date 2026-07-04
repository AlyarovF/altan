/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/../tsconfig.json',
        // Decorator metadata is needed for any Nest DI used in tests.
        isolatedModules: false,
      },
    ],
  },
  // Unit tests only — keep them DB-free and fast.
  testTimeout: 15000,
};
