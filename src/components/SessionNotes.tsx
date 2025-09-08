// components/SessionNotes.tsx
import * as React from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';

interface SessionNotesProps {
    notes: string;
    onNotesChange: (notes: string) => void;
    styling?: React.CSSProperties;
}

export default function SessionNotes({ notes, onNotesChange, styling }: SessionNotesProps) {
    return (
        <Box sx={{width: '100%', ...styling }}>
            <TextField
                label="Session Notes"
                multiline
                minRows={4}
                value={notes}
                onChange={e => onNotesChange(e.target.value)}
                sx={{bgcolor: '#fff', width: '100%'}}
            />
        </Box>
    );
}