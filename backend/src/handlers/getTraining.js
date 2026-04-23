const dynamo = require("../services/dynamoClient");
const { QueryCommand } = require("@aws-sdk/lib-dynamodb");

const { createResponse } = require("../utils/response");
const { logInfo, logError } = require("../utils/logger");

// SK format: DATE#20260310#EXERCISE#BENCHPRESS#SET#1
function parseSK(sk) {
  const [, date, , exercise, , set_no] = sk.split("#");
  return { date, exercise, set_no: Number(set_no) };
}

function groupRecords(items) {
  const map = new Map();

  for (const item of items) {
    const { date, exercise, set_no } = parseSK(item.SK);
    const key = `${date}#${exercise}`;

    if (!map.has(key)) {
      map.set(key, { date, exercise, sets: [] });
    }

    map.get(key).sets.push({
      set_no,
      weight: item.weight,
      reps: item.reps,
      memo: item.memo,
      rm: item.rm
    });
  }

  return Array.from(map.values()).map((record) => ({
    ...record,
    sets: record.sets.sort((a, b) => a.set_no - b.set_no)
  }));
}

exports.handler = async (event) => {

  const user_id = event.queryStringParameters?.user_id;

  if (!user_id) {
    return createResponse(400, {
      error_code: "INVALID_PARAMETER",
      message: "user_id is required"
    });
  }

  logInfo("getTraining request", { user_id });

  try {

    const result = await dynamo.send(
      new QueryCommand({
        TableName: "muscle_records",
        KeyConditionExpression: "PK = :pk",
        ExpressionAttributeValues: {
          ":pk": `USER#${user_id}`
        }
      })
    );

    if (!result.Items || result.Items.length === 0) {
      return createResponse(404, {
        error_code: "NOT_FOUND",
        message: "No training records found"
      });
    }

    const records = groupRecords(result.Items);

    logInfo("getTraining success", { user_id, recordCount: records.length });

    return createResponse(200, { records });

  } catch (error) {

    logError("getTraining failed", error);

    return createResponse(500, {
      error_code: "INTERNAL_SERVER_ERROR",
      message: "Internal Server Error"
    });

  }

};
