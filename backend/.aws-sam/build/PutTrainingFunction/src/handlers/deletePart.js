const dynamo = require("../services/dynamoClient");
const { GetCommand, DeleteCommand } = require("@aws-sdk/lib-dynamodb");

const { createResponse } = require("../utils/response");
const { logInfo, logError } = require("../utils/logger");

exports.handler = async (event) => {

  const part_code = event.pathParameters?.part_code;

  if (!part_code) {
    return createResponse(400, {
      error_code: "INVALID_PARAMETER",
      message: "part_code is required"
    });
  }

  logInfo("deletePart request", { part_code });

  try {

    const existing = await dynamo.send(
      new GetCommand({ TableName: "parts_master", Key: { PK: `PART#${part_code}` } })
    );

    if (!existing.Item) {
      return createResponse(404, {
        error_code: "NOT_FOUND",
        message: "Part not found"
      });
    }

    await dynamo.send(
      new DeleteCommand({ TableName: "parts_master", Key: { PK: `PART#${part_code}` } })
    );

    logInfo("deletePart success", { part_code });

    return createResponse(200, { status: "success" });

  } catch (error) {

    logError("deletePart failed", error);

    return createResponse(500, {
      error_code: "INTERNAL_SERVER_ERROR",
      message: "Internal Server Error"
    });

  }

};
