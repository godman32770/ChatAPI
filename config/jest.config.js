// chat-api/jest.config.js
module.exports = {
  testEnvironment: 'node', // Specify the test environment
  testMatch: [
    "**/tests/**/*.test.js" // Look for test files in a 'tests' directory with .test.js suffix
  ],
  // You can add more configurations here if needed, e.g., for code coverage
  // collectCoverage: true,
  // coverageDirectory: 'coverage',
};
