require("dotenv").config();

const http = require("http");
const logger = require("./src/utils/logger");
const app = require("./src/app");

const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  logger.info(`TOEFL ITP ITB SERVER RUNNING ON PORT ${PORT}`);
});
