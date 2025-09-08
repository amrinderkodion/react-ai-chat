// components/SessionList.tsx
import * as React from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import AddIcon from '@mui/icons-material/Add';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import Tooltip from '@mui/material/Tooltip';

type Msg = { sender: 'assistant' | 'user'; text: string; t?: number };
type Session = {
    id: string;
    title: string;
    createdAt: number;
    messages: Msg[];
    notes?: string;
};

interface SessionListProps {
    sessions: Session[];
    activeId: string;
    setActiveId: (id: string) => void;
    createNewSession: () => void;
    deleteSession: (id: string) => void;
    updateSessionTitle: (id: string, title: string) => void;
    exportSession: (s: Session) => void;
}

export default function SessionList({
    sessions,
    activeId,
    setActiveId,
    createNewSession,
    deleteSession,
    updateSessionTitle,
    exportSession,
}: SessionListProps) {
    return (
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
                                    localStorage.removeItem('manager_chat_sessions_v1');
                                    // You might need to handle resetting the state in the parent component
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
                                    // You need to duplicate logic in the parent component
                                }}>
                                    <ContentCopyIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        </Box>
                    </Paper>
                );
            })}
        </Paper>
    );
}