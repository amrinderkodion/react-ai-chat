// components/SessionInfo.tsx
import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

interface SessionInfoProps {
    createdAt: number;
    messageCount: number;
}

export default function SessionInfo({ createdAt, messageCount }: SessionInfoProps) {
    return (
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
                {new Date(createdAt).toLocaleDateString()}
                {' '}
                {(() => {
                    const d = new Date(createdAt);
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
                Messages: {messageCount}
            </Typography>
        </Box>
    );
}