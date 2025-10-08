const http = require('http');
const https = require('https');
const axios = require('axios');

// The direct URL to your radio's audio stream
const audioStreamUrl = 'https://usa14.fastcast4u.com/proxy/woodrat?mp=/1';

// This is the corrected metadata API URL that the proxy will use
const metadataApiUrl = 'https://usa14.fastcast4u.com/system/streaminfo.php?username=woodrat&type=json';

const server = http.createServer((req, res) => {
  // Set CORS headers to allow requests from any origin
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Route for the audio stream
  if (req.url === '/stream') {
    https.get(audioStreamUrl, (streamRes) => {
      res.writeHead(streamRes.statusCode, streamRes.headers);
      streamRes.pipe(res);
    }).on('error', (e) => {
      console.error(`Audio stream error: ${e.message}`);
      res.writeHead(500);
      res.end('Error fetching audio stream.');
    });
  } 
  // Route for the metadata
  else if (req.url === '/metadata') {
    axios.get(metadataApiUrl)
      .then(response => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response.data));
      })
      .catch(error => {
        console.error(`Metadata API error: ${error.message}`);
        res.writeHead(500);
        res.end('Error fetching metadata.');
      });
  } 
  else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

const port = 3000;
server.listen(port, () => {
  console.log(`Proxy server listening on port ${port}`);
});

