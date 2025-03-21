import React, { useState, useEffect, useRef } from 'react';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';

const EditorComponent = ({ content }) => {
  const [editor, setEditor] = useState(null);
  const containerRef = useRef(null);
  
  // Initialize editor when component mounts
  useEffect(() => {
    if (containerRef.current && !editor) {
      const newEditor = new Editor({
        element: containerRef.current,
        autofocus: false,
        editable: true,
        extensions: [StarterKit, TextStyle, Color],
        editorProps: {
          attributes: {
            class: 'text-left w-full p-4',
          },
        },
      });
      
      setEditor(newEditor);
    }
    
    return () => {
      if (editor) {
        editor.destroy();
      }
    };
  }, []);
  
  // Update content when prop changes
  useEffect(() => {
    if (!editor) return;
    
    // Clear content when empty string is passed
    if (!content || content === '') {
      editor.commands.clearContent();
      return;
    }
    
    // Otherwise update with new content
    editor.commands.clearContent();
    
    // Split by paragraphs
    const paragraphs = content.split('\n');
    
    // Insert each paragraph with proper spacing
    paragraphs.forEach((paragraph, index) => {
      // Add line break between paragraphs
      if (index > 0) {
        editor.commands.insertContent('<br><br>');
      }
      
      // Don't insert empty paragraphs
      if (paragraph.trim()) {
        editor.commands.insertContent({
          type: 'text',
          text: paragraph,
          marks: [{ 
            type: 'textStyle', 
            attrs: { color: '#ffffff' } 
          }]
        });
      }
    });
    
    // Verify content was set
    console.log("Editor HTML after update:", editor.getHTML());
  }, [content, editor]);
  
  return <div ref={containerRef} className="diagnostics bg-blue-700 rounded-sm" />;
};

export default EditorComponent;