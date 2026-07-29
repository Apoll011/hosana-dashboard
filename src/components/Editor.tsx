import React, { useRef } from 'react';
import AceEditor from 'react-ace';
import type { IAceEditor } from 'react-ace/lib/types';

import 'ace-builds/src-noconflict/ext-language_tools';
import 'ace-builds/src-noconflict/theme-textmate';
import 'ace-builds/src-noconflict/theme-github';
import 'ace-builds/src-noconflict/theme-tomorrow';
import 'ace-builds/src-noconflict/theme-solarized_light';
import 'ace-builds/src-noconflict/theme-monokai';
import 'ace-builds/src-noconflict/theme-dracula';
import 'ace-builds/src-noconflict/theme-tomorrow_night';
import 'ace-builds/src-noconflict/theme-solarized_dark';

import { useEditorSettings } from '../hooks/useEditorSettings';

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  onSave?: (value: string) => void;
  mode?: string;
  readOnly?: boolean;
}

export default function Editor({ value, onChange, onSave, mode = 'chordpro', readOnly = false }: EditorProps) {
  const { settings } = useEditorSettings();
  const editorRef = useRef<IAceEditor | null>(null);

  const handleLoad = (editor: IAceEditor) => {
    editorRef.current = editor;
    editor.commands.addCommand({
      name: 'save',
      bindKey: { win: 'Ctrl-S', mac: 'Cmd-S' },
      exec: (ed) => onSave?.(ed.getValue()),
    });
  };

  return (
    <AceEditor
      mode={mode}
      theme={settings.theme}
      width="100%"
      height="100%"
      value={value}
      onChange={onChange}
      onLoad={handleLoad}
      readOnly={readOnly}
      fontSize={settings.fontSize}
      wrapEnabled={settings.wordWrap}
      showGutter={settings.showLineNumbers}
      setOptions={{
        enableLiveAutocompletion: true,
        enableSnippets: true,
        showLineNumbers: settings.showLineNumbers,
        tabSize: 2,
      }}
    />
  );
}