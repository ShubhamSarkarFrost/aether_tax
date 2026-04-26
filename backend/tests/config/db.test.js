const mongoose = require("mongoose");
const connectDB = require("../../src/config/db");

describe("connectDB", () => {
  it("connects with the given URI", async () => {
    const spy = jest.spyOn(mongoose, "connect").mockResolvedValue(mongoose);
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    await expect(connectDB("mongodb://test-db")).resolves.toBeUndefined();
    expect(spy).toHaveBeenCalledWith("mongodb://test-db");
    logSpy.mockRestore();
    spy.mockRestore();
  });

  it("logs failure and calls process.exit(1) on connect error", async () => {
    const err = new Error("refused");
    const connectSpy = jest.spyOn(mongoose, "connect").mockRejectedValue(err);
    const logSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const exitSpy = jest.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("exit");
    });
    await expect(connectDB("mongodb://bad")).rejects.toThrow("exit");
    expect(logSpy).toHaveBeenCalledWith("MongoDB connection failed:", "refused");
    expect(exitSpy).toHaveBeenCalledWith(1);
    connectSpy.mockRestore();
    logSpy.mockRestore();
    exitSpy.mockRestore();
  });
});
