require("dotenv").config();
const express = require("express");
const path = require("path");
const router = require("./routes");
const mongo = require("./database/mongo");
const logger = require("./utils/logger");
const cookies = require("cookie-parser");
const cors = require("cors");
const seedDatabase = require("./utils/seedQuestions");

mongo
  .createConnection()
  .then(() => {
    logger.info("SUCCESS CONNECTING TO DATABASE MONGODB");
    seedDatabase();
  })
  .catch((err) => {
    logger.error("FAILED CONNECTING TO MONGODB: " + err.message);
  });

const app = express();

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow local development ports and requests without origin (like Postman/curl)
      if (!origin || origin.includes("localhost") || origin.includes("127.0.0.1")) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    exposedHeaders: ["Content-Type", "Content-Disposition"],
  })
);

app.options("*", cors());
app.use(cookies());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(router);

app.get("/", (req, res) => {
  res.json({
    app: "TOEFL ITP ITB Practice API",
    section: "Section 2: Structure & Written Expression",
    status: "active",
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  logger.error(`Unhandled Error: ${err.message}`);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

module.exports = app;
