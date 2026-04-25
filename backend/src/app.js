const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const taxRecordsRouter = require("./routes/taxRecords");
const authRouter = require("./routes/auth.routes");
const organizationsRouter = require("./routes/organizations.routes");
const jurisdictionsRouter = require("./routes/jurisdictions.routes");
const jurisdictionalRulesRouter = require("./routes/jurisdictionalRules.routes");
const transactionsRouter = require("./routes/transactions");
const taxExposuresRouter = require("./routes/taxExposures.routes");
const dashboardRouter = require("./routes/dashboard");
const { optionalAuth } = require("./middleware/auth.middleware");

const app = express();

app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

app.use("/api/auth", authRouter);
app.use("/api/organizations", organizationsRouter);
app.use("/api/jurisdictions", jurisdictionsRouter);
app.use("/api/jurisdictional-rules", jurisdictionalRulesRouter);
app.use("/api", taxRecordsRouter);
app.use("/api", optionalAuth, transactionsRouter);
app.use("/api", optionalAuth, taxExposuresRouter);
app.use("/api", optionalAuth, dashboardRouter);

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Backend is running",
  });
});

module.exports = app;
