require("dotenv").config();
const mongoose = require("mongoose");
const logger = require("../utils/logger");

const mongoURL =
  process.env.MONGO_URI ||
  (process.env.NODE_ENV === "production" ? process.env.MONGO_PROD : process.env.MONGO_DEV) ||
  "mongodb://127.0.0.1:27017/toefl_itb";

const createConnection = async () => {
  mongoose.set("strictQuery", false);
  await mongoose.connect(mongoURL);
  logger.info(`CONNECTED TO MONGODB: ${mongoURL}`);
};

module.exports = {
  createConnection,
  mongoURL,
};
