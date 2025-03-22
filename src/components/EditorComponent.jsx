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
          class: 'prose p-4 h-full min-h-[200px] text-white bg-black text-left',
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
    <div className="editor-container relative w-full h-full flex flex-col border border-gray-300 rounded bg-black overflow-auto">
      {/* Editor area */}
      <div ref={containerRef} className="w-full h-full min-h-[200px]" />
      
      {/* Add custom CSS to fix the background issue */}
      <style jsx global>{`
        /* Make the editor grow with content */
        .ProseMirror {
          min-height: 100%;
          height: 100%;
          background: oklch(0.488 0.243 264.376);
          color: white;
          overflow: auto;
        }
        
        /* Fix selection styling */
        .ProseMirror .selection {
          background-color: #0063eb;
        }
        
        /* Fix the text styling */
        .ProseMirror p {
          margin-top: 0.5em;
          margin-bottom: 0.5em;
        }
        
        /* Force the editor to take the full height */
        .tiptap {
          height: 100%;
          display: flex;
          flex-direction: column;
        }
        
        /* Ensure the editor content area grows */
        .tiptap .ProseMirror {
          flex-grow: 1;
        }
      `}</style>
      
      {/* Placeholder overlay */}
      {showPlaceholder && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-200 font-mono pointer-events-none p-4">
          {typeof placeholder === 'string' ? placeholder : placeholder}
        </div>
      )}
    </div>
  );
};

export default EditorComponent;