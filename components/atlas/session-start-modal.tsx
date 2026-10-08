'use client';

import { useEffect, useRef } from 'react';
import { ArrowRight, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function SessionStartModal({
  title,
  description,
  onClose,
  onStart,
  starting = false,
}: {
  title: string;
  description: string;
  onClose: () => void;
  onStart: () => void;
  starting?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
    const onBackdropClick = (event: MouseEvent) => { if (event.target === dialog) dialog.close(); };
    dialog.addEventListener('click', onBackdropClick);
    return () => dialog.removeEventListener('click', onBackdropClick);
  }, []);
  return (
    <dialog
      ref={ref}
      className="start-modal"
      aria-labelledby="session-modal-title"
      onClose={onClose}
    >
      <div className="modal-symbol"><BookOpen size={24} /></div>
      <p className="eyebrow">SESSÃO PREPARADA</p>
      <h2 id="session-modal-title">{title}</h2>
      <p>{description}</p>
      <div className="modal-actions">
        <Button variant="outline" onClick={onClose}>Agora não</Button>
        <Button className="primary-button" onClick={onStart} disabled={starting}>
          {starting ? 'Abrindo…' : 'Iniciar sessão'} <ArrowRight size={17} />
        </Button>
      </div>
    </dialog>
  );
}
