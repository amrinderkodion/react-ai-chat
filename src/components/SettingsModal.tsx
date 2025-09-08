// components/SettingsModal.tsx
import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import CloseIcon from '@mui/icons-material/Close';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

interface SettingsModalProps {
    open: boolean;
    onClose: () => void;
    isRagEnabled: boolean;
    ragMode: 'server' | 'client';
    setRagMode: (mode: 'server' | 'client') => void;
    handleKnowledgeUpload: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
    knowledgeFileInputRef: React.RefObject<HTMLInputElement | null>; // Change this line
    loading: boolean;
}

export default function SettingsModal({
    open,
    onClose,
    isRagEnabled,
    ragMode,
    setRagMode,
    handleKnowledgeUpload,
    knowledgeFileInputRef,
    loading,
}: SettingsModalProps) {
    return (
        <Modal
            open={open}
            onClose={onClose}
            aria-labelledby="settings-modal-title"
            aria-describedby="settings-modal-description"
        >
            <Box sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: "max-content",
                maxWidth: "calc(90%)",
                bgcolor: 'background.paper',
                boxShadow: 24,
                p: 4,
                pt: 2
            }}>
                <Typography id="settings-modal-title" variant="h6" component="h2">
                    Settings
                </Typography>
                <IconButton
                    aria-label="close"
                    onClick={onClose}
                    sx={{
                        position: 'absolute',
                        right: 8,
                        top: 8,
                    }}
                >
                    <CloseIcon />
                </IconButton>
                <Typography id="settings-modal-description" sx={{ mt: 2 }}>
                    Manage your application settings here.
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {isRagEnabled && (
                        <Box sx={{ alignSelf: 'flex-start', ml: 1, borderLeft: '1px solid #ddd', pl: 1, mt: 2 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }} mb={1}>Knowledge Base</Typography>
                            <Typography variant="caption" display="block" color="text.secondary" mb={1}>
                                Upload TXT or MD files <br />for the AI to use as context.
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
                    <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'left', gap: 2 }}>
                        <Typography variant="body2">RAG Mode:</Typography>
                        <Button
                            variant={ragMode === 'server' ? 'contained' : 'outlined'}
                            onClick={() => setRagMode('server')}
                        >
                            Server-Side
                        </Button>
                        <Button
                            variant={ragMode === 'client' ? 'contained' : 'outlined'}
                            onClick={() => setRagMode('client')}
                        >
                            Client-Side
                        </Button>
                    </Box>
                </Box>
            </Box>
        </Modal>
    );
}