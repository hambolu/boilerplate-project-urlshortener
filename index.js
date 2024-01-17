require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser');
const dns = require('dns');


// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function (req, res) {
  res.json({ greeting: 'hello API' });
});

const urlMap = new Map();
let counter = 1;

// Define a route to handle POST requests and shorten URLs
app.post('/api/shorturl', (req, res) => {
  const { url } = req.body;

  // Validate the URL format
  const urlPattern = /^(https?:\/\/)([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w\.-]*)*\/?$/;
  if (!urlPattern.test(url)) {
    return res.json({ error: 'invalid url' });
  }

  // Validate the existence of the hostname using dns.lookup
  const { hostname } = new URL(url);
  dns.lookup(hostname, (err) => {
    if (err) {
      return res.json({ error: 'invalid url' });
    }

    // Save the URL in the in-memory data structure and return the shortened URL
    const shortUrl = counter++;
    urlMap.set(shortUrl, url);
    res.json({ original_url: url, short_url: shortUrl });
  });
});

// Define a route to handle redirection to the original URL
app.get('/api/shorturl/:short_url', (req, res) => {
  const { short_url } = req.params;

  // Find the original URL based on the short URL from the in-memory data structure
  const originalUrl = urlMap.get(+short_url);

  if (originalUrl) {
    // Redirect to the original URL
    res.redirect(originalUrl);
  } else {
    res.json({ error: 'short url not found' });
  }
});

// Default route for unsupported paths
app.use((req, res) => {
  res.status(404).send('Not Found');
});



app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
