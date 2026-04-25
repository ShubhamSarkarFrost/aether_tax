const express = require("express");
const cors = require("cors");
const taxRecordsRouter = require("./routes/taxRecords");

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api', taxRecordsRouter);

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Backend is running",
  });
});

module.exports = app;
