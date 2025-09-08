// components/ApiKeyInput.tsx
import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';

interface ApiKeyInputProps {
    apiKeyInput: string;
    setApiKeyInput: (key: string) => void;
    handleSetApiKey: () => void;
}

export default function ApiKeyInput({ apiKeyInput, setApiKeyInput, handleSetApiKey }: ApiKeyInputProps) {
    return (
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
    );
}