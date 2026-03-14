exports.handler = async (event) => {

  console.log("event:", JSON.stringify(event));

  const parts = [
    "CHEST",
    "BACK",
    "LEGS",
    "SHOULDER",
    "ARM",
    "ABS"
  ];

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      parts: parts
    })
  };

};