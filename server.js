const express = require('express');
const path = require('path');
const app = express();
const port = 5000;

// Serve static files. This line tells Express to use the root directory to serve static files.
app.use(express.static(path.join(__dirname)));

// Redirect the root URL to home.html. This handles the case where someone accesses the root URL.
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'home.html'));
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});