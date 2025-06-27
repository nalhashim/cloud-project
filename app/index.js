const express = require('express');
const app = express();

// Choose the port from the environment or use 3000 for local dev
const PORT = process.env.PORT || 5000;

// A simple home route
app.get('/', (req, res) => {
  res.sendFile('index.html');
  // res.send('🚀 Hello from your Node.js app!');
});

// Start the server
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});
