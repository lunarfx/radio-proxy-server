const express = require('express');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 10000;

// The direct URL to your station's audio stream
const radioStreamUrl = 'https://usa14.fastcast4u.com/proxy/woodrat?mp=/1';

// --- FINAL FIX: Using a classic Shoutcast/Icecast plain text endpoint ---
const metadataApiUrl = 'https://usa14.fastcast4u.com/7.html?sid=1';

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
    // 1. Fetch the data from the new plain text endpoint
    const { data } = await axios.get(metadataApiUrl);
    
    // Log the raw data we receive from the radio's API for debugging
    console.log('Raw data from radio API:', data);

    // 2. The data from this endpoint is a simple comma-separated string inside an HTML body.
    // Example: <body>1,1,1,1,1,1,Artist Name - Song Title</body>
    if (data && data.includes('<body>') && data.includes('</body>')) {
      const bodyContent = data.split('<body>')[1].split('</body>')[0];
      const parts = bodyContent.split(',');
      // The song title is typically the 7th item (index 6).
      if (parts.length > 6 && parts[6]) {
        titleToSend = parts[6];
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

