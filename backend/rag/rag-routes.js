// rag/rag-routes.js

const express = require('express');
const multer = require('multer');
const path = require('path');
const { rebuildAndSaveStore, getEmbedding } = require('./vector-store.js');

const router = express.Router();
const upload = multer({ dest: path.join(__dirname, '..', 'uploads') });

router.post('/embeddings', async (req, res) => {
  const { text } = req.body;
  const apiKey = req.cookies.gemini_api_key; 
  if (!text || !apiKey) {
    return res.status(400).json({ message: 'Text and API key are required.' });
  }

  try {
    const embedding = await getEmbedding(text, apiKey);
    res.json({ embedding });
  } catch (error) {
    console.error('[RAG Routes] Error generating embedding:', error);
    res.status(500).json({ message: 'Failed to generate embedding.' });
  }
});

router.post('/upload-knowledge', upload.array('knowledgeFiles'), async (req, res) => {
  // const { apiKey } = req.body;
  const apiKey = req.cookies.gemini_api_key; 
  const files = req.files;

  if (!apiKey) {
    return res.status(400).json({ message: 'Gemini API key is required.' });
  }
  if (!files || files.length === 0) {
    return res.status(400).json({ message: 'No files uploaded.' });
  }

  try {
    await rebuildAndSaveStore(files, apiKey);
    res.json({ message: `Successfully indexed ${files.length} file(s).` });
  } catch (error) {
    console.error('[RAG Routes] Error indexing documents:', error);
    res.status(500).json({ message: 'Failed to process documents.' });
  }
});

module.exports = router;