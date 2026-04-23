const dynamo = require("../services/dynamoClient");
const { PutCommand } = require("@aws-sdk/lib-dynamodb");

const { createResponse } = require("../utils/response");
const { logInfo, logError } = require("../utils/logger");

exports.handler = async (event) => {

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return createResponse(400, {
      error_code: "INVALID_REQUEST_BODY",
      message: "Request body must be valid JSON"
    });
  }

  const { part_code, part_name } = body ?? {};

  if (!part_code || !part_name) {
    return createResponse(400, {
      error_code: "INVALID_PARAMETER",
      message: "part_code and part_name are required"
    });
  }

  logInfo("postPart request", { part_code, part_name });

  try {

    const now = new Date().toISOString();

    await dynamo.send(
      new PutCommand({
        TableName: "parts_master",
        Item: {
          PK: `PART#${part_code}`,
          part_code,
          part_name,
          created_at: now,
          updated_at: now
        },
        ConditionExpression: "attribute_not_exists(PK)"
      })
    );

    logInfo("postPart success", { part_code });

    return createResponse(200, { status: "success" });

  } catch (error) {

    if (error.name === "ConditionalCheckFailedException") {
      return createResponse(409, {
        error_code: "ALREADY_EXISTS",
        message: "Part already exists"
      });
    }

    logError("postPart failed", error);

    return createResponse(500, {
      error_code: "INTERNAL_SERVER_ERROR",
      message: "Internal Server Error"
    });

  }

};
