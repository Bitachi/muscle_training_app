const dynamo = require("../services/dynamoClient");
const { GetCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");

const { createResponse } = require("../utils/response");
const { logInfo, logError } = require("../utils/logger");

exports.handler = async (event) => {

  const { part_code, exercise_code } = event.pathParameters ?? {};

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return createResponse(400, {
      error_code: "INVALID_REQUEST_BODY",
      message: "Request body must be valid JSON"
    });
  }

  const { exercise_name } = body ?? {};

  if (!part_code || !exercise_code || !exercise_name) {
    return createResponse(400, {
      error_code: "INVALID_PARAMETER",
      message: "part_code, exercise_code and exercise_name are required"
    });
  }

  const pk = `PART#${part_code}`;
  const sk = `EXERCISE#${exercise_code}`;

  logInfo("putExercise request", { pk, sk, exercise_name });

  try {

    const existing = await dynamo.send(
      new GetCommand({ TableName: "exercise_master", Key: { PK: pk, SK: sk } })
    );

    if (!existing.Item) {
      return createResponse(404, {
        error_code: "NOT_FOUND",
        message: "Exercise not found"
      });
    }

    const now = new Date().toISOString();

    await dynamo.send(
      new UpdateCommand({
        TableName: "exercise_master",
        Key: { PK: pk, SK: sk },
        UpdateExpression: "SET exercise_name = :exercise_name, updated_at = :updated_at",
        ExpressionAttributeValues: {
          ":exercise_name": exercise_name,
          ":updated_at": now
        }
      })
    );

    logInfo("putExercise success", { pk, sk });

    return createResponse(200, { status: "success" });

  } catch (error) {

    logError("putExercise failed", error);

    return createResponse(500, {
      error_code: "INTERNAL_SERVER_ERROR",
      message: "Internal Server Error"
    });

  }

};
