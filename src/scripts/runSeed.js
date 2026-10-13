require("dotenv").config();
const mongo = require("../database/mongo");
const seedDatabase = require("../utils/seedQuestions");
const logger = require("../utils/logger");

(async () => {
  try {
    await mongo.createConnection();
    await seedDatabase();
    logger.info("Manual database seeding finished successfully.");
    process.exit(0);
  } catch (err) {
    logger.error("Manual database seeding failed: " + err.message);
    process.exit(1);
  }
})();
