const dynamo = require("../services/dynamoClient");
const { ScanCommand } = require("@aws-sdk/lib-dynamodb");

const { createResponse } = require("../utils/response");
const { logInfo, logError } = require("../utils/logger");

exports.handler = async (event) => {

  logInfo("getParts request");

  try {

    const result = await dynamo.send(
      new ScanCommand({ TableName: "parts_master" })
    );

    const parts = (result.Items ?? [])
      .sort((a, b) => a.part_code.localeCompare(b.part_code))
      .map((item) => ({
        part_code: item.part_code,
        part_name: item.part_name
      }));

    logInfo("getParts success", { count: parts.length });

    return createResponse(200, { parts });

  } catch (error) {

    logError("getParts failed", error);

    return createResponse(500, {
      error_code: "INTERNAL_SERVER_ERROR",
      message: "Internal Server Error"
    });

  }

};
