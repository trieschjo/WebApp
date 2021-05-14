const config = require("config");
const colors = require("colors");
const express = require("express");
const connectDB = require("./config/db");

const app = express();

connectDB();
app.use(express.json({extended: false}))

/*app.use(express.multer --> sinnvoll wenn mit FileUploads gearbeitet wird)*/
 
app.use("/api/users", require("./routes/api/users"));
app.use("/api/profiles", require("./routes/api/profiles"));
app.use("/api/auth", require("./routes/api/auth"));

const PORT = config.get("PORT");

app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}!`);
});
