const createResponse = (statusCode, body) => {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  };
};

exports.handler = async (event) => {

  console.log("INFO request received", {
    path: event.path,
    method: event.httpMethod
  });

  try {

    const parts = [
      "CHEST",
      "BACK",
      "LEGS",
      "SHOULDER",
      "ARM",
      "ABS"
    ];

    console.log("INFO parts fetched", { count: parts.length });

    return createResponse(200, {
      parts: parts
    });

  } catch (error) {

    console.error("ERROR getParts failed", {
      message: error.message,
      stack: error.stack
    });

    return createResponse(500, {
      message: "Internal Server Error"
    });

  }

};