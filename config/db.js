const mongoose = require("mongoose");
const config = require("config");

const db = config.get("mongoURI");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(db, {
        useNewUrlParser :true,
        useUnifiedTopology :true,
        useCreateIndex :true,
        useFindAndModify :false,

    });

    console.log(`Connected with MongoDB on ${conn.connection.host}`.green.italic);

  } catch (error) {
    console.log(`Error: ${error.message}`.red.bold);
    process.exit(1);
  }
};

module.exports = connectDB
