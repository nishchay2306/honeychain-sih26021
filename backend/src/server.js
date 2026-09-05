require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const batchesRouter = require("./routes/batches");
const qrRouter = require("./routes/qr");
const uploadsRouter = require("./routes/uploads");
const authRouter = require("./routes/auth");
const { usingMock } = require("./services/batchService");

const app = express();
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", mode: usingMock ? "mock" : "live-chain" });
});

app.use("/api/auth", authRouter);
app.use("/api/batches", batchesRouter);
app.use("/api/qr", qrRouter);
app.use("/api/uploads", uploadsRouter);

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`HoneyChain backend listening on http://localhost:${PORT}`);
  console.log(`Try: curl http://localhost:${PORT}/api/health`);
});
