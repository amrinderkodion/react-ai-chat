import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import AddIcon from '@mui/icons-material/Add';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import Tooltip from '@mui/material/Tooltip';
import Chip from '@mui/material/Chip';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import MessageContent from '../components/MessageContent.tsx';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import CloudUploadIcon from '@mui/icons-material/CloudUpload'; // Import new icon
import Snackbar from '@mui/material/Snackbar'; // For notifications
import CloseIcon from '@mui/icons-material/Close';

type Msg = { sender: 'assistant' | 'user'; text: string; t?: number };
type Session = {
  id: string;
  title: string;
  createdAt: number;
  messages: Msg[];
  notes?: string;
};

const STORAGE_KEY = 'manager_chat_sessions_v1';
const API_KEY_STORAGE = 'manager_chat_gemini_key_v1';

function loadSessions(): Session[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Session[];
  } catch {
    return [];
  }
}

function saveSessions(sessions: Session[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch {}
}

function newSessionTemplate(): Session {
  const now = Date.now();
  return {
    id: String(now) + '-' + Math.random().toString(36).slice(2, 8),
    title: `Session ${new Date(now).toLocaleString()}`,
    createdAt: now,
    messages: [
      {
        sender: 'assistant',
        text: "Welcome, Manager — I'm here to help you practice leadership scenarios, 1:1s, feedback, interviewing, or give tips. What would you like to try?",
        t: now,
      },
    ],
    notes: '',
  };
}

export default function ManagerChatPage() {
  const [sessions, setSessions] = useState<Session[]>(() => {
    const loaded = loadSessions();
    if (loaded.length === 0) {
      const s = newSessionTemplate();
      saveSessions([s]);
      return [s];
    }
    return loaded;
  });

  const [activeId, setActiveId] = useState<string>(() => sessions[0]?.id || '');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [geminiKey, setGeminiKey] = useState<string>(() => localStorage.getItem(API_KEY_STORAGE) || '');
  const [editingKey, setEditingKey] = useState(false);
  const [sessionPanelExpanded, setSessionPanelExpanded] = useState(true);
  const endRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [isRagEnabled, setIsRagEnabled] = useState(false);
  const knowledgeFileInputRef = useRef<HTMLInputElement>(null);
  const [notification, setNotification] = useState({ open: false, message: '' });

  useEffect(() => {
    if (!activeId && sessions.length) setActiveId(sessions[0].id);
    saveSessions(sessions);
  }, [sessions, activeId]);

  const active = sessions.find(s => s.id === activeId) || sessions[0];

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [active?.messages.length, loading]);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch('/api/config');
        const config = await response.json();
        setIsRagEnabled(config.isRagEnabled);
      } catch (error) {
        console.error("Could not fetch server configuration:", error);
      }
    };
    fetchConfig();
  }, []);

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    const newFiles: File[] = [];
    const items = event.clipboardData.items;
    
    // Iterate through all clipboard items
    for (const item of items) {
      // Check if the item is a file
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file) {
          newFiles.push(file);
        }
      }
    }

    // Add new files to the state if any were found
    if (newFiles.length > 0) {
      setFiles((prevFiles) => [...prevFiles, ...newFiles]);
      // Prevent the default paste behavior to avoid pasting the file name into the text area.
      event.preventDefault(); 
    }
  };

  const handleRemoveFile = (fileToRemove: File) => {
    setFiles((prevFiles) => prevFiles.filter((file) => file !== fileToRemove));
  };

  const handleKnowledgeUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    if (!geminiKey) {
      setNotification({ open: true, message: 'Please set your Gemini API key first.' });
      return;
    }

    const formData = new FormData();
    formData.append('apiKey', geminiKey);
    Array.from(files).forEach(file => {
      formData.append('knowledgeFiles', file);
    });

    try {
      setLoading(true);
      setNotification({ open: true, message: 'Indexing knowledge documents...' });

      const response = await fetch('/api/rag/upload-knowledge', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Failed to upload.');
      }
      
      setNotification({ open: true, message: result.message });
    } catch (error) {
      console.error('Knowledge upload error:', error);
      if (error instanceof Error) {
        const knowmessage = error.message;
        setNotification({ open: true, message: `Error: ${knowmessage}` });
      }
    } finally {
      setLoading(false);
      // Reset the file input so the same file can be re-uploaded
      if (knowledgeFileInputRef.current) {
        knowledgeFileInputRef.current.value = '';
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const updateActiveMessages = (updater: (m: Msg[]) => Msg[]) => {
    setSessions(prev =>
      prev.map(s => (s.id === active?.id ? { ...s, messages: updater(s.messages) } : s)),
    );
  };

  const sendMessage = async () => {
    const text = input.trim();
    const active = sessions.find(s => s.id === activeId) || sessions[0];
    if (!text && files.length === 0) return;

    const ts = Date.now();

    // Add a placeholder message for the assistant's response
    const assistantPlaceholder = { sender: 'assistant' as const, text: '' as const, t: Date.now() };

    if (files.length > 0) {
      const fileNames = files.map(f => f.name).join(', ');
      updateActiveMessages(msgs => [...msgs, { sender: 'user', text: `Files attached: ${fileNames}`, t: ts }, assistantPlaceholder]);
    } else {
      updateActiveMessages(msgs => [...msgs, { sender: 'user', text, t: ts }, assistantPlaceholder]);
    }

    setInput('');
    setFiles([]);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('apiKey', geminiKey);
      formData.append('message', text);

      const historyLimit = 10;
      const recentHistory = active.messages.slice(-historyLimit);
      formData.append('history', JSON.stringify(recentHistory));

      files.forEach(file => {
        formData.append('files', file);
      });

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      console.log('Fetch response received:', res.status, res.statusText);

      if (!res.body) {
        console.error("Response body not available.");
        throw new Error("Response body not available.");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let incompleteChunk = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          console.log('Client received complete stream.');
          setLoading(false);
          break;
        }
      
        const chunk = decoder.decode(value);
        console.log('Client received raw chunk:', chunk);
        incompleteChunk += chunk;
      
        // Process complete event stream messages
        const eventParts = incompleteChunk.split('\n\n');
        incompleteChunk = eventParts.pop() || '';
      
        for (const part of eventParts) {
          if (part.startsWith('data:')) {
            const jsonString = part.substring(5).trim();
            try {
              const data = JSON.parse(jsonString);
              
              // Check the type of data to handle chunks and the final response
              if (data.type === 'chunk') {
                console.log('Client parsed JSON chunk:', data);
                const chunkText = data.text;
                if (chunkText) {
                  updateActiveMessages(messages => {
                    const lastMessage = messages[messages.length - 1];
                    return [...messages.slice(0, -1), { ...lastMessage, text: lastMessage.text + chunkText }];
                  });
                }
              } else if (data.type === 'final') {
                console.log('Client parsed JSON final:', data);
                const finalText = data.text;
                if (finalText) {
                  updateActiveMessages(messages => {
                    const lastMessage = messages[messages.length - 1];
                    return [...messages.slice(0, -1), { ...lastMessage, text: finalText }];
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
  };

  const createNewSession = () => {
    const s = newSessionTemplate();
    setSessions(prev => [s, ...prev]);
    setActiveId(s.id);
  };

  const deleteSession = (id: string) => {
    const idx = sessions.findIndex(s => s.id === id);
    const next = sessions.filter(s => s.id !== id);
    setSessions(next);
    if (id === activeId) {
      setActiveId(next[idx] ? next[idx].id : next[0]?.id || '');
    }
  };

  const updateSessionTitle = (id: string, title: string) => {
    setSessions(prev => prev.map(s => (s.id === id ? { ...s, title } : s)));
  };

  const updateSessionNotes = (id: string, notes: string) => {
    setSessions(prev => prev.map(s => (s.id === id ? { ...s, notes } : s)));
  };

  const exportSession = (s: Session) => {
    const data = JSON.stringify(s, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${s.title.replace(/[^\w-]/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Box sx={{ display: 'flex', gap: 1, p: 1, height: '100vh', width: '100%' }}>
      {/* Session List */}
      <Paper elevation={3} sx={{ width: 300, p: 1, borderRadius: 3, height: '100%', overflowY: 'auto', bgcolor: '#f5f5f7' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6" fontWeight={700}>Sessions</Typography>
          <Box>
            <Tooltip title="New Session">
              <IconButton onClick={createNewSession} sx={{ mr: 1 }} color="primary">
                <AddIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Clear All">
              <IconButton
                onClick={() => {
                  if (window.confirm('Clear all saved sessions?')) {
                    localStorage.removeItem(STORAGE_KEY);
                    const s = newSessionTemplate();
                    setSessions([s]);
                    setActiveId(s.id);
                  }
                }}
                color="error"
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        {sessions.map(s => {
          const last = s.messages[s.messages.length - 1];
          return (
            <Paper
              key={s.id}
              elevation={s.id === activeId ? 6 : 1}
              sx={{
                p: 1.5,
                mb: 1,
                borderRadius: 2,
                cursor: 'pointer',
                bgcolor: s.id === activeId ? '#e3f2fd' : '#fff',
                border: s.id === activeId ? '2px solid #1976d2' : '1px solid #eee',
                transition: 'border 0.2s',
              }}
              onClick={() => setActiveId(s.id)}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                <TextField
                  value={s.title}
                  onChange={e => updateSessionTitle(s.id, e.target.value)}
                  variant="standard"
                  sx={{ fontWeight: 600, width: '70%' }}
                  InputProps={{ disableUnderline: true, style: { fontWeight: 600 } }}
                />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    ml: 1,
                    width: '4.05rem',
                    minWidth: 0,
                    textAlign: 'right',
                    whiteSpace: 'normal',
                    wordBreak: 'keep-all',
                    lineHeight: 1.2,
                    display: 'inline-block',
                  }}
                >
                  {new Date(s.createdAt).toLocaleDateString()}
                  {'\u00A0'}
                  <wbr />
                  {(() => {
                    const d = new Date(s.createdAt);
                    const timeParts = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }).split(' ');
                    // timeParts[0] = "12:01:31", timeParts[1] = "PM" or "AM"
                    return (
                      <>
                        {timeParts[0]}
                        {'\u00A0'}
                        {timeParts[1]}
                      </>
                    );
                  })()}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', mt: 0.5 }}>
                {last ? `${last.sender === 'user' ? 'You: ' : ''}${last.text}` : 'No messages yet'}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                <Tooltip title="Export">
                  <IconButton size="small" onClick={e => { e.stopPropagation(); exportSession(s); }}>
                    <FileDownloadIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                  <IconButton size="small" color="error" onClick={e => { e.stopPropagation(); deleteSession(s.id); }}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Duplicate">
                  <IconButton size="small" color="primary" onClick={e => {
                    e.stopPropagation();
                    const newS = newSessionTemplate();
                    setSessions(prev => [newS, ...prev]);
                    setActiveId(newS.id);
                  }}>
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Paper>
          );
        })}
      </Paper>

      {/* Chat Area */}
      <Box sx={{ flex: 1, width: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
        {active ? (
          <>
            <Box sx={{ display: 'flex', gap: 1, mb: 1, justifyContent: 'flex-end', alignItems: 'center' }}>
              <Paper sx={{ width: '100%', p: 1, borderRadius: 2, bgcolor: '#fafafa', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
                
                {sessionPanelExpanded ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: '100%' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>Session Details</Typography>
                      <IconButton size="small" onClick={() => setSessionPanelExpanded(e => !e)}>
                        {sessionPanelExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, width: '100%' }}>
                      {isRagEnabled && (
                        <Box sx={{ alignSelf: 'flex-start', ml: 1, borderLeft: '1px solid #ddd', pl: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }} mb={1}>Knowledge Base</Typography>
                          <Typography variant="caption" display="block" color="text.secondary" mb={1}>
                            Upload TXT or MD files for the AI to use as context.
                          </Typography>
                          <input
                            type="file"
                            ref={knowledgeFileInputRef}
                            onChange={handleKnowledgeUpload}
                            style={{ display: 'none' }}
                            multiple
                            accept=".txt,.md"
                          />
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<CloudUploadIcon />}
                            onClick={() => knowledgeFileInputRef.current?.click()}
                            disabled={loading}
                          >
                            Upload Docs
                          </Button>
                        </Box>
                      )}
                      <Box sx={{ flex: 1 }}>
                        <TextField
                          label="Session Notes"
                          multiline
                          minRows={4}
                          value={active.notes || ''}
                          onChange={e => updateSessionNotes(active.id, e.target.value)}
                          sx={{ bgcolor: '#fff', width: '100%' }}
                        />
                      </Box>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                        {editingKey ? (
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <TextField
                              size="small"
                              placeholder="Gemini API key"
                              value={geminiKey}
                              onChange={e => setGeminiKey(e.target.value)}
                            />
                            <Button
                              variant="contained"
                              onClick={() => { localStorage.setItem(API_KEY_STORAGE, geminiKey); setEditingKey(false); }}
                            >
                              Save
                            </Button>
                          </Box>
                        ) : (
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <Typography variant="caption" color="text.secondary">
                              Key: {geminiKey ? '••••••••' : 'not set'}
                            </Typography>
                            <Button size="small" onClick={() => setEditingKey(true)}>Edit</Button>
                          </Box>
                        )}
                      </Box>
                      <Box sx={{ alignSelf: 'flex-start' }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }} mb={1}>Session info</Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            width: 'min-content',
                            fontSize: 14,
                            mb: 1,
                            display: 'block',
                            whiteSpace: 'normal',
                            wordBreak: 'keep-all',
                          }}
                        >
                          Created:{' '}
                          {new Date(active.createdAt).toLocaleDateString()}
                          {' '}
                          <wbr />
                          {(() => {
                            const d = new Date(active.createdAt);
                            const timeParts = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }).split(' ');
                            return (
                              <>
                                {timeParts[0]}
                                {'\u00A0'}
                                {timeParts[1]}
                              </>
                            );
                          })()}
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          Messages: {active.messages.length}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                ) : (
                  <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography
                      variant="body2"
                      sx={{
                        textAlign: 'left',
                        fontSize: 14,
                        mb: 1,
                        display: 'block',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        flex: 1,
                        marginTop: 1,
                        fontWeight: 600
                      }}
                    >
                      Session Details
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        textAlign: 'right',
                        fontSize: 14,
                        mb: 1,
                        display: 'block',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        minWidth: 0,
                        ml: 1,
                        marginTop: 1
                      }}
                    >
                      Created:{' '}
                      {new Date(active.createdAt).toLocaleDateString()}
                      {'\u00A0'}
                      <wbr />
                      {(() => {
                        const d = new Date(active.createdAt);
                        const timeParts = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }).split(' ');
                        return (
                          <>
                            {timeParts[0]}
                            {'\u00A0'}
                            {timeParts[1]}
                          </>
                        );
                      })()}
                    </Typography>
                    &nbsp;
                    <IconButton size="small" onClick={() => setSessionPanelExpanded(e => !e)}>
                      {sessionPanelExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                  </Box>
                )}
              </Paper>
            </Box>

            <Paper sx={{ flex: 1, overflowY: 'auto', p: 1, borderRadius: 2, mb: 1, bgcolor: '#f5f5f7', width: '100%', maxWidth: '100%' }}>
              {active.messages.map((m, i) => (
                <Box key={i} sx={{ display: 'flex', justifyContent: m.sender === 'assistant' ? 'flex-start' : 'flex-end', mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {m.sender === 'assistant' && (
                      <Avatar sx={{ width: 28, height: 28, bgcolor: '#1976d2', fontSize: 16 }}>AI</Avatar>
                    )}
                    <Box
                      sx={{
                        bgcolor: m.sender === 'assistant' ? '#e3f2fd' : '#d1e7dd',
                        px: 1,
                        py: 1,
                        borderRadius: 2,
                        maxWidth: 700,
                        fontSize: 15,
                        wordBreak: 'break-word',
                        whiteSpace: 'pre-line', // <-- preserves line breaks
                      }}
                    >
                      {/* {m.text} */}
                      <MessageContent text={m.text} sender={m.sender} />
                    </Box>
                    {m.sender === 'user' && (
                      <Avatar sx={{ width: 28, height: 28, bgcolor: '#eee', color: '#1976d2', fontSize: 16 }}>You</Avatar>
                    )}
                  </Box>
                </Box>
              ))}
              {loading && (
                <Typography variant="body2" color="text.secondary" sx={{ px: 1 }}>
                  Assistant is typing...
                </Typography>
              )}
              <div ref={endRef} />
            </Paper>

            {files.length > 0 && (
              <Box sx={{ 
                bgcolor: 'background.paper', 
                p: 1, 
                mb: 1,
                borderRadius: 1, 
                boxShadow: 1, 
                display: 'flex',
                flexWrap: 'wrap',
                gap: 1,
              }}
              >
                {files.map((file, index) => (
                  <Chip
                    key={index}
                    label={file.name}
                    onDelete={() => handleRemoveFile(file)}
                    deleteIcon={<CloseIcon />}
                    variant="outlined"
                  />
                ))}
              </Box>
            )}

            <Box sx={{ display: 'flex', gap: 1 }}>
              {/* Hidden file input */}
              <input
                title="Attach Files"
                placeholder="Attach Files"
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{ display: 'none' }}
                multiple // This is the crucial attribute for multiple files
              />
              <Tooltip title="Attach Files">
                <IconButton onClick={() => fileInputRef.current?.click()}>
                  <AttachFileIcon />
                </IconButton>
              </Tooltip>
              <TextField
                value={input}
                onPaste={handlePaste} 
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder="Describe a scenario or ask for a tip..."
                multiline
                minRows={1}
                sx={{ flex: 1, bgcolor: '#fff' }}
                disabled={loading}
              />
              <Button
                onClick={sendMessage}
                disabled={loading || (!input.trim() && files.length === 0)}
                variant="contained"
                color="primary"
                sx={{ px: 3, borderRadius: 2, height: '56px', alignSelf: 'flex-end' }}
              >
                Send
              </Button>
            </Box>
          </>
        ) : (
          <Typography variant="body1" color="text.secondary">No active session</Typography>
        )}
      </Box>
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification({ ...notification, open: false })}
        message={notification.message}
      />
    </Box>
  );
}