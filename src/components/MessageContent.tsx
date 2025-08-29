// components/MessageContent.tsx

import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';


const Paragraph: Components['p'] = ({ children, ...props }) => (
  <Typography sx={{ whiteSpace: 'pre-line', mb: 1.5 }} {...props}>
    {children}
  </Typography>
);

const Strong: Components['strong'] = ({ children, ...props }) => (
  <Typography component="strong" fontWeight="bold" {...props}>{children}</Typography>
);

const UnorderedList: Components['ul'] = ({ children, ...props }) => (
  <List sx={{ pl: 2, mb: 1 }} {...props}>{children}</List>
);

const ListItemContent: Components['li'] = ({ children, ...props }) => (
  <ListItem sx={{ display: 'list-item', p: 0, '&::before': { content: '"\\2022"', pr: 1.5 } }} {...props}>
    <Typography component="span">{children}</Typography>
  </ListItem>
);

const CodeBlock: React.FC<React.PropsWithChildren<any>> = (props) => {
  const { inline, className, children, ...rest } = props;
  const match = /language-(\w+)/.exec(className || '');
  
  return !inline && match ? (
    <Paper elevation={1} sx={{ bgcolor: '#2d2d2d', color: '#f8f8f2', p: 1.5, my: 1, borderRadius: 1, overflowX: 'auto' }}>
      <pre style={{ margin: 0 }}>
        <code className={className} {...rest}>
          {String(children).replace(/\n$/, '')}
        </code>
      </pre>
    </Paper>
  ) : (
    <code className={className} {...rest}>
      {children}
    </code>
  );
};

type MessageContentProps = {
  text: string;
  sender: 'user' | 'assistant';
};


const MessageContent = ({ text, sender }:MessageContentProps) => {
  if (sender === 'user') {
    return (
      <Typography sx={{ whiteSpace: 'pre-line' }}>{text}</Typography>
    );
  }

  return (
    <Box>
      <ReactMarkdown
        components={{
          h1: ({ node, ...props }) => <Typography variant="h1" component="h1" gutterBottom {...props} />,
          h2: ({ node, ...props }) => <Typography variant="h2" component="h2" gutterBottom {...props} />,
          h3: ({ node, ...props }) => <Typography variant="h3" component="h3" gutterBottom {...props} />,
          h4: ({ node, ...props }) => <Typography variant="h4" component="h4" gutterBottom {...props} />,
          h5: ({ node, ...props }) => <Typography variant="h5" component="h5" gutterBottom {...props} />,
          h6: ({ node, ...props }) => <Typography variant="h6" component="h6" gutterBottom {...props} />,
          p: Paragraph,
          strong: Strong,
          ul: UnorderedList,
          li: ListItemContent,
          code: CodeBlock,
        }}
      >
        {text}
      </ReactMarkdown>
    </Box>
  );
};

export default MessageContent;