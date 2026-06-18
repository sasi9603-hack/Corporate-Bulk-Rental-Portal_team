const testPostRoute = async () => {
  console.log("Starting API Test for POST http://localhost:5000/api/hello...");
  try {
    const response = await fetch("http://localhost:5000/api/hello", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ name: "Sasidhar" })
    });
    
    const data = await response.json();
    console.log("\n--- TEST RESPONSE ---");
    console.log("Status Code:", response.status, response.statusText);
    console.log("Response Body:\n", JSON.stringify(data, null, 2));
    console.log("---------------------\n");
    console.log("Test execution completed successfully!");
  } catch (error) {
    console.error("Test failed! Error connecting to backend server:", error.message);
  }
};

testPostRoute();
