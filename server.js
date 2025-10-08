// A simple Node.js proxy server for a radio stream and its metadata.
// This server solves connection issues between Unity and certain stream providers.

const express = require('express');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

// --- Your Radio Station's URLs ---
// This is the direct URL to your station's audio stream.
const audioStreamUrl = 'https://usa14.fastcast4u.com/proxy/woodrat?mp=/1';
// This is the direct URL to your station's metadata API.
const metadataApiUrl = 'https://usa14.fastcast4u.com/statistics.php?json=1&server=1&user=woodrat';

// --- Endpoint to proxy the audio stream ---
app.get('/stream', async (req, res) => {
    try {
        // Axios gets the stream as a response stream.
        const response = await axios({
            method: 'get',
            url: audioStreamUrl,
            responseType: 'stream'
        });
        // Pipe the audio data directly to the client (your Unity app).
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

        // --- FIXED: More robust logic to find the song title ---
        // 1. Try to build from separate artist and title fields.
        if (data && data.artist && data.title && data.artist.trim() !== '' && data.title.trim() !== '') {
            nowPlaying = `${data.artist} - ${data.title}`;
        }
        // 2. If that fails, fall back to the combined 'song' field.
        else if (data && data.song && data.song.trim() !== '') {
            nowPlaying = data.song;
        }
        
        // Send the clean, formatted data to the client (your Unity app).
        res.json({ title: nowPlaying });

    } catch (error) {
        console.error('Error fetching metadata:', error.message);
        // If there's an error, send the fallback text so the app doesn't show an error.
        res.json({ title: nowPlaying });
    }
});

// Start the server.
app.listen(port, () => {
    console.log(`Radio proxy server listening at http://localhost:${port}`);
});

