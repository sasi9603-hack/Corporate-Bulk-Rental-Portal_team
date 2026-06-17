const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Hello Route
app.get('/api/hello', (req, res) => {
  res.json({
    status: "success",
    message: "Hello from Corporate Bulk Rental Portal Backend!",
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
