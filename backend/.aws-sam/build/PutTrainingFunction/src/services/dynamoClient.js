const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");

const isLocal = process.env.IS_LOCAL === "true";

const client = new DynamoDBClient({
  region: "ap-northeast-1",

  ...(isLocal && {
    endpoint: "http://host.docker.internal:8000",
    credentials: {
      accessKeyId: "dummy",
      secretAccessKey: "dummy"
    }
  })
});

const dynamo = DynamoDBDocumentClient.from(client);

module.exports = dynamo;