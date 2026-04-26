const path = require("path");
const base = require("./jest.config.cjs");

/** Jest HTML report at repo root: <repo>/test-reports/backend/index.html */
const reportDir = path.join(__dirname, "..", "test-reports", "backend");

module.exports = {
  ...base,
  reporters: [
    "default",
    [
      "jest-html-reporters",
      {
        publicPath: reportDir,
        filename: "index.html",
        pageTitle: "Aether Tax — Backend (Jest)",
        openReport: false,
        includeFailureMsg: true,
        includeConsoleLog: false,
        expand: true,
      },
    ],
  ],
};
