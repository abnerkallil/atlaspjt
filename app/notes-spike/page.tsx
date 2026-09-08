import { NotesEditorSpike } from '@/components/notes-editor-spike';

export default function NotesSpikePage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        padding: 'clamp(24px, 5vw, 72px)',
        background: '#f2f5f9',
      }}
    >
      <div style={{ width: 'min(1240px, 100%)', margin: '0 auto' }}>
        <header style={{ maxWidth: 760, marginBottom: 28 }}>
          <p className="eyebrow">ATLAS NOTES · GATE 1</p>
          <h1
            style={{
              margin: '8px 0 12px',
              fontSize: 'clamp(2rem, 4vw, 3.3rem)',
            }}
          >
            Laboratório do editor formatado
          </h1>
          <p style={{ color: '#5d6a7d', fontSize: '1rem', lineHeight: 1.65 }}>
            Ambiente isolado para validar estrutura, formatação e projeção de
            texto. Nenhuma nota real ou dado persistido é alterado aqui.
          </p>
        </header>
        <NotesEditorSpike />
      </div>
    </main>
  );
}
