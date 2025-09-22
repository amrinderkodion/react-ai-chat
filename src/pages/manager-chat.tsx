import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import Box from '@mui/material/Box';
import Snackbar from '@mui/material/Snackbar';
import SessionList from '../components/SessionList.tsx';
import ChatArea from '../components/ChatArea.tsx';
import SessionHeader from '../components/SessionHeader.tsx';
import SettingsModal from '../components/SettingsModal.tsx';
import { loadSessions, saveSessions, newSessionTemplate, exportSession } from '../utils/session-storage.ts';
import { sendMessage, handleSetApiKey, handleKnowledgeUpload } from '../utils/api-handlers.ts';
import { handlePaste, handleRemoveFile, handleFileChange } from '../utils/chat-utils.ts';
import { Msg, Session } from '../types.ts';
import Typography from '@mui/material/Typography';

export default function ManagerChatPage() {
    const [sessions, setSessions] = useState<Session[]>(() => {
        const loaded = loadSessions();
        if (loaded.length === 0) {
            const s = newSessionTemplate();
            saveSessions([s]);
            return [s];
        }
        return loaded;
    });

    const [activeId, setActiveId] = useState<string>(() => sessions[0]?.id || '');
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [apiKeyInput, setApiKeyInput] = useState('');
    const [notification, setNotification] = useState({ open: false, message: '' });
    const [ragMode, setRagMode] = useState<'server' | 'client'>('client');
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [files, setFiles] = useState<File[]>([]);
    const [isRagEnabled, setIsRagEnabled] = useState(false);
    const endRef = useRef<HTMLDivElement | null>(null);
    const knowledgeFileInputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!activeId && sessions.length) setActiveId(sessions[0].id);
        saveSessions(sessions);
    }, [sessions, activeId]);

    const active = sessions.find(s => s.id === activeId) || sessions[0];

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [active?.messages.length, loading]);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const response = await fetch('/api/config');
                const config = await response.json();
                setIsRagEnabled(config.isRagEnabled);
            } catch (error) {
                console.error("Could not fetch server configuration:", error);
            }
        };
        fetchConfig();
    }, []);

    const updateActiveMessages = (updater: (m: Msg[]) => Msg[]) => {
        setSessions(prev =>
            prev.map(s => (s.id === active?.id ? { ...s, messages: updater(s.messages) } : s)),
        );
    };

    const createNewSession = () => {
        const s = newSessionTemplate();
        setSessions(prev => [s, ...prev]);
        setActiveId(s.id);
    };

    const deleteSession = (id: string) => {
        const next = sessions.filter(s => s.id !== id);
        setSessions(next);
        if (next.length > 0) {
            if (id === activeId) {
                setActiveId(next[0].id);
            }
        } else {
            createNewSession();
        }
    };

    const updateSessionTitle = (id: string, title: string) => {
        setSessions(prev => prev.map(s => (s.id === id ? { ...s, title } : s)));
    };

    const updateSessionNotes = (id: string, notes: string) => {
        setSessions(prev => prev.map(s => (s.id === id ? { ...s, notes } : s)));
    };

    const handleClearAllSessions = () => {
        localStorage.removeItem('manager_chat_sessions_v1');
        setSessions([]);
        createNewSession()
    };

    return (
        <Box sx={{ display: 'flex', gap: 1, p: 1, height: '100vh', width: '100%' }}>
            <SessionList
                sessions={sessions}
                activeId={activeId}
                setActiveId={setActiveId}
                createNewSession={createNewSession}
                deleteSession={deleteSession}
                updateSessionTitle={updateSessionTitle}
                exportSession={exportSession}
                clearAllSessions={handleClearAllSessions}
            />

            <Box sx={{ flex: 1, width: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
                {active ? (
                    <>
                        <SessionHeader
                            activeSession={active}
                            apiKeyInput={apiKeyInput}
                            setApiKeyInput={setApiKeyInput}
                            handleSetApiKey={() => handleSetApiKey(apiKeyInput, setNotification, setApiKeyInput)}
                            updateSessionNotes={updateSessionNotes}
                            setIsSettingsModalOpen={setIsSettingsModalOpen}
                        />

                        <ChatArea
                            activeSession={active}
                            input={input}
                            setInput={setInput}
                            loading={loading}
                            sendMessage={() => sendMessage(input, files, ragMode, active, updateActiveMessages, setLoading, setInput, setFiles)}
                            files={files}
                            handlePaste={(e) => handlePaste(e, setFiles)}
                            handleRemoveFile={(file) => handleRemoveFile(file, setFiles)}
                            handleFileChange={(e) => handleFileChange(e, setFiles)}
                            fileInputRef={fileInputRef}
                            endRef={endRef}
                        />
                    </>
                ) : (
                    <Typography variant="body1" color="text.secondary">No active session</Typography>
                )}
            </Box>
            <Snackbar
                open={notification.open}
                autoHideDuration={6000}
                onClose={() => setNotification({ ...notification, open: false })}
                message={notification.message}
            />
            <SettingsModal
                open={isSettingsModalOpen}
                onClose={() => setIsSettingsModalOpen(false)}
                isRagEnabled={isRagEnabled}
                ragMode={ragMode}
                setRagMode={setRagMode}
                handleKnowledgeUpload={(e) => handleKnowledgeUpload(
                    e,
                    ragMode,
                    setLoading,
                    setNotification,
                    knowledgeFileInputRef as React.RefObject<HTMLInputElement>
                )}
                knowledgeFileInputRef={knowledgeFileInputRef as React.RefObject<HTMLInputElement>}
                loading={loading} 

                activeSession={active}
                apiKeyInput={apiKeyInput}
                setApiKeyInput={setApiKeyInput}
                handleSetApiKey={() => handleSetApiKey(apiKeyInput, setNotification, setApiKeyInput)}
                updateSessionTitle={updateSessionTitle}
            />
        </Box>
    );
}