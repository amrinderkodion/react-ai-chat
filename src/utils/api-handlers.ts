import { Msg, Session } from '../types.js';
import { processAndSaveKnowledge, searchLocalKnowledge, hasLocalKnowledgeBase } from '../client-rag.ts';
import React from 'react';

type UpdateActiveMessagesFunc = (updater: (m: Msg[]) => Msg[]) => void;

export async function sendMessage(
    input: string,
    files: File[],
    ragMode: 'server' | 'client',
    activeSession: Session,
    updateActiveMessages: UpdateActiveMessagesFunc,
    setLoading: (loading: boolean) => void,
    setInput: (input: string) => void,
    setFiles: (files: File[]) => void,
) {
    let text = input.trim();
    let finalMessage = text;
    if (ragMode === 'client' && (await hasLocalKnowledgeBase())) {
        const context = await searchLocalKnowledge(input);
        text = `
            Based on the following context, please answer the user's question. If the context does not contain the answer, state that you cannot find the information in the provided documents.
            
            ## Context:
            ${context}
            
            ## User's Question:
            ${finalMessage}
        `;
    }

    if (!finalMessage && files.length === 0) return;

    const ts = Date.now();
    const assistantPlaceholder = { sender: 'assistant' as const, text: '' as const, t: Date.now() };

    if (files.length > 0) {
        const fileNames = files.map(f => f.name).join(', ');
        updateActiveMessages(msgs => [...msgs, { sender: 'user', text: `Files attached: ${fileNames}`, t: ts }, assistantPlaceholder]);
    }
    if (finalMessage) {
        updateActiveMessages(msgs => [...msgs, { sender: 'user', text: finalMessage, t: ts }, assistantPlaceholder]);
    }

    setInput('');
    setFiles([]);
    setLoading(true);

    try {
        const formData = new FormData();
        formData.append('message', text);
        formData.append('ragMode', ragMode);
        const historyLimit = 10;
        const recentHistory = activeSession.messages.slice(-historyLimit);
        formData.append('history', JSON.stringify(recentHistory));

        files.forEach(file => {
            formData.append('files', file);
        });

        const res = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
        });

        if (!res.body) throw new Error("Response body not available.");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let incompleteChunk = '';

        while (true) {
            const { value, done } = await reader.read();
            if (done) {
                setLoading(false);
                break;
            }

            const chunk = decoder.decode(value);
            incompleteChunk += chunk;
            const eventParts = incompleteChunk.split('\n\n');
            incompleteChunk = eventParts.pop() || '';

            for (const part of eventParts) {
                if (part.startsWith('data:')) {
                    const jsonString = part.substring(5).trim();
                    try {
                        const data = JSON.parse(jsonString);
                        if (data.type === 'chunk' || data.type === 'final') {
                            const chunkText = data.text;
                            if (chunkText) {
                                updateActiveMessages(messages => {
                                    const lastMessage = messages[messages.length - 1];
                                    return [...messages.slice(0, -1), { ...lastMessage, text: lastMessage.text + chunkText }];
                                });
                            }
                        }
                    } catch (e) {
                        console.error('Failed to parse JSON part:', e, 'Part:', jsonString);
                    }
                }
            }
        }
    } catch (err) {
        updateActiveMessages(msgs => {
            const lastMsg = msgs[msgs.length - 1];
            if (lastMsg.sender === 'assistant' && lastMsg.text === '') {
                return msgs.map((m, i) =>
                    i === msgs.length - 1 ?
                        { ...m, text: 'Error contacting assistant.' } :
                        m
                );
            }
            return [...msgs, { sender: 'assistant', text: 'Error contacting assistant.', t: Date.now() }];
        });
        console.error(err);
        setLoading(false);
    } finally {
        setFiles([]);
    }
}

export async function handleKnowledgeUpload(
    event: React.ChangeEvent<HTMLInputElement>,
    ragMode: 'server' | 'client',
    setLoading: (loading: boolean) => void,
    setNotification: (n: any) => void,
    knowledgeFileInputRef: React.RefObject<HTMLInputElement>
) {
    const filesToProcess = event.target.files;
    if (!filesToProcess || filesToProcess.length === 0) return;
    setLoading(true);
    setNotification({ open: true, message: 'Indexing knowledge documents...' });

    try {
        if (ragMode === 'server') {
            const formData = new FormData();
            Array.from(filesToProcess).forEach(file => { formData.append('knowledgeFiles', file); });
            const response = await fetch('/api/rag/upload-knowledge', { method: 'POST', body: formData });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Failed to upload.');
            setNotification({ open: true, message: result.message });
        } else {
            await processAndSaveKnowledge(Array.from(filesToProcess));
            setNotification({ open: true, message: 'Knowledge documents indexed locally.' });
        }
    } catch (error) {
        console.error('Knowledge upload error:', error);
        const knowmessage = error instanceof Error ? error.message : String(error);
        setNotification({ open: true, message: `Error: ${knowmessage}` });
    } finally {
        setLoading(false);
        if (knowledgeFileInputRef.current) knowledgeFileInputRef.current.value = '';
    }
}

export async function handleSetApiKey(apiKeyInput: string, setNotification: (n: any) => void, setApiKeyInput: (key: string) => void) {
    if (!apiKeyInput) return;
    try {
        const response = await fetch('/api/set-key', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ apiKey: apiKeyInput }),
        });
        if (response.ok) {
            setNotification({ open: true, message: 'API key successfully saved. Your session is now active.' });
            setApiKeyInput('');
        } else {
            const errorData = await response.json();
            setNotification({ open: true, message: `Failed to set API key: ${errorData.message}` });
        }
    } catch (error) {
        console.error('Error setting API key:', error);
        setNotification({ open: true, message: 'Network error. Could not set API key.' });
    }
}
