/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.test.js"],
  clearMocks: true,
  setupFilesAfterEnv: ["<rootDir>/tests/setup/env.js"],
};
