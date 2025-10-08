// A simple Node.js proxy server for a radio stream and its metadata.
// This server solves connection issues between Unity and certain stream providers.

const express = require('express');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 10000; // Render uses port 10000

// --- Your Radio Station's URLs ---
// This is the direct URL to your station's audio stream.
const audioStreamUrl = 'https://usa14.fastcast4u.com/proxy/woodrat?mp=/1';
// This is the direct URL to the metadata API.
const metadataApiUrl = 'https://usa14.fastcast4u.com/statistics/json/listeners/?user=woodrat';

// --- Endpoint to proxy the audio stream ---
app.get('/stream', async (req, res) => {
    try {
        const response = await axios({
            method: 'get',
            url: audioStreamUrl,
            responseType: 'stream'
        });
        
        // --- FIXED: Tell the browser/app this is an MP3 audio stream ---
        res.setHeader('Content-Type', 'audio/mpeg');

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

        // This logic handles the format from the new JSON endpoint.
        // It looks for a 'song' property inside a 'stream' object.
        if (data && data.stream && data.stream.song && data.stream.song.trim() !== '') {
            nowPlaying = data.stream.song;
        }
        
        res.json({ title: nowPlaying });

    } catch (error) {
        console.error('Error fetching metadata:', error.message);
        // If there's an error, send the last known good title or the default.
        res.json({ title: nowPlaying });
    }
});

// Start the server.
app.listen(port, () => {
    console.log(`Radio proxy server listening at http://localhost:${port}`);
});

