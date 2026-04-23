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

  const { part_code, exercise_code, exercise_name } = body ?? {};

  if (!part_code || !exercise_code || !exercise_name) {
    return createResponse(400, {
      error_code: "INVALID_PARAMETER",
      message: "part_code, exercise_code and exercise_name are required"
    });
  }

  logInfo("postExercise request", { part_code, exercise_code, exercise_name });

  try {

    const now = new Date().toISOString();

    await dynamo.send(
      new PutCommand({
        TableName: "exercise_master",
        Item: {
          PK: `PART#${part_code}`,
          SK: `EXERCISE#${exercise_code}`,
          exercise_name,
          created_at: now,
          updated_at: now
        },
        ConditionExpression: "attribute_not_exists(PK) AND attribute_not_exists(SK)"
      })
    );

    logInfo("postExercise success", { part_code, exercise_code });

    return createResponse(200, { status: "success" });

  } catch (error) {

    if (error.name === "ConditionalCheckFailedException") {
      return createResponse(409, {
        error_code: "ALREADY_EXISTS",
        message: "Exercise already exists"
      });
    }

    logError("postExercise failed", error);

    return createResponse(500, {
      error_code: "INTERNAL_SERVER_ERROR",
      message: "Internal Server Error"
    });

  }

};
