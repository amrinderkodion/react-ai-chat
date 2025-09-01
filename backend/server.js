const express = require('express');
const path = require('path');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

const app = express();
const PORT = process.env.PORT || 3000;

const fs = require('fs');

app.use((req, res, next) => {
  console.log(new Date().toISOString(), req.method, req.url);
  next();
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.post('/api/upload', upload.array('files'), async (req, res) => {
  const { message, apiKey, history } = req.body;
  const files = req.files;

  const GEMINI_API_KEY = apiKey || process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    return res.status(400).json({ reply: 'Gemini API key not provided.' });
  }

  const systemPrompt = "You are a helpful assistant for a team manager.";
  
  const contents = [];

  contents.push({ role: 'user', parts: [{ text: systemPrompt }] });

  let conversationHistory = [];
  if (history) {
    try {
      conversationHistory = JSON.parse(history);
      conversationHistory.forEach(msg => {
        contents.push({
          role: msg.sender,
          parts: [{ text: msg.text }]
        });
      });
    } catch (e) {
      console.error('Failed to parse history:', e);
    }
  }

  const currentParts = [];
  if (message) {
    currentParts.push({ text: message });
  }

  if (Array.isArray(files) && files.length > 0) {
    files.forEach(file => {
      const fileBuffer = fs.readFileSync(file.path);
      const base64Data = fileBuffer.toString('base64');
      currentParts.push({
        inlineData: {
          data: base64Data,
          mimeType: file.mimetype,
        },
      });
      fs.unlinkSync(file.path);
    });
  }

  if (currentParts.length > 0) {
    contents.push({
      role: 'user',
      parts: currentParts
    });
  }

  if (contents.length === 0) {
    return res.status(400).json({ reply: 'No content provided.' });
  }

  try {
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' +
        GEMINI_API_KEY,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents })
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


app.use(express.static(path.join(__dirname, '..', 'dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on http://0.0.0.0:${PORT} (accessible on local network at http://<YOUR_IP>:${PORT})`);
});
