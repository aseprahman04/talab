import { config } from 'dotenv';
import type { Config } from 'jest';

// Load .env.e2e if present (VPS / remote target config).
// Falls back silently when the file doesn't exist (local dev).
config({ path: '.env.e2e', override: false });

const jestConfig: Config = {
  testEnvironment: 'node',
  rootDir: '.',
  testRegex: 'test/e2e/.*\\.e2e\\.ts$',
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.ts$': ['ts-jest', { diagnostics: false }],
  },
  // VPS round-trips can be slow; give each test suite 60 s
  testTimeout: 60000,
};

export default jestConfig;
