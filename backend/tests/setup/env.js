/** Runs before all test files (Jest setupFilesAfterEnv). */
process.env.JWT_SECRET = process.env.JWT_SECRET || "jest-test-jwt-secret-must-be-set-for-auth-tests";
process.env.JWT_EXPIRES_IN = "1d";
