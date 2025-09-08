// components/SettingsButton.tsx
import * as React from 'react';
import IconButton from '@mui/material/IconButton';
import SettingsIcon from '@mui/icons-material/Settings';
import Tooltip from '@mui/material/Tooltip';
import Box from '@mui/material/Box';

interface SettingsButtonProps {
    onClick: () => void;
}

export default function SettingsButton({ onClick }: SettingsButtonProps) {
    return (
        <Box>
            <Tooltip title="Settings" >
                <IconButton size="small" onClick={onClick}>
                    <SettingsIcon />
                </IconButton>
            </Tooltip>
        </Box>
    );
}