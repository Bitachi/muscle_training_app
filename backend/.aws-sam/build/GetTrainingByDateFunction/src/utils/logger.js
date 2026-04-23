function logInfo(message, data = {}) {
  console.log(JSON.stringify({
    level: "INFO",
    message,
    ...data
  }));
}

function logError(message, error) {
  console.error(JSON.stringify({
    level: "ERROR",
    message,
    errorMessage: error.message,
    stack: error.stack
  }));
}

module.exports = {
  logInfo,
  logError
};