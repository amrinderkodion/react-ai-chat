const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { initializeVectorStore, augmentMessageWithRagContext } = require('./rag/vector-store.js');
const ragRoutes = require('./rag/rag-routes.js');
const cookieParser = require('cookie-parser');


const app = express();
const PORT = process.env.PORT || 3000;


const RAG_ENABLED = 'true'; // process.env.RAG_ENABLED === 'true';
console.log(`RAG feature is ${RAG_ENABLED ? 'ENABLED' : 'DISABLED'}.`);
if (RAG_ENABLED) {
  initializeVectorStore();
}


const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}
const upload = multer({ dest: uploadDir });

app.use((req, res, next) => {
  console.log(new Date().toISOString(), req.method, req.url);
  next();
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());


if (RAG_ENABLED) {
  app.use('/api/rag', ragRoutes);
  console.log('RAG API routes are active.');
}

app.get('/api/config', (req, res) => {
  res.json({
    isRagEnabled: RAG_ENABLED,
  });
});

app.post('/api/set-key', (req, res) => {
  const { apiKey } = req.body;

  if (!apiKey) {
    return res.status(400).json({ message: 'API key is required.' });
  }

  res.cookie('gemini_api_key', apiKey, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // Use secure in production
    sameSite: 'strict',
    maxAge: 3600000 * 24 * 60 // 24 hours
  });

  res.status(200).json({ message: 'API key successfully set.' });
});

app.post('/api/upload', upload.array('files'), async (req, res) => {
  const apiKey = req.cookies.gemini_api_key; 
  const { message,  history } = req.body;
  const files = req.files;

  const GEMINI_API_KEY = apiKey || process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    return res.status(400).json({ reply: 'Gemini API key not provided.' });
  }

  let augmentedMessage = message;
  if (RAG_ENABLED && message) {
    augmentedMessage = await augmentMessageWithRagContext(message, GEMINI_API_KEY);
  }

  const systemPrompt = "You are a helpful assistant for a team manager.";
  const contents = [];

  contents.push({ role: 'user', parts: [{ text: systemPrompt }] });

  let conversationHistory = [];
  if (history) {
    try {
      conversationHistory = JSON.parse(history);
      conversationHistory.forEach(msg => {
        const role = msg.sender === 'assistant' ? 'model' : 'user';
        contents.push({
          role: role,
          parts: [{ text: msg.text }]
        });
      });
    } catch (e) {
      console.error('Failed to parse history:', e);
    }
  }

  /* const currentParts = [];
  if (message) {
    currentParts.push({ text: message });
  } */
 const currentParts = [{ text: augmentedMessage }];

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
    const geminiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?key=' + GEMINI_API_KEY;

    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('Gemini API error:', response.status, text);
      return res.status(502).json({ reply: "Error from Gemini API." });
    }

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    res.flushHeaders();
  
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let full = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const rawChunk = decoder.decode(value, { stream: true });
      full += rawChunk;

      const matches = [...rawChunk.matchAll(/"text"\s*:\s*"([^"]*)"/g)];
      for (const match of matches) {
        const text = match[1];
        if (text) {
          res.write(`data: ${JSON.stringify({ type: 'chunk', text })}\n\n`);
        }
      }

      // await new Promise(r => setTimeout(r, 3000));
    }

    try {
      const jsonArray = JSON.parse(full);
      const finalText = jsonArray.map(
        d => d?.candidates?.[0]?.content?.parts?.[0]?.text || ''
      ).join('');
      res.write(`data: ${JSON.stringify({ type: 'final', text: finalText })}\n\n`);
    } catch (e) {
      console.error('Failed to parse final JSON:', e);
    }
    res.end();



  } catch (err) {
    console.error('Assistant proxy error:', err);
    if (!res.headersSent) {
      res.status(500).json({ reply: 'Error contacting Gemini API.' });
    }
  }
});

app.use(express.static(path.join(__dirname, '..', 'dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
});
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on http://0.0.0.0:${PORT}`);
});