const dynamo = require("../services/dynamoClient");
const { QueryCommand } = require("@aws-sdk/lib-dynamodb");

const { createResponse } = require("../utils/response");
const { logInfo, logError } = require("../utils/logger");

exports.handler = async (event) => {

  const part = event.queryStringParameters?.part;

  if (!part) {
    return createResponse(400, {
      error_code: "INVALID_PARAMETER",
      message: "part is required"
    });
  }

  try {

    logInfo("getExercises request", { part });

    const result = await dynamo.send(
      new QueryCommand({
        TableName: "exercise_master",
        KeyConditionExpression: "PK = :pk",
        ExpressionAttributeValues: {
          ":pk": `PART#${part}`
        }
      })
    );

    const exercises = result.Items.map((item) => ({
      exercise_code: item.SK.split("#")[1],
      exercise_name: item.exercise_name
    }));

    return createResponse(200, { exercises: exercises ?? [] });

  } catch (error) {

    logError("getExercises failed", error);

    return createResponse(500, {
      message: "Internal Server Error"
    });

  }

};