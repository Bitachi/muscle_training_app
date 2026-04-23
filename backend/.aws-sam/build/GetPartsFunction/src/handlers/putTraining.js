const dynamo = require("../services/dynamoClient");
const { UpdateCommand, GetCommand } = require("@aws-sdk/lib-dynamodb");

const { createResponse } = require("../utils/response");
const { logInfo, logError } = require("../utils/logger");

function calcRM(weight, reps) {
  if (weight == null) return null;
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
}

exports.handler = async (event) => {

  const { date, exercise, set_no } = event.pathParameters ?? {};

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return createResponse(400, {
      error_code: "INVALID_REQUEST_BODY",
      message: "Request body must be valid JSON"
    });
  }

  const { user_id, weight, reps, memo } = body ?? {};

  if (!user_id || !date || !exercise || !set_no || reps == null) {
    return createResponse(400, {
      error_code: "INVALID_PARAMETER",
      message: "user_id, reps are required"
    });
  }
  const w = weight != null && weight !== "" ? Number(weight) : null;

  const pk = `USER#${user_id}`;
  const sk = `DATE#${date}#EXERCISE#${exercise}#SET#${set_no}`;

  logInfo("putTraining request", { pk, sk });

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

    const now = new Date().toISOString();

    await dynamo.send(
      new UpdateCommand({
        TableName: "muscle_records",
        Key: { PK: pk, SK: sk },
        UpdateExpression:
          "SET weight = :weight, reps = :reps, memo = :memo, rm = :rm, updated_at = :updated_at, updated_by = :updated_by",
        ExpressionAttributeValues: {
          ":weight": w,
          ":reps": Number(reps),
          ":memo": memo ?? "",
          ":rm": calcRM(w, Number(reps)),
          ":updated_at": now,
          ":updated_by": user_id
        }
      })
    );

    logInfo("putTraining success", { pk, sk });

    return createResponse(200, { status: "success" });

  } catch (error) {

    logError("putTraining failed", error);

    return createResponse(500, {
      error_code: "INTERNAL_SERVER_ERROR",
      message: "Internal Server Error"
    });

  }

};
