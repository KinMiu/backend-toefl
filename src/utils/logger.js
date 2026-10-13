require('dotenv').config()
const format = require('date-fns/format')
const logger = function () { }

logger.prototype.info = function (logText) {
    console.log(`[${format(new Date(), "dd-MM-yyyy HH:mm:ss")}] INFO: ${logText}`)
}

logger.prototype.warn = function (logText) {
    console.log(`[${format(new Date(), "dd-MM-yyyy HH:mm:ss")}] WARN: ${logText}`)
}

logger.prototype.error = function (logText) {
    const msg = logText instanceof Error ? (process.env.NODE_ENV !== 'production' ? logText.stack : logText.message) : logText
    console.log(`[${format(new Date(), "dd-MM-yyyy HH:mm:ss")}] ERROR: ${msg}`)
}

logger.prototype.debug = function (logText) {
    console.log(`[${format(new Date(), "dd-MM-yyyy HH:mm:ss")}] DEBUG: ${logText}`)
}

module.exports = new logger()