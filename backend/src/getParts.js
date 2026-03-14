const { createResponse } = require("../utils/response");
const { logInfo, logError } = require("../utils/logger");

exports.handler = async (event) => {

  logInfo("request received", {
    path: event.path,
    method: event.httpMethod
  });

  try {

    const parts = [
      "CHEST",
      "BACK",
      "LEGS",
      "SHOULDER",
      "ARM",
      "ABS"
    ];

    logInfo("parts fetched", { count: parts.length });

    return createResponse(200, {
      parts
    });

  } catch (error) {

    logError("getParts failed", error);

    return createResponse(500, {
      message: "Internal Server Error"
    });

  }

};