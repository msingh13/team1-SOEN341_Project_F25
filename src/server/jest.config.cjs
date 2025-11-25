// src/server/jest.config.cjs
/** @type {import('jest').Config} */
module.exports = {
    testEnvironment: "node",
    roots: ["<rootDir>"],
    testMatch: ["**/__tests__/**/*.test.js"],
    clearMocks: true,
    // so you can use optional chaining etc without transpile
    transform: {},
  };
  