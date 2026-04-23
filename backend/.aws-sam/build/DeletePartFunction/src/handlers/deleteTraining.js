const dynamo = require("../services/dynamoClient");
const { GetCommand, DeleteCommand } = require("@aws-sdk/lib-dynamodb");

const { createResponse } = require("../utils/response");
const { logInfo, logError } = require("../utils/logger");

exports.handler = async (event) => {

  const { date, exercise, set_no } = event.pathParameters ?? {};
  const user_id = event.queryStringParameters?.user_id;

  if (!user_id || !date || !exercise || !set_no) {
    return createResponse(400, {
      error_code: "INVALID_PARAMETER",
      message: "user_id, date, exercise, set_no are required"
    });
  }

  const pk = `USER#${user_id}`;
  const sk = `DATE#${date}#EXERCISE#${exercise}#SET#${set_no}`;

  logInfo("deleteTraining request", { pk, sk });

  try {

    const existing = await dynamo.send(
      new GetCommand({ TableName: "muscle_records", Key: { PK: pk, SK: sk } })
    );

    if (!existing.Item) {
      return createResponse(404, {
        error_code: "NOT_FOUND",
        message: "Training record not found"
      });
    }

    await dynamo.send(
      new DeleteCommand({ TableName: "muscle_records", Key: { PK: pk, SK: sk } })
    );

    logInfo("deleteTraining success", { pk, sk });

    return createResponse(200, { status: "success" });

  } catch (error) {

    logError("deleteTraining failed", error);

    return createResponse(500, {
      error_code: "INTERNAL_SERVER_ERROR",
      message: "Internal Server Error"
    });

  }

};
