import React, { useState, useEffect, useRef } from 'react';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';

const EditorComponent = ({ content, placeholder, isGenerating }) => {
  const [editor, setEditor] = useState(null);
  const containerRef = useRef(null);
  const showPlaceholder = !content || content.trim() === "";
  
  // Initialize editor when component mounts
  useEffect(() => {
    if (!containerRef.current) return;
    
    const newEditor = new Editor({
      element: containerRef.current,
      extensions: [StarterKit, TextStyle, Color],
      content: content || '',
      editorProps: {
        attributes: {
          class: 'prose p-4 min-h-[200px] text-white text-left',
        },
      },
    });
    
    setEditor(newEditor);
    
    // Clean up on unmount
    return () => {
      if (newEditor) {
        newEditor.destroy();
      }
    };
  }, [containerRef.current]);
  
  // Update editor content when content prop changes
  useEffect(() => {
    if (editor && content) {
      editor.commands.setContent(content);
    }
  }, [editor, content]);
  
  return (
    <div className="editor-container relative w-full h-full flex flex-col border border-gray-300 rounded bg-blue-500">
      {/* Editor area */}
      <div ref={containerRef} className="w-full h-full min-h-[200px]" />
      
      {/* Placeholder overlay that appears when editor is empty */}
      {showPlaceholder && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-200 font-mono pointer-events-none p-4">
          {typeof placeholder === 'string' ? placeholder : placeholder}
        </div>
      )}
    </div>
  );
};

export default EditorComponent;