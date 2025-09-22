// components/SessionHeader.tsx
import * as React from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import IconButton from '@mui/material/IconButton';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import Typography from '@mui/material/Typography';
import ApiKeyInput from './ApiKeyInput.tsx';
import SessionInfo from './SessionInfo.tsx';
import SessionNotes from './SessionNotes.tsx';
import SettingsButton from './SettingsButton.tsx';
import { Session } from '../types.ts';

interface SessionHeaderProps {
    activeSession: Session;
    apiKeyInput: string;
    setApiKeyInput: (key: string) => void;
    handleSetApiKey: () => void;
    updateSessionNotes: (id: string, notes: string) => void;
    setIsSettingsModalOpen: (isOpen: boolean) => void;
}

export default function SessionHeader({
    activeSession,
    apiKeyInput,
    setApiKeyInput,
    handleSetApiKey,
    updateSessionNotes,
    setIsSettingsModalOpen,
}: SessionHeaderProps) {
    const [sessionPanelExpanded, setSessionPanelExpanded] = React.useState(false);

    return (
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', alignItems: 'center' }}>
            <Paper sx={{ width: '100%', p: 1, borderRadius: 2, mb:1, bgcolor: '#fafafa', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Session Details</Typography>
                    &emsp;
                    <SettingsButton onClick={() => setIsSettingsModalOpen(true)} />
                    &emsp;
                    <Box sx={{ flex:1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1 }}>
                        <ApiKeyInput
                            apiKeyInput={apiKeyInput}
                            setApiKeyInput={setApiKeyInput}
                            handleSetApiKey={handleSetApiKey}
                        />
                    </Box>
                    <Typography
                        variant="body2"
                        sx={{
                            width: 'auto',
                            fontSize: 14,
                            display: 'block',
                            whiteSpace: 'normal',
                            wordBreak: 'keep-all',
                        }}
                    >
                        Created:{' '}
                        {new Date(activeSession.createdAt).toLocaleDateString()}
                        {' '}
                        {(() => {
                            const d = new Date(activeSession.createdAt);
                            const timeParts = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
                            return (
                                <>
                                    {timeParts}
                                </>
                            );
                        })()}
                    </Typography>
                    &nbsp;
                    <IconButton size="small" onClick={() => setSessionPanelExpanded(e => !e)}>
                        {sessionPanelExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                </Box>
                {sessionPanelExpanded && (
                    <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, width: '100%', mt:1 }}>
                        <SessionNotes
                            key={activeSession.id}
                            notes={activeSession.notes || ''}
                            onNotesChange={(notes) => updateSessionNotes(activeSession.id, notes)}
                            styling={{width:'95%'}}
                        />
                        <SessionInfo
                            createdAt={activeSession.createdAt}
                            messageCount={activeSession.messages.length}
                        />
                    </Box>
                )}
            </Paper>
        </Box>
    );
}