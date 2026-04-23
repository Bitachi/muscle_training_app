const dynamo = require("../services/dynamoClient");
const { PutCommand } = require("@aws-sdk/lib-dynamodb");

const { createResponse } = require("../utils/response");
const { logInfo, logError } = require("../utils/logger");

function calcRM(weight, reps) {
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
}

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

  const { user_id, date, exercise, sets } = body ?? {};

  if (!user_id || !date || !exercise || !Array.isArray(sets) || sets.length === 0) {
    return createResponse(400, {
      error_code: "INVALID_PARAMETER",
      message: "user_id, date, exercise, sets are required"
    });
  }

  logInfo("postTraining request", { user_id, date, exercise, setCount: sets.length });

  try {

    const now = new Date().toISOString();

    const writes = sets.map((set) => {
      const { set_no, weight, reps, memo } = set;
      return dynamo.send(
        new PutCommand({
          TableName: "muscle_records",
          Item: {
            PK: `USER#${user_id}`,
            SK: `DATE#${date}#EXERCISE#${exercise}#SET#${set_no}`,
            exercise,
            weight,
            reps,
            memo: memo ?? "",
            rm: calcRM(weight, reps),
            created_at: now,
            updated_at: now,
            created_by: user_id,
            updated_by: user_id
          }
        })
      );
    });

    await Promise.all(writes);

    logInfo("postTraining success", { user_id, date, exercise, setCount: sets.length });

    return createResponse(200, { status: "success" });

  } catch (error) {

    logError("postTraining failed", error);

    return createResponse(500, {
      error_code: "INTERNAL_SERVER_ERROR",
      message: "Internal Server Error"
    });

  }

};
