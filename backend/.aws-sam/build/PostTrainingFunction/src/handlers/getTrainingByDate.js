const dynamo = require("../services/dynamoClient");
const { QueryCommand } = require("@aws-sdk/lib-dynamodb");

const { createResponse } = require("../utils/response");
const { logInfo, logError } = require("../utils/logger");

// SK format: DATE#20260310#EXERCISE#BENCHPRESS#SET#1
function parseSK(sk) {
  const [, , , exercise, , set_no] = sk.split("#");
  return { exercise, set_no: Number(set_no) };
}

function groupByExercise(items) {
  const map = new Map();

  for (const item of items) {
    const { exercise, set_no } = parseSK(item.SK);

    if (!map.has(exercise)) {
      map.set(exercise, { exercise, sets: [] });
    }

    map.get(exercise).sets.push({
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

  const date = event.pathParameters?.date;
  const user_id = event.queryStringParameters?.user_id;

  if (!date || !user_id) {
    return createResponse(400, {
      error_code: "INVALID_PARAMETER",
      message: "date and user_id are required"
    });
  }

  logInfo("getTrainingByDate request", { user_id, date });

  try {

    const result = await dynamo.send(
      new QueryCommand({
        TableName: "muscle_records",
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :skPrefix)",
        ExpressionAttributeValues: {
          ":pk": `USER#${user_id}`,
          ":skPrefix": `DATE#${date}`
        }
      })
    );

    if (!result.Items || result.Items.length === 0) {
      return createResponse(404, {
        error_code: "NOT_FOUND",
        message: "No training records found for the specified date"
      });
    }

    const exercises = groupByExercise(result.Items);

    logInfo("getTrainingByDate success", { user_id, date, exerciseCount: exercises.length });

    return createResponse(200, { date, exercises });

  } catch (error) {

    logError("getTrainingByDate failed", error);

    return createResponse(500, {
      error_code: "INTERNAL_SERVER_ERROR",
      message: "Internal Server Error"
    });

  }

};
