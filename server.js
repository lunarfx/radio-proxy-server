const express = require('express');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 10000;

// The direct URL to your station's audio stream
const radioStreamUrl = 'https://usa14.fastcast4u.com/proxy/woodrat?mp=/1';

// --- Using a different, more standard API endpoint for stats ---
const metadataApiUrl = 'https://usa14.fastcast4u.com/stats.php?json=1&sid=1&username=woodrat';

// A simple root endpoint to confirm the server is running
app.get('/', (req, res) => {
  res.send('Galveston Island Radio Proxy is running!');
});

// Endpoint for the audio stream
app.get('/stream', async (req, res) => {
  try {
    const response = await axios({
      method: 'get',
      url: radioStreamUrl,
      responseType: 'stream',
    });
    // Set the content-type header to tell clients this is an MP3 audio stream
    res.setHeader('Content-Type', 'audio/mpeg');
    response.data.pipe(res);
  } catch (error) {
    console.error('Error fetching radio stream:', error.message);
    res.status(500).send('Error fetching radio stream');
  }
});

// Endpoint for the metadata
app.get('/metadata', async (req, res) => {
  let titleToSend = "Galveston Island Radio"; // Default fallback text
  try {
    // 1. Fetch the data from the new stats endpoint
    const { data } = await axios.get(metadataApiUrl);
    
    // Log the raw data we receive from the radio's API for debugging
    console.log('Raw data from radio API:', JSON.stringify(data));

    // 2. The data from this endpoint has a 'songtitle' field.
    if (data && data.songtitle) {
        const songTitle = data.songtitle;
        if (songTitle && songTitle.trim() !== '') {
            titleToSend = songTitle.trim();
        }
    }
    
    // 3. Send the final title back to the Unity app
    res.json({ title: titleToSend });

  } catch (error) {
    console.error('Error fetching metadata from API:', error.message);
    res.json({ title: "Galveston Island Radio" }); // Send fallback on error
  }
});

app.listen(port, () => {
  console.log(`Radio proxy server listening on port ${port}`);
});

