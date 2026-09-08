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
  ShieldCheck,
  Undo2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  ATLAS_NOTES_FORMAT,
  ATLAS_NOTES_VERSION,
  canonicalizeAtlasNotesContent,
  isAtlasNotesDocument,
  plainTextToAtlasNotesBlocks,
  prepareAtlasNotesForSave,
  projectAtlasNotesBody,
  type AtlasNotesEnvelope,
} from '@/lib/atlas-notes-document';
import styles from './notes-editor-spike.module.css';

const initialContent: AtlasNotesEnvelope = {
  format: ATLAS_NOTES_FORMAT,
  version: ATLAS_NOTES_VERSION,
  doc: {
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: { level: 1 },
        content: [{ type: 'text', text: 'Síntese da aula' }],
      },
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'O reconhecimento ocorre no ' },
          { type: 'text', text: 'período correto', marks: [{ type: 'bold' }] },
          { type: 'text', text: ', independentemente do pagamento.' },
        ],
      },
      {
        type: 'bulletList',
        content: [
          {
            type: 'listItem',
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: 'Identificar o fato gerador' }],
              },
            ],
          },
          {
            type: 'listItem',
            content: [
              {
                type: 'paragraph',
                content: [
                  { type: 'text', text: 'Registrar no período adequado' },
                ],
              },
            ],
          },
        ],
      },
      {
        type: 'blockquote',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'A forma muda; o texto pesquisável continua determinístico.',
                marks: [{ type: 'italic' }],
              },
            ],
          },
        ],
      },
    ],
  },
};

const FlatListGuard = Extension.create({
  name: 'atlasFlatListGuard',
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
        filterTransaction(transaction) {
          return (
            !transaction.docChanged ||
            isAtlasNotesDocument(transaction.doc.toJSON())
          );
        },
      }),
    ];
  },
});

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
            const blocks = plainTextToAtlasNotesBlocks(plainText);
            return this.editor.commands.insertContent(blocks);
          },
        },
      }),
    ];
  },
});

const editorExtensions = [
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
  FlatListGuard,
  PlainTextPaste,
];

type Snapshot = {
  body: string;
  characterCount: number;
  content: AtlasNotesEnvelope;
};

export function NotesEditorSpike() {
  const initialSnapshot = useMemo(
    () => prepareAtlasNotesForSave(initialContent),
    [],
  );
  const [snapshot, setSnapshot] = useState<Snapshot>(initialSnapshot);
  const [validationError, setValidationError] = useState('');

  const editor = useEditor({
    immediatelyRender: false,
    extensions: editorExtensions,
    content: initialContent.doc,
    editorProps: {
      attributes: {
        class: styles.proseMirror,
        'aria-label': 'Editor experimental do Atlas Notes',
        spellcheck: 'true',
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      try {
        const content = canonicalizeAtlasNotesContent({
          format: ATLAS_NOTES_FORMAT,
          version: ATLAS_NOTES_VERSION,
          doc: currentEditor.getJSON(),
        });
        try {
          setSnapshot(prepareAtlasNotesForSave(content));
          setValidationError('');
        } catch (error) {
          const body = projectAtlasNotesBody(content);
          setSnapshot({ content, body, characterCount: body.length });
          setValidationError(
            error instanceof Error ? error.message : 'Estrutura inválida.',
          );
        }
      } catch (error) {
        setValidationError(
          error instanceof Error ? error.message : 'Estrutura inválida.',
        );
      }
    },
  });

  if (!editor) {
    return (
      <div className={styles.loading}>Preparando editor experimental…</div>
    );
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
    <section className={styles.workspace}>
      <div className={styles.editorCard}>
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

        <footer className={styles.editorFooter}>
          <span>
            {snapshot.characterCount.toLocaleString('pt-BR')} caracteres
          </span>
          <span className={validationError ? styles.invalid : styles.valid}>
            <ShieldCheck aria-hidden="true" />
            {validationError || 'Estrutura P0 válida'}
          </span>
        </footer>
      </div>

      <aside className={styles.evidence} aria-label="Evidências do spike">
        <div>
          <span>PROJEÇÃO DETERMINÍSTICA</span>
          <p>{snapshot.body}</p>
        </div>
        <div>
          <span>JSON CANÔNICO</span>
          <pre>{JSON.stringify(snapshot.content, null, 2)}</pre>
        </div>
      </aside>
    </section>
  );
}
