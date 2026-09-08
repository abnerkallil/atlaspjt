'use client';

import { useMemo, useState } from 'react';
import { EditorContent, Extension, useEditor } from '@tiptap/react';
import { Plugin } from '@tiptap/pm/state';
import StarterKit from '@tiptap/starter-kit';
import {
  Bold,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  List,
  ListOrdered,
  Pilcrow,
  Quote,
  Redo2,
  Undo2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  ATLAS_NOTES_FORMAT,
  ATLAS_NOTES_LIMITS,
  ATLAS_NOTES_VERSION,
  canonicalizeAtlasNotesContent,
  plainTextToAtlasNotesBlocks,
  projectAtlasNotesBody,
  type AtlasNotesEnvelope,
} from '@/lib/atlas-notes-document';
import styles from './notes-editor.module.css';

export type NotesEditorSnapshot = {
  body: string;
  characterCount: number;
  content: AtlasNotesEnvelope;
};

type NotesEditorProps = {
  initialContent: AtlasNotesEnvelope;
  onChange: (snapshot: NotesEditorSnapshot) => void;
  onValidationChange: (message: string) => void;
};

function envelopeFromDocument(doc: unknown) {
  return canonicalizeAtlasNotesContent({
    format: ATLAS_NOTES_FORMAT,
    version: ATLAS_NOTES_VERSION,
    doc,
  });
}

function createP0Guard(onRejected: (message: string) => void) {
  return Extension.create({
    name: 'atlasP0Guard',
    priority: 1_000,
    addKeyboardShortcuts() {
      return {
        Tab: () => this.editor.isActive('listItem'),
        'Shift-Tab': () => this.editor.isActive('listItem'),
        'Shift-Enter': () => this.editor.commands.splitBlock(),
      };
    },
    addProseMirrorPlugins() {
      return [
        new Plugin({
          filterTransaction: (transaction) => {
            if (!transaction.docChanged) return true;
            try {
              const content = envelopeFromDocument(transaction.doc.toJSON());
              const body = projectAtlasNotesBody(content);
              if (body.length > ATLAS_NOTES_LIMITS.visibleLength) {
                onRejected(
                  'Limite de 100 mil caracteres atingido. O excedente não foi inserido.',
                );
                return false;
              }
              return true;
            } catch (error) {
              onRejected(
                error instanceof Error
                  ? error.message
                  : 'A alteração não pertence ao formato permitido.',
              );
              return false;
            }
          },
        }),
      ];
    },
  });
}

const PlainTextPaste = Extension.create({
  name: 'atlasPlainTextPaste',
  priority: 1_100,
  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {
          handlePaste: (_view, event) => {
            const plainText = event.clipboardData?.getData('text/plain');
            if (plainText === undefined) return false;
            event.preventDefault();
            return this.editor.commands.insertContent(
              plainTextToAtlasNotesBlocks(plainText),
            );
          },
        },
      }),
    ];
  },
});

export function NotesEditor({
  initialContent,
  onChange,
  onValidationChange,
}: NotesEditorProps) {
  const [validationError, setValidationError] = useState('');
  const guard = useMemo(
    () => createP0Guard((message) => setValidationError(message)),
    [],
  );
  const extensions = useMemo(
    () => [
      StarterKit.configure({
        code: false,
        codeBlock: false,
        hardBreak: false,
        heading: { levels: [1, 2, 3] },
        horizontalRule: false,
        link: false,
        listKeymap: false,
        strike: false,
        trailingNode: false,
        underline: false,
      }),
      guard,
      PlainTextPaste,
    ],
    [guard],
  );

  const editor = useEditor({
    immediatelyRender: false,
    extensions,
    content: initialContent.doc,
    editorProps: {
      attributes: {
        class: styles.proseMirror,
        'aria-label': 'Texto da nota',
        'data-placeholder':
          'Escreva sua síntese, dúvida, exemplo ou raciocínio…',
        spellcheck: 'true',
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      try {
        const content = envelopeFromDocument(currentEditor.getJSON());
        const body = projectAtlasNotesBody(content);
        const snapshot = {
          content,
          body,
          characterCount: body.length,
        };
        setValidationError('');
        onValidationChange('');
        onChange(snapshot);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Estrutura inválida.';
        setValidationError(message);
        onValidationChange(message);
      }
    },
  });

  if (!editor) {
    return <div className={styles.loading}>Preparando editor…</div>;
  }

  const blockControls = [
    {
      label: 'Parágrafo',
      icon: Pilcrow,
      active: editor.isActive('paragraph'),
      action: () => editor.chain().focus().setParagraph().run(),
    },
    ...([1, 2, 3] as const).map((level) => ({
      label: `Título ${level}`,
      icon: level === 1 ? Heading1 : level === 2 ? Heading2 : Heading3,
      active: editor.isActive('heading', { level }),
      action: () => editor.chain().focus().toggleHeading({ level }).run(),
    })),
    {
      label: 'Lista com marcadores',
      icon: List,
      active: editor.isActive('bulletList'),
      action: () => editor.chain().focus().toggleBulletList().run(),
    },
    {
      label: 'Lista numerada',
      icon: ListOrdered,
      active: editor.isActive('orderedList'),
      action: () => editor.chain().focus().toggleOrderedList().run(),
    },
    {
      label: 'Citação',
      icon: Quote,
      active: editor.isActive('blockquote'),
      action: () => editor.chain().focus().toggleBlockquote().run(),
    },
  ];

  return (
    <div className={styles.editorShell}>
      <div
        className={styles.toolbar}
        role="toolbar"
        aria-label="Formatação do texto"
        tabIndex={-1}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault();
            editor.commands.focus();
          }
        }}
      >
        <fieldset className={styles.toolbarGroup}>
          <legend className={styles.srOnly}>Blocos de texto</legend>
          {blockControls.map(({ label, icon: Icon, active, action }) => (
            <Button
              key={label}
              type="button"
              size="sm"
              variant={active ? 'default' : 'outline'}
              aria-label={label}
              aria-pressed={active}
              title={label}
              onClick={action}
            >
              <Icon aria-hidden="true" />
              <span>{label}</span>
            </Button>
          ))}
        </fieldset>

        <fieldset className={styles.toolbarGroup}>
          <legend className={styles.srOnly}>Ênfase e histórico</legend>
          <Button
            type="button"
            size="sm"
            variant={editor.isActive('bold') ? 'default' : 'outline'}
            aria-label="Negrito"
            aria-pressed={editor.isActive('bold')}
            title="Negrito (Ctrl+B)"
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold aria-hidden="true" />
            <span>Negrito</span>
          </Button>
          <Button
            type="button"
            size="sm"
            variant={editor.isActive('italic') ? 'default' : 'outline'}
            aria-label="Itálico"
            aria-pressed={editor.isActive('italic')}
            title="Itálico (Ctrl+I)"
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic aria-hidden="true" />
            <span>Itálico</span>
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            aria-label="Desfazer"
            title="Desfazer"
            disabled={!editor.can().chain().focus().undo().run()}
            onClick={() => editor.chain().focus().undo().run()}
          >
            <Undo2 aria-hidden="true" />
            <span>Desfazer</span>
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            aria-label="Refazer"
            title="Refazer"
            disabled={!editor.can().chain().focus().redo().run()}
            onClick={() => editor.chain().focus().redo().run()}
          >
            <Redo2 aria-hidden="true" />
            <span>Refazer</span>
          </Button>
        </fieldset>
      </div>

      <EditorContent editor={editor} className={styles.editorSurface} />

      {validationError && (
        <p className={styles.validationError} role="alert">
          {validationError}
        </p>
      )}
    </div>
  );
}
