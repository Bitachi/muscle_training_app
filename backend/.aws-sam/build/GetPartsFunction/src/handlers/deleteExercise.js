const dynamo = require("../services/dynamoClient");
const { GetCommand, DeleteCommand } = require("@aws-sdk/lib-dynamodb");

const { createResponse } = require("../utils/response");
const { logInfo, logError } = require("../utils/logger");

exports.handler = async (event) => {

  const { part_code, exercise_code } = event.pathParameters ?? {};

  if (!part_code || !exercise_code) {
    return createResponse(400, {
      error_code: "INVALID_PARAMETER",
      message: "part_code and exercise_code are required"
    });
  }

  const pk = `PART#${part_code}`;
  const sk = `EXERCISE#${exercise_code}`;

  logInfo("deleteExercise request", { pk, sk });

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

    await dynamo.send(
      new DeleteCommand({ TableName: "exercise_master", Key: { PK: pk, SK: sk } })
    );

    logInfo("deleteExercise success", { pk, sk });

    return createResponse(200, { status: "success" });

  } catch (error) {

    logError("deleteExercise failed", error);

    return createResponse(500, {
      error_code: "INTERNAL_SERVER_ERROR",
      message: "Internal Server Error"
    });

  }

};
