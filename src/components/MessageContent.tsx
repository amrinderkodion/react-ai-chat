// components/MessageContent.tsx

import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import Chip from '@mui/material/Chip';
import Link from '@mui/material/Link';
import Divider from '@mui/material/Divider';
import TableContainer from '@mui/material/TableContainer';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import remarkGfm from 'remark-gfm';



const Paragraph: Components['p'] = ({ children, ...props }) => (
  <Typography sx={{ whiteSpace: 'pre-line', mb: 1.5 }} {...props}>
    {children}
  </Typography>
);

const Strong: Components['strong'] = ({ children, ...props }) => (
  <Typography component="strong" fontWeight="bold" {...props}>{children}</Typography>
);

const UnorderedList: Components['ul'] = ({ children, ...props }) => (
  <List sx={{ pl: 2, listStyleType: 'disc', mb: 1 }} {...props}>{children}</List>
);

const OrderedList: Components['ol'] = ({ children, ...props }) => (
  <List sx={{ pl: 2, listStyleType: 'decimal', mb: 1 }} {...props}>{children}</List>
);

const ListItemContent: Components['li'] = ({ children, ...props }) => (
  <ListItem sx={{ display: 'list-item', p: 0, '&::marker': { fontSize: '1.2em' } }} {...props}>
    <Typography component="span">{children}</Typography>
  </ListItem>
);

const MarkdownLink: Components['a'] = (props) => (
  <Link href={props.href} target="_blank" rel="noopener" {...props} />
);

const TableWrapper: Components['table'] = (props) => (
  <TableContainer sx={{ my: 2 }}>
    <Table size="small" sx={{ borderCollapse: 'collapse' }} {...props} />
  </TableContainer>
);

const TableHeader: Components['thead'] = (props) => <TableHead {...props} />;
const TableBodyWrapper: Components['tbody'] = (props) => <TableBody {...props} />;
const TableRowWrapper: Components['tr'] = (props) => <TableRow {...props} />;

const TableCellHeader: Components['th'] = ({ children, align, ...props }) => (
  <TableCell component="th" sx={{ 
      fontWeight: 'bold',
      border: '1px solid', 
      borderColor: 'divider', 
      p: 1.5,
    }} {...props}
  >
    {children}
  </TableCell>
);

const TableCellBody: Components['td'] = ({ children, align, ...props }) => (
  <TableCell component="td" 
  sx={{
    border: '1px solid', // Add border to cells
    borderColor: 'divider', // Use Material-UI's divider color
    p: 1.5, // Padding for better spacing
  }}
  {...props}
  >
    {children}
  </TableCell>
);


const Image: Components['img'] = (props) => (
  <Box
    component="img"
    src={props.src}
    alt={props.alt}
    title={props.title}
    sx={{ maxWidth: '100%', height: 'auto', display: 'block', margin: 'auto' }}
  />
);

const Blockquote: Components['blockquote'] = ({ children, ...props }) => (
  <Box
    component="blockquote"  // <--- This is the key change
    sx={{
      borderLeft: '4px solid #ccc',
      pl: 2,
      my: 1,
      fontStyle: 'italic',
      color: 'text.secondary',
    }}
    {...props}
  >
    {children}
  </Box>
);

const CodeBlock: React.FC<React.PropsWithChildren<any>> = (props) => {
  const { inline, className, children } = props;
  const match = /language-(\w+)/.exec(className || '');
  
  if (!inline && match) {
    const language = match[1];
    return (
      <Paper elevation={1} sx={{ bgcolor: '#2d2d2d', color: '#f8f8f2', p: 1.5, my: 1, borderRadius: 1, overflowX: 'auto', position: 'relative' }}>
        <Chip
          label={language}
          size="small"
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            bgcolor: 'rgba(255, 255, 255, 0.1)',
            color: '#fff',
            fontFamily: 'monospace',
          }}
        />
        <pre style={{ margin: 0, marginTop: '16px' }}>
          <code className={className}>{String(children).replace(/\n$/, '')}</code>
        </pre>
      </Paper>
    );
  }

  // Handle inline code
  return (
    <code className={className}>{children}</code>
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
        remarkPlugins={[remarkGfm]}
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
          ol: OrderedList,
          li: ListItemContent,
          code: CodeBlock,
          a: MarkdownLink,
          blockquote: Blockquote,
          hr: (props) => <Divider sx={{ my: 2 }} {...props} />,
          img: Image,
          table: TableWrapper,
          thead: TableHeader,
          tbody: TableBodyWrapper,
          tr: TableRowWrapper,
          th: TableCellHeader,
          td: TableCellBody,
        }}
      >
        {cleanMarkdown(text)}
      </ReactMarkdown>
    </Box>
  );
};

const cleanMarkdown = (markdown: string): string => {
  return markdown
    .split('\n')
    .map(line => line.trim())
    .join('\n');
};

export default MessageContent;