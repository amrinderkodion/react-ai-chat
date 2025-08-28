const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Simple request logger to aid debugging
app.use((req, res, next) => {
  console.log(new Date().toISOString(), req.method, req.url);
  next();
});

// bodyParser is not needed; express has built-in parsers
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Gemini 2.5 Flash API proxy endpoint
app.post('/api/assistant', async (req, res) => {
  const userMessage = req.body?.message || '';
  // allow client to provide an API key stored locally in the browser
  const clientKey = req.body?.apiKey;
  const GEMINI_API_KEY = clientKey || process.env.GEMINI_API_KEY || '';
  if (!GEMINI_API_KEY) {
    return res.status(400).json({ reply: 'Gemini API key not provided. Set it in the UI or configure GEMINI_API_KEY on the server.' });
  }

  try {
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' +
        GEMINI_API_KEY,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: userMessage }] }]
        })
      }
    );

    if (!response.ok) {
      const text = await response.text();
      console.error('Gemini API error:', response.status, text);
      return res.status(502).json({ reply: "Error from Gemini API." });
    }

    const data = await response.json();
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't get a response.";
    res.json({ reply });
  } catch (err) {
    console.error('Assistant proxy error:', err);
    res.status(500).json({ reply: 'Error contacting Gemini API.' });
  }
});


// Publicly serve the Vite build and allow direct access to API endpoints.
app.use(express.static(path.join(__dirname, '..', 'dist')));

// Fallback to index.html for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
});

// Start the server on all network interfaces
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on http://0.0.0.0:${PORT} (accessible on local network at http://<YOUR_IP>:${PORT})`);
});
