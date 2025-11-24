/**
 * Jest Configuration for Flow Tests
 */

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/../../$1',
  },
  verbose: true,
  collectCoverageFrom: [
    '../../lib/**/*.ts',
    '../../app/api/**/*.ts',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  coverageDirectory: './coverage',
  testTimeout: 30000, // 30 seconds per test (API calls can be slow)
};
