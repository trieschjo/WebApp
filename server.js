const config = require("config)");
const express = require("express");
const connectDB = require("./config/db");

const app = express();

connectDB();

app.get("/api/webapp", (req, res) => {
  res.send("API running...");
});

const PORT = config.get("PORT");

app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}!`);
});