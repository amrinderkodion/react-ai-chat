// components/SessionHeader.tsx
import * as React from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import SettingsIcon from '@mui/icons-material/Settings';

type Session = {
    id: string;
    title: string;
    createdAt: number;
    messages: any[];
    notes?: string;
};

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
                {sessionPanelExpanded ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: '100%' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>Session Details</Typography>
                            &emsp;
                            <IconButton size="small" onClick={() => setIsSettingsModalOpen(true)}>
                                <SettingsIcon />
                            </IconButton>
                            &emsp;
                            <Box sx={{ display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'flex-start', gap: 1 }}>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <TextField
                                        label="Enter your Gemini API Key"
                                        value={apiKeyInput}
                                        onChange={(e) => setApiKeyInput(e.target.value)}
                                        variant="outlined"
                                        size="small"
                                        sx={{ flex: 1 }}
                                    />
                                    <Button
                                        onClick={handleSetApiKey}
                                        variant="contained"
                                        color="primary"
                                    >
                                        Save
                                    </Button>
                                </Box>
                            </Box>
                            <IconButton size="small" onClick={() => setSessionPanelExpanded(e => !e)}>
                                {sessionPanelExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                            </IconButton>
                        </Box>
                        <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, width: '100%' }}>
                            <Box sx={{ flex: 1 }}>
                                <TextField
                                    label="Session Notes"
                                    multiline
                                    minRows={4}
                                    value={activeSession.notes || ''}
                                    onChange={e => updateSessionNotes(activeSession.id, e.target.value)}
                                    sx={{ bgcolor: '#fff', width: '100%' }}
                                />
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
                                    {new Date(activeSession.createdAt).toLocaleDateString()}
                                    {' '}
                                    <wbr />
                                    {(() => {
                                        const d = new Date(activeSession.createdAt);
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
                                    Messages: {activeSession.messages.length}
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
                ) : (
                    <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>Session Details</Typography>
                        &emsp;
                        <IconButton size="small" onClick={() => setIsSettingsModalOpen(true)}>
                            <SettingsIcon />
                        </IconButton>
                        &emsp;
                        <Box sx={{ display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'flex-start', gap: 1 }}>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <TextField
                                    label="Enter your Gemini API Key"
                                    value={apiKeyInput}
                                    onChange={(e) => setApiKeyInput(e.target.value)}
                                    variant="outlined"
                                    size="small"
                                    sx={{ flex: 1 }}
                                />
                                <Button
                                    onClick={handleSetApiKey}
                                    variant="contained"
                                    color="primary"
                                >
                                    Save
                                </Button>
                            </Box>
                        </Box>
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
                            {new Date(activeSession.createdAt).toLocaleDateString()}
                            {'\u00A0'}
                            <wbr />
                            {(() => {
                                const d = new Date(activeSession.createdAt);
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
    );
}