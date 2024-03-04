import express from "express";

// Create an instance of Express
const app = express();

// Define a route
app.get("/", (req, res) => {
  res.send("API for Underground Group AI");
});

// Define a route to handle POST requests
app.post("/api/analyze", (req, res) => {
  // Process the POST request
  res.send("Received POST request");
});

// Define a route to handle all other requests
app.use((req, res) => {
  res.status(404).send("Page not found");
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
