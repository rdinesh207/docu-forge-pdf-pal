
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import Image from '@tiptap/extension-image';
import TextStyle from '@tiptap/extension-text-style';
import { FontFamily } from '@tiptap/extension-font-family';
import { EditorToolbar } from './EditorToolbar';
import { useState, useCallback } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { toast } from 'sonner';

const DocumentEditor = () => {
  const [isExporting, setIsExporting] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      FontFamily.configure({
        types: ['textStyle'],
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto',
        },
      }),
    ],
    content: `
      <h1>Document Title</h1>
      <p>Start writing your document here. You can format text, add images, and create tables using the toolbar above.</p>
      <p>Use the toolbar to:</p>
      <ul>
        <li>Change font family and formatting</li>
        <li>Add <strong>bold</strong>, <em>italic</em>, or <u>underlined</u> text</li>
        <li>Insert images and tables</li>
        <li>Export your document as PDF</li>
      </ul>
    `,
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none min-h-[600px] p-8 focus:outline-none',
      },
    },
  });

  const handleImageUpload = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      editor?.chain().focus().setImage({ src: url }).run();
    };
    reader.readAsDataURL(file);
  }, [editor]);

  const exportToPDF = async () => {
    if (!editor) return;
    
    setIsExporting(true);
    toast('Generating PDF...');
    
    try {
      const editorElement = document.querySelector('.ProseMirror') as HTMLElement;
      if (!editorElement) throw new Error('Editor content not found');

      // Create a temporary container with white background for better PDF rendering
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.background = 'white';
      tempContainer.style.padding = '40px';
      tempContainer.style.width = '210mm'; // A4 width
      tempContainer.innerHTML = editorElement.innerHTML;
      document.body.appendChild(tempContainer);

      const canvas = await html2canvas(tempContainer, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      document.body.removeChild(tempContainer);

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save('document.pdf');
      toast('PDF exported successfully!');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast('Error exporting PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  if (!editor) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-500">Loading editor...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Document Editor</h1>
          <EditorToolbar 
            editor={editor} 
            onImageUpload={handleImageUpload}
            onExportPDF={exportToPDF}
            isExporting={isExporting}
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-8">
          <div className="bg-white rounded-lg shadow-lg min-h-[800px]">
            <EditorContent 
              editor={editor} 
              className="h-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentEditor;
