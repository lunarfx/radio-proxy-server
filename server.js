// A simple Node.js proxy server for a radio stream and its metadata.
// This server solves connection issues between Unity and certain stream providers.

const express = require('express');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

// --- Your Radio Station's URLs ---
// This is the direct URL to your station's audio stream.
const audioStreamUrl = 'https://usa14.fastcast4u.com/proxy/woodrat?mp=/1';
// --- FIXED: The metadata URL has been corrected to another common API endpoint ---
const metadataApiUrl = 'https://usa14.fastcast4u.com/system/info.php?user=woodrat&json=1';

// --- Endpoint to proxy the audio stream ---
app.get('/stream', async (req, res) => {
    try {
        const response = await axios({
            method: 'get',
            url: audioStreamUrl,
            responseType: 'stream'
        });
        response.data.pipe(res);
    } catch (error) {
        console.error('Error proxying audio stream:', error.message);
        res.status(500).send('Error proxying audio stream.');
    }
});

// --- Endpoint to fetch and format the metadata ---
app.get('/metadata', async (req, res) => {
    let nowPlaying = 'Galveston Island Radio'; // Default fallback text

    try {
        const metadataResponse = await axios.get(metadataApiUrl);
        const data = metadataResponse.data;

        // Log the raw data from the radio server to Render's logs for diagnostics
        console.log("Raw data received from radio API:", JSON.stringify(data, null, 2));

        // This logic handles the format from the new info.php endpoint.
        // It expects a direct object with a 'song' property.
        if (data && data.song && data.song.trim() !== '') {
            nowPlaying = data.song;
        }
        
        res.json({ title: nowPlaying });

    } catch (error) {
        console.error('Error fetching metadata:', error.message);
        res.json({ title: nowPlaying });
    }
});

// Start the server.
app.listen(port, () => {
    console.log(`Radio proxy server listening at http://localhost:${port}`);
});

