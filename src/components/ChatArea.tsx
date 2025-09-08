// components/ChatArea.tsx
import * as React from 'react';
import { useRef } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import Chip from '@mui/material/Chip';
import CloseIcon from '@mui/icons-material/Close';
import Tooltip from '@mui/material/Tooltip';
import MessageContent from './MessageContent.tsx';

type Msg = { sender: 'assistant' | 'user'; text: string; t?: number };
type Session = {
    id: string;
    title: string;
    createdAt: number;
    messages: Msg[];
    notes?: string;
};

interface ChatAreaProps {
    activeSession: Session;
    input: string;
    setInput: (text: string) => void;
    loading: boolean;
    sendMessage: () => void;
    files: File[];
    handlePaste: (event: React.ClipboardEvent<HTMLInputElement>) => void;
    handleRemoveFile: (file: File) => void;
    handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    endRef: React.RefObject<HTMLDivElement | null>;
}

export default function ChatArea({
    activeSession,
    input,
    setInput,
    loading,
    sendMessage,
    files,
    handlePaste,
    handleRemoveFile,
    handleFileChange,
    fileInputRef,
    endRef,
}: ChatAreaProps) {
    return (
        <>
            <Paper sx={{ flex: 1, overflowY: 'auto', p: 1, borderRadius: 2, mb: 1, bgcolor: '#f5f5f7', width: '100%', maxWidth: '100%' }}>
                {activeSession.messages.map((m, i) => (
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
                                    whiteSpace: 'pre-line',
                                }}
                            >
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
                <input
                    title="Attach Files"
                    placeholder="Attach Files"
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                    multiple
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
    );
}