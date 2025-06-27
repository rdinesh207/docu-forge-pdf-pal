import { Editor } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { 
  Bold, 
  Italic, 
  Underline, 
  Image as ImageIcon, 
  Table, 
  Download,
  FileText,
  Loader2,
  Upload
} from 'lucide-react';
import { useRef } from 'react';

interface EditorToolbarProps {
  editor: Editor;
  onImageUpload: (file: File) => void;
  onDocumentUpload: (file: File) => void;
  onExportPDF: () => void;
  onExportWord: () => void;
  isExporting: boolean;
}

export const EditorToolbar = ({ editor, onImageUpload, onDocumentUpload, onExportPDF, onExportWord, isExporting }: EditorToolbarProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleDocumentClick = () => {
    documentInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      onImageUpload(file);
    }
    // Reset the input
    event.target.value = '';
  };

  const handleDocumentChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      onDocumentUpload(file);
    }
    // Reset the input
    event.target.value = '';
  };

  const insertTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  const fontFamilies = [
    { value: 'Arial', label: 'Arial' },
    { value: 'Times New Roman', label: 'Times New Roman' },
    { value: 'Helvetica', label: 'Helvetica' },
    { value: 'Georgia', label: 'Georgia' },
    { value: 'Courier New', label: 'Courier New' },
    { value: 'Verdana', label: 'Verdana' },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 p-3 bg-gray-50 border rounded-lg">
      {/* Upload Document */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleDocumentClick}
        disabled={isExporting}
        className="bg-purple-50 hover:bg-purple-100 border-purple-200"
      >
        <Upload className="h-4 w-4 mr-1" />
        Upload Word
      </Button>

      <Separator orientation="vertical" className="h-6" />

      {/* Font Family */}
      <Select
        value={editor.getAttributes('textStyle').fontFamily || 'Arial'}
        onValueChange={(value) => {
          if (value === 'default') {
            editor.chain().focus().unsetFontFamily().run();
          } else {
            editor.chain().focus().setFontFamily(value).run();
          }
        }}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Font" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="default">Default</SelectItem>
          {fontFamilies.map((font) => (
            <SelectItem key={font.value} value={font.value}>
              {font.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Separator orientation="vertical" className="h-6" />

      {/* Text Formatting */}
      <Button
        variant={editor.isActive('bold') ? 'default' : 'outline'}
        size="sm"
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="h-4 w-4" />
      </Button>

      <Button
        variant={editor.isActive('italic') ? 'default' : 'outline'}
        size="sm"
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="h-4 w-4" />
      </Button>

      <Button
        variant={editor.isActive('underline') ? 'default' : 'outline'}
        size="sm"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <Underline className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="h-6" />

      {/* Headings */}
      <Select
        value={
          editor.isActive('heading', { level: 1 }) ? 'h1' :
          editor.isActive('heading', { level: 2 }) ? 'h2' :
          editor.isActive('heading', { level: 3 }) ? 'h3' :
          'paragraph'
        }
        onValueChange={(value) => {
          if (value === 'paragraph') {
            editor.chain().focus().setParagraph().run();
          } else {
            const level = parseInt(value.replace('h', '')) as 1 | 2 | 3 | 4 | 5 | 6;
            editor.chain().focus().toggleHeading({ level }).run();
          }
        }}
      >
        <SelectTrigger className="w-[120px]">
          <SelectValue placeholder="Style" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="paragraph">Paragraph</SelectItem>
          <SelectItem value="h1">Heading 1</SelectItem>
          <SelectItem value="h2">Heading 2</SelectItem>
          <SelectItem value="h3">Heading 3</SelectItem>
        </SelectContent>
      </Select>

      <Separator orientation="vertical" className="h-6" />

      {/* Lists */}
      <Button
        variant={editor.isActive('bulletList') ? 'default' : 'outline'}
        size="sm"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        • List
      </Button>

      <Button
        variant={editor.isActive('orderedList') ? 'default' : 'outline'}
        size="sm"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        1. List
      </Button>

      <Separator orientation="vertical" className="h-6" />

      {/* Insert Options */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleImageClick}
      >
        <ImageIcon className="h-4 w-4 mr-1" />
        Image
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={insertTable}
      >
        <Table className="h-4 w-4 mr-1" />
        Table
      </Button>

      <Separator orientation="vertical" className="h-6" />

      {/* Export Options */}
      <Button
        onClick={onExportWord}
        disabled={isExporting}
        className="bg-green-600 hover:bg-green-700"
      >
        {isExporting ? (
          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
        ) : (
          <FileText className="h-4 w-4 mr-1" />
        )}
        Word
      </Button>

      <Button
        onClick={onExportPDF}
        disabled={isExporting}
        className="bg-blue-600 hover:bg-blue-700"
      >
        {isExporting ? (
          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
        ) : (
          <Download className="h-4 w-4 mr-1" />
        )}
        PDF
      </Button>

      <Input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      <Input
        ref={documentInputRef}
        type="file"
        accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        onChange={handleDocumentChange}
        className="hidden"
      />
    </div>
  );
};
