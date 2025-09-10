// components/SessionNotes.tsx
import * as React from 'react';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import Box from '@mui/material/Box';
import {
	ClassicEditor, Autoformat, Autosave, BlockQuote, Bold, Code, Essentials,
	FontBackgroundColor, FontColor, FontFamily, FontSize, Fullscreen, Heading,
	HorizontalLine, Indent, IndentBlock, Italic, Link, List, ListProperties,
	Mention, Paragraph, PasteFromOffice, Strikethrough, Subscript, Superscript,
	Table, TableCaption, TableCellProperties, TableColumnResize, TableProperties,
	TableToolbar, TextTransformation, TodoList, Underline
} from 'ckeditor5';
import 'ckeditor5/ckeditor5.css';

interface SessionNotesProps {
    notes: string;
    onNotesChange: (notes: string) => void;
    styling?: React.CSSProperties;
}

export default function SessionNotes({ notes, onNotesChange, styling = {} }: SessionNotesProps) {
    const editorConfig = {
		toolbar: {
			items: [
				'undo', 'redo', '|', 'fullscreen', '|', 'heading', '|',
				'fontSize', 'fontFamily', 'fontColor', 'fontBackgroundColor', '|',
				'bold', 'italic', 'underline', 'strikethrough', 'subscript', 'superscript', 'code', '|',
				'link', 'insertTable', 'blockQuote', '|', 'bulletedList', 'numberedList', 'outdent', 'indent'
			],
			shouldNotGroupWhenFull: false
		},
		plugins: [
			Autoformat, Autosave, BlockQuote, Bold, Code, Essentials, FontBackgroundColor,
			FontColor, FontFamily, FontSize, Fullscreen, Heading, HorizontalLine, Indent,
			IndentBlock, Italic, Link, List, ListProperties, Mention, Paragraph, PasteFromOffice,
			Strikethrough, Subscript, Superscript, Table, TableCaption, TableCellProperties,
			TableColumnResize, TableProperties, TableToolbar, TextTransformation, TodoList, Underline
		],
        placeholder: 'Type or paste your content here!',
        licenseKey: 'GPL', // Or your license key
        // You can add other configurations like heading, fontSize, etc. here
	};
    return (
        <Box sx={{ flex: 1, ...styling }}>
            <CKEditor
                config={editorConfig}
                editor={ClassicEditor as any}
                data={notes}
                onChange={(event, editor) => {
                    const data = editor.getData();
                    onNotesChange(data);
                }}
            />
        </Box>
    );
}