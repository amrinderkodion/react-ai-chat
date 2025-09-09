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
    const [sessionPanelExpanded, setSessionPanelExpanded] = React.useState(true);

    return (
        <Box sx={{ display: 'flex', gap: 1, mb: 1, justifyContent: 'flex-end', alignItems: 'center' }}>
            <Paper sx={{ width: '100%', p: 1, borderRadius: 2, bgcolor: '#fafafa', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
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
                    <IconButton size="small" onClick={() => setSessionPanelExpanded(e => !e)}>
                        {sessionPanelExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                </Box>
                {sessionPanelExpanded && (
                    <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, width: '100%' }}>
                        <SessionNotes
                            key={activeSession.id}
                            notes={activeSession.notes || ''}
                            onNotesChange={(notes) => updateSessionNotes(activeSession.id, notes)}
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