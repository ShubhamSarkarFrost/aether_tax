const express = require("express");
const cors = require("cors");
const taxRecordsRouter = require("./routes/taxRecords");
const transactionsRouter = require("./routes/transactions");
const exposuresRouter = require("./routes/exposures");
const dashboardRouter = require("./routes/dashboard");

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api', taxRecordsRouter);
app.use('/api', transactionsRouter);
app.use('/api', exposuresRouter);
app.use('/api', dashboardRouter);

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Backend is running",
  });
});

module.exports = app;
