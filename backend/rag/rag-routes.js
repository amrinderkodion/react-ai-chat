// rag/rag-routes.js

const express = require('express');
const multer = require('multer');
const path = require('path');
const { rebuildAndSaveStore } = require('./vector-store.js');

const router = express.Router();
const upload = multer({ dest: path.join(__dirname, '..', 'uploads') });

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