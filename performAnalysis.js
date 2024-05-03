function submitAnalysisForm() {
  //var userInput = document.getElementById("userInput").value;
  // Do something with the userInput, for example, display it in console
  //console.log("User input:", userInput);
  // You can also perform other actions here, such as sending the data to a server using AJAX

  const data = {
    blogUrl: "https://www.fluxx.io/blog", // Replace with the URL of the blog you want to analyze
  };
  // Make a POST request to the API endpoint
  fetch("http://localhost:3000/api/analyze", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
    .then((response) => {
      // Check if the response is successful
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      // Parse the JSON response
      return response.json();
    })
    .then((data) => {
      // Handle the response data
      console.log("RESPONSE DATA:", data);
    })
    .catch((error) => {
      // Handle errors
      console.error("There was a problem with the request:", error.message);
    });
}

submitAnalysisForm();
