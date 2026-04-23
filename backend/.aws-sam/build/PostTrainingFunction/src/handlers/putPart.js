const dynamo = require("../services/dynamoClient");
const { GetCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");

const { createResponse } = require("../utils/response");
const { logInfo, logError } = require("../utils/logger");

exports.handler = async (event) => {

  const part_code = event.pathParameters?.part_code;

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return createResponse(400, {
      error_code: "INVALID_REQUEST_BODY",
      message: "Request body must be valid JSON"
    });
  }

  const { part_name } = body ?? {};

  if (!part_code || !part_name) {
    return createResponse(400, {
      error_code: "INVALID_PARAMETER",
      message: "part_code and part_name are required"
    });
  }

  logInfo("putPart request", { part_code, part_name });

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

    const now = new Date().toISOString();

    await dynamo.send(
      new UpdateCommand({
        TableName: "parts_master",
        Key: { PK: `PART#${part_code}` },
        UpdateExpression: "SET part_name = :part_name, updated_at = :updated_at",
        ExpressionAttributeValues: {
          ":part_name": part_name,
          ":updated_at": now
        }
      })
    );

    logInfo("putPart success", { part_code });

    return createResponse(200, { status: "success" });

  } catch (error) {

    logError("putPart failed", error);

    return createResponse(500, {
      error_code: "INTERNAL_SERVER_ERROR",
      message: "Internal Server Error"
    });

  }

};
