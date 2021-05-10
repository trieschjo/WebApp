module.exports = connectDB

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

    console.log(`Connected with MongoDP on ${conn.connection.host}`);

  } catch (error) {
    console.log(`Error: ${error.message}`);
    process.exit(1);
  }
};

