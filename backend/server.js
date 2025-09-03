const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

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

/* function createChunkParser() {
  let incompleteChunk = '';

  return function(chunk) {
    let output = null;
    const combinedChunk = incompleteChunk + chunk;

    // This regex looks for complete JSON objects or arrays.
    const jsonRegex = /{[^{}]*?}|\[[^[\]]*?\]/g;
    let match;
    let lastIndex = 0;

    // Process all valid JSON objects in the combined chunk
    while ((match = jsonRegex.exec(combinedChunk)) !== null) {
      const jsonPart = match[0].trim();
      try {
        const data = JSON.parse(jsonPart);
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (text) {
          // Accumulate all text found in this processing step
          output = output ? output + text : text;
        }
      } catch (e) {
        console.error('Parser Log: Failed to parse stream chunk:', e, 'Chunk:', jsonPart);
      }
      lastIndex = jsonRegex.lastIndex;
    }

    // Save any remaining incomplete text for the next chunk
    incompleteChunk = combinedChunk.slice(lastIndex);
    return output;
  };
} */

 function createChunkParser() {
  let incompleteChunk = '';

  return function(chunk) {
    const combinedChunk = incompleteChunk + chunk;
    let output = null;
    // Trim leading characters [ or , to handle fragmented JSON streams
    let trimmedText = combinedChunk.trim();
    if (trimmedText.startsWith('[')) {
      trimmedText = trimmedText.substring(1);
    } else if (trimmedText.startsWith(',')) {
      trimmedText = trimmedText.substring(1);
    }
    
    try {
      // Attempt to parse the cleaned text as a JSON array
      const data = JSON.parse(`[${trimmedText}]`);
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      if (text) {
        // Accumulate all text found in this processing step
        output = output ? output + text : text;
      }
      incompleteChunk = ''; // Success: clear the saved chunk
      console.log('Parser Log: Successfully parsed current accumulated JSON! Clearing incomplete chunk.');
    } catch (e) {
      console.error('Parser Log: Failed to parse. Saving chunk for next iteration:'+chunk);
      incompleteChunk = combinedChunk; // Failure: save the combined chunk
      return false;
    }
    return output;
  };
} 

async function* processGeminiStream(reader) {
  const decoder = new TextDecoder();
  const parseChunk = createChunkParser();
  let fullResponse = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const rawChunk = decoder.decode(value, { stream: true });
    fullResponse += rawChunk;

    const parsedText = parseChunk(rawChunk);
    if (parsedText) {
      // Yield the parsed text as a chunk for the client
      yield { type: 'chunk', text: parsedText };
    }
  }
  try {
    const jsonArray = JSON.parse(fullResponse);
    const final_text = jsonArray.map(data => data?.candidates?.[0]?.content?.parts?.[0]?.text || '').join('');
    // Yield the final, full response for the client to replace the incremental text
    yield { type: 'final', text: final_text };
  } catch (e) {
    console.error('Parser Log: Failed to parse final response:', e);
  }
}

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

      // Look for "text": "..." inside the chunk
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