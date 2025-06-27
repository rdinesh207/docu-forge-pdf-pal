
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import Image from '@tiptap/extension-image';
import TextStyle from '@tiptap/extension-text-style';
import Underline from '@tiptap/extension-underline';
import { FontFamily } from '@tiptap/extension-font-family';
import { EditorToolbar } from './EditorToolbar';
import { useState, useCallback } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Document, Packer, Paragraph, TextRun, Table as DocxTable, TableRow as DocxTableRow, TableCell as DocxTableCell, HeadingLevel, AlignmentType } from 'docx';
import { toast } from 'sonner';

const DocumentEditor = () => {
  const [isExporting, setIsExporting] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Underline,
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
        <li>Export your document as PDF or Word document</li>
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

  const convertEditorToDocx = () => {
    if (!editor) return null;

    const content = editor.getJSON();
    const children: any[] = [];

    const processContent = (nodes: any[]) => {
      nodes.forEach(node => {
        switch (node.type) {
          case 'heading':
            const headingLevel = node.attrs?.level || 1;
            const headingLevels = [
              HeadingLevel.HEADING_1,
              HeadingLevel.HEADING_2,
              HeadingLevel.HEADING_3,
              HeadingLevel.HEADING_4,
              HeadingLevel.HEADING_5,
              HeadingLevel.HEADING_6
            ];
            children.push(
              new Paragraph({
                text: node.content?.[0]?.text || '',
                heading: headingLevels[headingLevel - 1] || HeadingLevel.HEADING_1,
              })
            );
            break;
          case 'paragraph':
            if (node.content && node.content.length > 0) {
              const textRuns: TextRun[] = [];
              node.content.forEach((textNode: any) => {
                if (textNode.type === 'text') {
                  textRuns.push(
                    new TextRun({
                      text: textNode.text,
                      bold: textNode.marks?.some((mark: any) => mark.type === 'bold'),
                      italics: textNode.marks?.some((mark: any) => mark.type === 'italic'),
                      underline: textNode.marks?.some((mark: any) => mark.type === 'underline') ? {} : undefined,
                    })
                  );
                }
              });
              children.push(new Paragraph({ children: textRuns }));
            } else {
              children.push(new Paragraph({ text: '' }));
            }
            break;
          case 'bulletList':
          case 'orderedList':
            if (node.content) {
              node.content.forEach((listItem: any) => {
                if (listItem.content) {
                  listItem.content.forEach((para: any) => {
                    if (para.content && para.content[0]) {
                      children.push(
                        new Paragraph({
                          text: `• ${para.content[0].text || ''}`,
                        })
                      );
                    }
                  });
                }
              });
            }
            break;
        }
      });
    };

    if (content.content) {
      processContent(content.content);
    }

    const doc = new Document({
      sections: [{
        properties: {},
        children: children.length > 0 ? children : [new Paragraph({ text: 'Empty document' })],
      }],
    });

    return doc;
  };

  const exportToWord = async () => {
    if (!editor) return;
    
    setIsExporting(true);
    toast('Generating Word document...');
    
    try {
      const doc = convertEditorToDocx();
      if (!doc) throw new Error('Failed to convert document');

      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'document.docx';
      a.click();
      URL.revokeObjectURL(url);
      
      toast('Word document exported successfully!');
    } catch (error) {
      console.error('Error exporting Word document:', error);
      toast('Error exporting Word document. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const exportToPDF = async () => {
    if (!editor) return;
    
    setIsExporting(true);
    toast('Generating PDF...');
    
    try {
      const editorElement = document.querySelector('.ProseMirror') as HTMLElement;
      if (!editorElement) throw new Error('Editor content not found');

      // Create a temporary container that matches the editor styling exactly
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.background = 'white';
      tempContainer.style.padding = '32px';
      tempContainer.style.width = '794px'; // A4 width in pixels at 96 DPI
      tempContainer.style.fontFamily = 'Times New Roman, serif';
      tempContainer.style.fontSize = '16px';
      tempContainer.style.lineHeight = '1.6';
      tempContainer.style.color = '#000000';
      
      // Copy the editor content and apply consistent styling
      tempContainer.innerHTML = editorElement.innerHTML;
      
      // Apply consistent styles to all elements in the temp container
      const style = document.createElement('style');
      style.textContent = `
        .temp-pdf-container h1 { font-size: 32px; font-weight: bold; margin: 24px 0 16px 0; color: #1f2937; page-break-after: avoid; }
        .temp-pdf-container h2 { font-size: 24px; font-weight: bold; margin: 20px 0 12px 0; color: #374151; page-break-after: avoid; }
        .temp-pdf-container h3 { font-size: 20px; font-weight: bold; margin: 16px 0 8px 0; color: #4b5563; page-break-after: avoid; }
        .temp-pdf-container p { margin: 12px 0; page-break-inside: avoid; }
        .temp-pdf-container ul, .temp-pdf-container ol { margin: 12px 0; padding-left: 24px; page-break-inside: avoid; }
        .temp-pdf-container li { margin: 4px 0; }
        .temp-pdf-container strong { font-weight: bold; }
        .temp-pdf-container em { font-style: italic; }
        .temp-pdf-container u { text-decoration: underline; }
        .temp-pdf-container table { border-collapse: collapse; margin: 16px 0; width: 100%; page-break-inside: avoid; }
        .temp-pdf-container table td, .temp-pdf-container table th { border: 2px solid #e5e7eb; padding: 8px 12px; }
        .temp-pdf-container table th { background-color: #f9fafb; font-weight: bold; }
        .temp-pdf-container img { max-width: 100%; height: auto; margin: 16px 0; page-break-inside: avoid; }
      `;
      tempContainer.className = 'temp-pdf-container';
      document.head.appendChild(style);
      document.body.appendChild(tempContainer);

      const canvas = await html2canvas(tempContainer, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        height: tempContainer.scrollHeight,
      });

      document.body.removeChild(tempContainer);
      document.head.removeChild(style);

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pageWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const margin = 10; // margin in mm
      const imgWidth = pageWidth - (margin * 2);
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let y = margin;
      let remainingHeight = imgHeight;
      let sourceY = 0;

      while (remainingHeight > 0) {
        const availableHeight = pageHeight - (margin * 2);
        const sliceHeight = Math.min(remainingHeight, availableHeight);
        
        // Calculate the source height in canvas pixels
        const sourceHeight = (sliceHeight * canvas.width) / imgWidth;
        
        // Create a temporary canvas for this slice
        const sliceCanvas = document.createElement('canvas');
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = sourceHeight;
        const sliceCtx = sliceCanvas.getContext('2d');
        
        if (sliceCtx) {
          sliceCtx.drawImage(
            canvas,
            0, sourceY,
            canvas.width, sourceHeight,
            0, 0,
            canvas.width, sourceHeight
          );
          
          const sliceImgData = sliceCanvas.toDataURL('image/png');
          pdf.addImage(sliceImgData, 'PNG', margin, y, imgWidth, sliceHeight);
        }

        remainingHeight -= sliceHeight;
        sourceY += sourceHeight;
        
        if (remainingHeight > 0) {
          pdf.addPage();
          y = margin;
        }
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
            onExportWord={exportToWord}
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
