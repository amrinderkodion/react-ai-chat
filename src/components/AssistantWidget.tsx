import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import Collapse from '@mui/material/Collapse';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';

const ASSISTANT_COLLAPSE_KEY = 'assistant_collapsed_v1';
const ASSISTANT_POS_KEY = 'assistant_position_v1';

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export default function AssistantWidget() {
  const [messages, setMessages] = useState<{ sender: 'assistant' | 'user'; text: string }[]>(
    [{ sender: 'assistant', text: "Welcome! I’m your AI assistant. Need any help or tips?" }]
  );
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      const raw = localStorage.getItem(ASSISTANT_COLLAPSE_KEY);
      return raw === '1';
    } catch {
      return false;
    }
  });

  const [pos, setPos] = useState<{ left: number; top: number } | null>(() => {
    try {
      const raw = localStorage.getItem(ASSISTANT_POS_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const containerRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);
  const pointerIdRef = useRef<number | null>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const movedRef = useRef(false);
  const startPointRef = useRef({ x: 0, y: 0 });
  const MOVE_THRESHOLD = 6; // px - small movement still counts as click

  useEffect(() => {
    try {
      localStorage.setItem(ASSISTANT_COLLAPSE_KEY, collapsed ? '1' : '0');
    } catch {}
  }, [collapsed]);

  useEffect(() => {
    try {
      if (pos) localStorage.setItem(ASSISTANT_POS_KEY, JSON.stringify(pos));
      else localStorage.removeItem(ASSISTANT_POS_KEY);
    } catch {}
  }, [pos]);

  const startDrag = (e: React.PointerEvent) => {
    const node = containerRef.current;
    if (!node) return;

    // record start point to detect click vs drag
    startPointRef.current = { x: e.clientX, y: e.clientY };
    movedRef.current = false;

    try {
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
    } catch {
      try { node.setPointerCapture?.(e.pointerId); } catch {}
    }

    draggingRef.current = true;
    pointerIdRef.current = e.pointerId;
    const rect = node.getBoundingClientRect();
    dragOffsetRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };

    const onMove = (ev: PointerEvent) => {
      if (!draggingRef.current || pointerIdRef.current !== ev.pointerId || !containerRef.current) return;
      const dx = Math.abs(ev.clientX - startPointRef.current.x);
      const dy = Math.abs(ev.clientY - startPointRef.current.y);
      if (dx > MOVE_THRESHOLD || dy > MOVE_THRESHOLD) movedRef.current = true;

      // if moved enough, perform drag
      if (movedRef.current) {
        const width = containerRef.current.offsetWidth;
        const height = containerRef.current.offsetHeight;
        const newLeft = clamp(ev.clientX - dragOffsetRef.current.x, 8, window.innerWidth - width - 8);
        const newTop = clamp(ev.clientY - dragOffsetRef.current.y, 8, window.innerHeight - height - 8);
        setPos({ left: newLeft, top: newTop });
      }
    };

    const onUp = (ev: PointerEvent) => {
      if (pointerIdRef.current !== ev.pointerId) return;
      draggingRef.current = false;
      try { (e.currentTarget as Element).releasePointerCapture(ev.pointerId); } catch {
        try { containerRef.current?.releasePointerCapture?.(ev.pointerId); } catch {}
      }
      pointerIdRef.current = null;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);

      // if pointer never moved beyond threshold, treat as a click (toggle expand)
      if (!movedRef.current) {
        setCollapsed(false);
      }
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userText = input;
    setMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { sender: 'assistant', text: data.reply ?? "Sorry, couldn't respond." }]);
    } catch {
      setMessages(prev => [...prev, { sender: 'assistant', text: "Sorry, I couldn’t respond." }]);
    } finally {
      setLoading(false);
      if (collapsed) setCollapsed(false);
    }
  };

  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    zIndex: 1333,
    width: 340,
    left: typeof pos?.left === 'number' ? pos.left : undefined,
    top: typeof pos?.top === 'number' ? pos.top : undefined,
    right: pos ? undefined : 24,
    bottom: pos ? undefined : 24,
    touchAction: 'none',
  };

  const collapsedStyle: React.CSSProperties = {
    position: 'fixed',
    zIndex: 1333,
    width: 56,
    height: 56,
    borderRadius: '50%',
    right: pos && typeof pos.left === 'number' ? undefined : 24,
    bottom: pos && typeof pos.top === 'number' ? undefined : 24,
    left: typeof pos?.left === 'number' ? pos.left : undefined,
    top: typeof pos?.top === 'number' ? pos.top : undefined,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    touchAction: 'none',
    background: '#1976d2',
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
  };

  return (
    <>
      {collapsed ? (
        <Box ref={containerRef} sx={collapsedStyle} onPointerDown={startDrag}>
          <Tooltip title="Open AI Assistant">
            <IconButton
              color="primary"
              size="large"
              sx={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                bgcolor: '#1976d2',
                color: '#fff',
                boxShadow: 2,
                '&:hover': { bgcolor: '#1565c0' },
              }}
              onPointerDown={e => {
                e.stopPropagation();
                e.preventDefault();
                setCollapsed(false);
              }}
            >
              <ChatBubbleOutlineIcon fontSize="large" />
            </IconButton>
          </Tooltip>
        </Box>
      ) : (
        <Box ref={containerRef} sx={containerStyle}>
          <Paper elevation={8} sx={{ borderRadius: 3, overflow: 'hidden' }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                bgcolor: '#1976d2',
                color: '#fff',
                px: 2,
                py: 1,
                cursor: 'grab',
                userSelect: 'none',
              }}
              onPointerDown={startDrag}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <DragIndicatorIcon fontSize="small" />
                <Typography variant="subtitle1" fontWeight={600}>
                  AI Assistant
                </Typography>
              </Box>
              <IconButton
                size="small"
                sx={{ color: '#fff' }}
                onPointerDown={e => {
                  e.stopPropagation();
                  e.preventDefault();
                  setCollapsed(true);
                }}
                aria-label="Collapse assistant"
              >
                <CloseIcon />
              </IconButton>
            </Box>

            <Box sx={{ maxHeight: 260, overflowY: 'auto', px: 2, py: 1, bgcolor: '#f5f5f7' }}>
              {messages.map((msg, i) => (
                <Box
                  key={i}
                  sx={{
                    display: 'flex',
                    justifyContent: msg.sender === 'assistant' ? 'flex-start' : 'flex-end',
                    mb: 1,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {msg.sender === 'assistant' && (
                      <Avatar sx={{ width: 28, height: 28, bgcolor: '#1976d2', fontSize: 16 }}>AI</Avatar>
                    )}
                    <Box
                      sx={{
                        bgcolor: msg.sender === 'assistant' ? '#e3f2fd' : '#d1e7dd',
                        px: 1.5,
                        py: 1,
                        borderRadius: 2,
                        maxWidth: 220,
                        fontSize: 14,
                        wordBreak: 'break-word',
                      }}
                    >
                      {msg.text}
                    </Box>
                    {msg.sender === 'user' && (
                      <Avatar sx={{ width: 28, height: 28, bgcolor: '#eee', color: '#1976d2', fontSize: 16 }}>You</Avatar>
                    )}
                  </Box>
                </Box>
              ))}
              {loading && (
                <Typography variant="body2" color="text.secondary" sx={{ px: 1 }}>
                  Assistant is typing...
                </Typography>
              )}
            </Box>

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                borderTop: '1px solid #eee',
                px: 2,
                py: 1,
                bgcolor: '#fafafa',
                gap: 1,
              }}
            >
              <TextField
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                size="small"
                variant="outlined"
                placeholder="Type your question..."
                sx={{ flex: 1, bgcolor: '#fff' }}
                disabled={loading}
                autoFocus
              />
              <Button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                variant="contained"
                color="primary"
                sx={{ minWidth: 0, px: 2, borderRadius: 2 }}
                endIcon={<SendIcon />}
              >
                Send
              </Button>
            </Box>
          </Paper>
        </Box>
      )}
    </>
  );
}