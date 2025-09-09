// components/SessionNotes.tsx
import * as React from 'react';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import Box from '@mui/material/Box';

interface SessionNotesProps {
    notes: string;
    onNotesChange: (notes: string) => void;
    styling?: React.CSSProperties;
}

export default function SessionNotes({ notes, onNotesChange, styling = {} }: SessionNotesProps) {
    return (
        <Box sx={{ flex: 1, ...styling }}>
            <CKEditor
                editor={ClassicEditor}
                data={notes}
                onChange={(event, editor) => {
                    const data = editor.getData();
                    onNotesChange(data);
                }}
            />
        </Box>
    );
}