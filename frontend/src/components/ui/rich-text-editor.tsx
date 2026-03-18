import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  ImagePlus,
  Undo,
  Redo,
  Loader2,
} from 'lucide-react';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './dialog';
import api, { getErrorMessage } from '@/lib/api';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Start typing...',
  minHeight = '200px',
}: RichTextEditorProps) {
  const [isImageDialogOpen, setIsImageDialogOpen] = React.useState(false);
  const [isLinkDialogOpen, setIsLinkDialogOpen] = React.useState(false);
  const [linkUrl, setLinkUrl] = React.useState('');
  const [imageUpload, setImageUpload] = React.useState({
    isUploading: false,
    previewUrl: null as string | null,
    uploadedUrl: null as string | null,
  });
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Image.configure({
        HTMLAttributes: {
          style: 'max-width: 100%; height: auto;',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          style: 'color: #2563eb; text-decoration: underline;',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Update editor when value changes externally
  React.useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
      alert('Invalid file type. Please use JPEG, PNG, GIF, or WebP.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File too large. Maximum size is 5MB.');
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setImageUpload({ isUploading: true, previewUrl, uploadedUrl: null });

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await api.post<{ success: boolean; data: { url: string } }>(
        '/uploads/image',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      setImageUpload((prev) => ({
        ...prev,
        isUploading: false,
        uploadedUrl: response.data.data.url,
      }));
    } catch (err) {
      alert(getErrorMessage(err));
      setImageUpload({ isUploading: false, previewUrl: null, uploadedUrl: null });
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const insertImage = () => {
    if (imageUpload.uploadedUrl && editor) {
      editor.chain().focus().setImage({ src: imageUpload.uploadedUrl }).run();
      resetImageDialog();
    }
  };

  const resetImageDialog = () => {
    if (imageUpload.previewUrl) URL.revokeObjectURL(imageUpload.previewUrl);
    setImageUpload({ isUploading: false, previewUrl: null, uploadedUrl: null });
    setIsImageDialogOpen(false);
  };

  const setLink = () => {
    if (linkUrl && editor) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run();
    }
    setLinkUrl('');
    setIsLinkDialogOpen(false);
  };

  const removeLink = () => {
    if (editor) {
      editor.chain().focus().unsetLink().run();
    }
    setIsLinkDialogOpen(false);
  };

  if (!editor) return null;

  const ToolbarButton = ({
    onClick,
    isActive,
    children,
    title,
  }: {
    onClick: () => void;
    isActive?: boolean;
    children: React.ReactNode;
    title: string;
  }) => (
    <Button
      type="button"
      variant={isActive ? 'default' : 'ghost'}
      size="sm"
      onClick={onClick}
      title={title}
      className="h-8 w-8 p-0"
    >
      {children}
    </Button>
  );

  return (
    <div className="border rounded-md overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-muted/30">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive('underline')}
          title="Underline"
        >
          <UnderlineIcon className="h-4 w-4" />
        </ToolbarButton>

        <div className="w-px h-6 bg-border mx-1" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          title="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>

        <div className="w-px h-6 bg-border mx-1" />

        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          isActive={editor.isActive({ textAlign: 'left' })}
          title="Align Left"
        >
          <AlignLeft className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          isActive={editor.isActive({ textAlign: 'center' })}
          title="Align Center"
        >
          <AlignCenter className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          isActive={editor.isActive({ textAlign: 'right' })}
          title="Align Right"
        >
          <AlignRight className="h-4 w-4" />
        </ToolbarButton>

        <div className="w-px h-6 bg-border mx-1" />

        <ToolbarButton
          onClick={() => {
            const existingLink = editor.getAttributes('link').href;
            setLinkUrl(existingLink || '');
            setIsLinkDialogOpen(true);
          }}
          isActive={editor.isActive('link')}
          title="Add Link"
        >
          <LinkIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => setIsImageDialogOpen(true)}
          title="Add Image"
        >
          <ImagePlus className="h-4 w-4" />
        </ToolbarButton>

        <div className="w-px h-6 bg-border mx-1" />

        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          title="Undo"
        >
          <Undo className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          title="Redo"
        >
          <Redo className="h-4 w-4" />
        </ToolbarButton>
      </div>

      {/* Editor Content */}
      <EditorContent
        editor={editor}
        className="prose prose-sm max-w-none p-3 focus:outline-none"
        style={{ minHeight }}
      />

      {/* Image Upload Dialog */}
      <Dialog open={isImageDialogOpen} onOpenChange={(open) => !open && resetImageDialog()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Insert Image</DialogTitle>
            <DialogDescription>Upload an image to insert into your message</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleFileSelect}
              className="hidden"
            />

            {!imageUpload.previewUrl ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary hover:bg-muted/50 transition-colors"
              >
                <ImagePlus className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm font-medium">Click to upload an image</p>
                <p className="text-xs text-muted-foreground mt-1">JPEG, PNG, GIF, or WebP (max 5MB)</p>
              </div>
            ) : (
              <div className="relative border rounded-lg overflow-hidden bg-muted/30">
                <img
                  src={imageUpload.previewUrl}
                  alt="Preview"
                  className="max-h-48 mx-auto"
                />
                {imageUpload.isUploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 text-white animate-spin" />
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={resetImageDialog}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={insertImage}
              disabled={!imageUpload.uploadedUrl || imageUpload.isUploading}
            >
              {imageUpload.isUploading ? 'Uploading...' : 'Insert Image'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Link Dialog */}
      <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Link</DialogTitle>
            <DialogDescription>Enter the URL for the link</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="linkUrl">URL</Label>
              <Input
                id="linkUrl"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
              />
            </div>
          </div>
          <DialogFooter>
            {editor.isActive('link') && (
              <Button type="button" variant="destructive" onClick={removeLink}>
                Remove Link
              </Button>
            )}
            <Button type="button" variant="outline" onClick={() => setIsLinkDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={setLink} disabled={!linkUrl}>
              Add Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
