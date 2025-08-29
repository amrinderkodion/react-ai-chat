import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';

interface MessageContentProps {
  text: string;
  sender: string;
}

const MessageContent = ({text, sender }: MessageContentProps) => {
  if (sender === 'user') {
    return (
      <Typography sx={{ whiteSpace: 'pre-line' }}>
        {text}
      </Typography>
    );
  }

  // Logic for 'assistant' messages
  const parts = [];
  const codeRegex = /```(.*?)```/gs;
  let lastIndex = 0;
  let match;

  while ((match = codeRegex.exec(text)) !== null) {
    const preCodeText = text.substring(lastIndex, match.index);
    if (preCodeText) {
      parts.push(<Typography key={`text-${lastIndex}`} sx={{ whiteSpace: 'pre-line' }}>{preCodeText}</Typography>);
    }

    const code = match[1];
    parts.push(
      <Paper key={`code-${match.index}`} elevation={1} sx={{ bgcolor: '#2d2d2d', color: '#f8f8f2', p: 1.5, my: 1, borderRadius: 1, overflowX: 'auto' }}>
        <pre style={{ margin: 0 }}>
          <code style={{ fontFamily: 'monospace' }}>
            {code.trim()}
          </code>
        </pre>
      </Paper>
    );

    lastIndex = codeRegex.lastIndex;
  }

  const remainingText = text.substring(lastIndex);
  if (remainingText) {
    parts.push(<Typography key={`text-${lastIndex}`} sx={{ whiteSpace: 'pre-line' }}>{remainingText}</Typography>);
  }

  return <Box>{parts}</Box>;
};

export default MessageContent;