declare module "suneditor-react" {
    import * as React from "react";
    import "suneditor/dist/css/suneditor.min.css";
  
    export interface SunEditorProps {
      setContents?: string;
      onChange?: (content: string) => void;
      setOptions?: Record<string, any>;
      getSunEditorInstance?: (sunEditor: any) => void;
      defaultValue?: string;
      placeholder?: string;
      height?: string | number;
    }
  
    export default class SunEditor extends React.Component<SunEditorProps> {}
  }
  