const express = require('express');
const path = require('path'); // ✅ Don't forget this!
const app = express();

// Choose the port from the environment or use 3000 for local dev
const PORT = process.env.PORT || 3000;

// A simple home route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
  // res.send('🚀 Hello from your Node.js app!');
});

// Start the server
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});
