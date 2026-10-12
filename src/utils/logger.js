require('dotenv').config()
const format = require('date-fns/format')
const logger = function () { }

logger.prototype.info = function (logText) {
    console.log(`[${format(new Date(), "dd-MM-yyyy HH:mm:ss")}] INFO: ${logText}`)
}

logger.prototype.error = function (logText) {
    logText = process.env.NODE_ENV !== 'production' ? logText.stack : logText.message
    console.log(`[${format(new Date(), "dd-MM-yyyy HH:mm:ss")}] ERROR: ${logText instanceof Error ? logText.message : logText}`)
}

module.exports = new logger()