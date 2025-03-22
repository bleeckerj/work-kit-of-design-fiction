import React, { useEffect, useRef } from 'react';
import JSONEditor from 'jsoneditor';
import 'jsoneditor/dist/jsoneditor.css';

const JSONEditorComponent = ({ content, placeholder, isGenerating, onChange }) => {
  const containerRef = useRef(null);
  const editorRef = useRef(null);
  const showPlaceholder = !content || content.trim() === "";
  
  // Initialize editor when component mounts
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Create editor options
    const options = {
      mode: 'tree',
      modes: ['code', 'form', 'text', 'tree', 'view'], // allow switching modes
      onChangeText: (jsonString) => {
        // Notify parent component of changes
        if (onChange) {
          onChange(jsonString);
        }
      },
      mainMenuBar: true,
      navigationBar: true,
      statusBar: true,
      theme: 'ace/theme/monokai', // dark theme to match your blue background
    };
    
    // Create the editor
    const editor = new JSONEditor(containerRef.current, options);
    
    // Set initial content
    try {
      // Try to parse content as JSON
      const initialJson = content ? JSON.parse(content) : {};
      editor.set(initialJson);
    } catch (e) {
      // If not valid JSON, treat as a string
      editor.set({ "content": content || "" });
    }
    
    editorRef.current = editor;
    
    // Clean up on unmount
    return () => {
      if (editorRef.current) {
        editorRef.current.destroy();
      }
    };
  }, []);
  
  // Update editor content when content prop changes
  useEffect(() => {
    if (editorRef.current && content) {
      try {
        const json = JSON.parse(content);
        editorRef.current.update(json);
      } catch (e) {
        editorRef.current.update({ "content": content });
      }
    }
  }, [content]);
  
  return (
    <div className="json-editor-container relative w-full h-full flex flex-col border border-gray-300 rounded bg-gray-900">
      {/* Custom styling for JSON editor */}
      <style jsx>{`
        .json-editor-container .jsoneditor {
          border: none;
          height: 100%;
        }
        
        /* Improve menu bar styling */
        .json-editor-container .jsoneditor-menu {
          background-color: #1e40af;
          border-bottom: 1px solid #3b82f6;
        }
        
        /* Improve navigation bar styling */
        .json-editor-container .jsoneditor-navigation-bar {
          background-color: #1e293b; /* Darker background for contrast */
          border-bottom: 1px solid #3b82f6;
          color: #f8fafc; /* Light text color */
        }
        
        /* Improve dropdown styling */
        .json-editor-container .jsoneditor-contextmenu,
        .json-editor-container .jsoneditor-contextmenu ul,
        .json-editor-container .jsoneditor-modal,
        .json-editor-container .jsoneditor-select {
          background: #1e293b;
          color: #f8fafc;
          border-color: #3b82f6;
        }
        
        /* Improve dropdown items */
        .json-editor-container .jsoneditor-contextmenu .jsoneditor-menu li button {
          color: #f8fafc;
        }
        
        /* Improve dropdown hover state */
        .json-editor-container .jsoneditor-contextmenu .jsoneditor-menu li button:hover,
        .json-editor-container .jsoneditor-contextmenu .jsoneditor-menu li button:focus {
          background-color: #2563eb;
        }
        
        /* Improve tree mode */
        .json-editor-container .jsoneditor-tree {
          background-color: #0f172a;
          color: #f8fafc;
        }
        
        /* Improve field/value colors in tree */
        .json-editor-container .jsoneditor-field {
          color: #93c5fd; /* Light blue for fields */
        }
        
        .json-editor-container .jsoneditor-value {
          color: #e2e8f0; /* Light gray for values */
        }
        
        .json-editor-container .jsoneditor-string {
          color: #f8f8f8 !important;
        }

 /* Selection highlighting - using the exact selectors */
  .json-editor-container div.jsoneditor-field[contenteditable=true]:focus, 
  .json-editor-container div.jsoneditor-field[contenteditable=true]:hover, 
  .json-editor-container div.jsoneditor-value[contenteditable=true]:focus, 
  .json-editor-container div.jsoneditor-value[contenteditable=true]:hover, 
  .json-editor-container div.jsoneditor-field.jsoneditor-highlight, 
  .json-editor-container div.jsoneditor-value.jsoneditor-highlight {
    background-color: #0063eb !important;
    color: white !important;
    border-color: #3b82f6 !important;
    border-radius: 2px !important;
  }
        
        /* Improve text editor mode */
        .jsoneditor-mode-code .ace-jsoneditor .ace_scroller {
          background-color: #0f172a;
        }
      `}</style>
      
      {/* Editor container */}
      <div ref={containerRef} className="w-full h-full min-h-[300px]" />
      
      {/* Placeholder overlay that appears when editor is empty */}
      {showPlaceholder && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-200 font-mono pointer-events-none p-4 mt-12">
          {typeof placeholder === 'string' ? placeholder : placeholder}
        </div>
      )}
      
      {/* Loading indicator */}
      {isGenerating && (
        <div className="absolute bottom-4 right-4 bg-blue-600 text-white px-2 py-1 rounded-md text-xs animate-pulse">
          Generating...
        </div>
      )}
    </div>
  );
};

export default JSONEditorComponent;