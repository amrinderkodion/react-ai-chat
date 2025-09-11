import React from "react";
import SunEditor from "suneditor-react";
import "suneditor/dist/css/suneditor.min.css"; // Import SunEditor styles
import Box from '@mui/material/Box';


interface SessionNotesProps {
  notes: string;
  onNotesChange: (notes: string) => void;
  styling?: React.CSSProperties;
}

export default function SessionNotes({
  notes,
  onNotesChange,
  styling = {},
}: SessionNotesProps) {
  return (
    <Box style={{ flex: 1, ...styling }}>
      <SunEditor
        setContents={notes}
        onChange={onNotesChange}
        setOptions={{
          height: "400px",
          buttonList: [
            // Toolbar buttons
            ["undo", "redo"],
            ["bold", "italic", "underline", "strike"],
            ["font", "fontSize", "formatBlock"],
            ["fontColor", "hiliteColor"], // Text color + Background color
            ["removeFormat"],
            ["outdent", "indent"],
            ["align", "list"],
            ["link", "table"],
            ["fullScreen", "showBlocks", "codeView"], // Fullscreen
          ],
          defaultStyle: "font-family: Arial; font-size: 16px;",
          defaultTag: "div",
          showPathLabel: false,
          resizingBar: true,
        }}
      />
    </Box>
  );
}
