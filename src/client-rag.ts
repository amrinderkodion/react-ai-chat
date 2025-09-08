import { openDB, type IDBPDatabase } from 'idb';

// --- Type Definitions ---
interface VectorData {
  id: string;
  text: string;
  embedding: number[];
}

interface SearchResult {
  text: string;
  similarity: number;
}

// --- Database and Pipeline Variables ---
const DB_NAME = 'rag-vector-store';
const STORE_NAME = 'vectors';


let db: IDBPDatabase<unknown> | undefined;

export async function hasLocalKnowledgeBase(): Promise<boolean> {
  // Ensure the database is initialized
  if (!db) await init();
  
  // Use a transaction to get the object store count
  const tx = db!.transaction(STORE_NAME, 'readonly');
  const store = tx.objectStore(STORE_NAME);
  const count = await store.count();
  
  return count > 0;
}

// New helper function to get embeddings from the server
async function getEmbeddingFromServer(text: string): Promise<number[]> {
  const response = await fetch('/api/rag/embeddings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!response.ok) {
    throw new Error('Failed to get embedding from server');
  }
  const data = await response.json();
  return data.embedding;
}

// Initialize the database (this stays the same)
async function init(): Promise<void> {
  if (!db) {
    db = await openDB(DB_NAME, 1, {
      upgrade(db) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      },
    });
  }
  console.log('Client-side RAG initialized.');
}

/**
 * Processes and saves knowledge from files into the client-side IndexedDB store.
 * @param files - An array of File objects to be processed.
 */
export async function processAndSaveKnowledge(files: File[]): Promise<void> {
  await init();

  const tx = db!.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);

  for (const file of files) {
    const text = await file.text();
    const chunks = text.match(/[^.!?]+/g) || [];

    for (const chunk of chunks) {
      if (chunk.length < 20) continue;
      // Get embedding from the server instead of a local model
      const embedding = await getEmbeddingFromServer(chunk);
      const data = {
        id: crypto.randomUUID(),
        text: chunk,
        embedding: embedding,
      };
      await store.put(data);
    }
  }

  await tx.done;
  console.log(`Successfully indexed ${files.length} file(s) locally.`);
}

/**
 * Searches the local IndexedDB vector store for relevant context based on a query.
 * @param query - The search query.
 * @returns A promise that resolves with the concatenated context string.
 */
export async function searchLocalKnowledge(query: string): Promise<string> {
  await init();
  
  const queryVector = await getEmbeddingFromServer(query);

  const tx = db!.transaction(STORE_NAME, 'readonly');
  const store = tx.objectStore(STORE_NAME);

  const vectors = (await store.getAll()) as VectorData[];

  const searchResults: SearchResult[] = vectors.map(item => ({
    text: item.text,
    similarity: cosineSimilarity(queryVector, item.embedding),
  }))
  .sort((a, b) => b.similarity - a.similarity)
  .slice(0, 3);

  return searchResults.map(r => r.text).join('\n---\n');
}

// Helper function for vector math
function cosineSimilarity(vecA: number[], vecB: number[]): number {
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