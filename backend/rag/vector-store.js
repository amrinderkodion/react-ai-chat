// rag/vector-store.js

const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const VECTOR_STORE_PATH = path.join(__dirname, '..', 'vector_store.json');
let vectorStore = [];

// Helper function for vector math
function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0.0;
  let normA = 0.0;
  let normB = 0.0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function getEmbedding(text, apiKey) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
  const result = await model.embedContent(text);
  return result.embedding.values;
}

/**
 * Loads the vector store from the filesystem into memory.
 */
function initializeVectorStore() {
  try {
    if (fs.existsSync(VECTOR_STORE_PATH)) {
      const data = fs.readFileSync(VECTOR_STORE_PATH, 'utf-8');
      vectorStore = JSON.parse(data);
      console.log(`[RAG] Successfully loaded ${vectorStore.length} vectors from disk.`);
    } else {
      console.log('[RAG] No existing vector store found. Starting fresh.');
    }
  } catch (error) {
    console.error('[RAG] Error loading vector store from disk:', error);
  }
}

/**
 * Processes uploaded files, creates embeddings, and saves them to the filesystem.
 * @param {Array} files - The array of files from multer.
 * @param {string} apiKey - The Gemini API key.
 */
async function rebuildAndSaveStore(files, apiKey) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });

  vectorStore = []; // Clear previous knowledge
  console.log('[RAG] Cleared existing vector store for re-indexing.');

  for (const file of files) {
    const fileContent = fs.readFileSync(file.path, 'utf-8');
    const chunks = fileContent.split(/\n\s*\n/).filter(chunk => chunk.trim().length > 10);
    
    for (const chunk of chunks) {
      const embedding = await getEmbedding(chunk, apiKey);
      vectorStore.push({ text: chunk, embedding });
    }
    fs.unlinkSync(file.path); // Clean up temp file
  }
  
  fs.writeFileSync(VECTOR_STORE_PATH, JSON.stringify(vectorStore, null, 2));
  console.log(`[RAG] Indexing complete. Saved ${vectorStore.length} vectors to disk.`);
}

/**
 * Finds relevant context from the vector store and augments the user's message.
 * @param {string} message - The original user message.
 * @param {string} apiKey - The Gemini API key.
 * @returns {string} The augmented message with context.
 */
async function augmentMessageWithRagContext(message, apiKey) {
  if (vectorStore.length === 0) {
    return message; // No context available, return original message
  }

  console.log('[RAG] Augmenting prompt with context...');
  const queryEmbedding = await getEmbedding(message, apiKey);

  const searchResults = vectorStore.map(item => ({
    text: item.text,
    similarity: cosineSimilarity(queryEmbedding, item.embedding)
  }))
  .sort((a, b) => b.similarity - a.similarity)
  .slice(0, 3);

  const context = searchResults.map(r => r.text).join('\n---\n');
  
  return `
Based on the following context, please answer the user's question. If the context does not contain the answer, state that you cannot find the information in the provided documents.

## Context:
${context}

## User's Question:
${message}
`;
}

module.exports = {
  initializeVectorStore,
  rebuildAndSaveStore,
  augmentMessageWithRagContext,
  getEmbedding
};