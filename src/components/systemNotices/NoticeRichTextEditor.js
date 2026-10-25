import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';

const ReactQuill = dynamic(() => import('react-quill'), {
  ssr: false,
  loading: () => <div className="min-h-[220px]" />,
});

// Quill traz o próprio tema; aqui só o alinhamos aos tokens (claro/escuro).
const ESTILO_QUILL = [
  '[&_.ql-toolbar.ql-snow]:rounded-t-lg [&_.ql-toolbar.ql-snow]:border-border [&_.ql-toolbar.ql-snow]:bg-hover',
  '[&_.ql-container.ql-snow]:min-h-[220px] [&_.ql-container.ql-snow]:rounded-b-lg [&_.ql-container.ql-snow]:border-border [&_.ql-container.ql-snow]:bg-background [&_.ql-container.ql-snow]:text-foreground',
  '[&_.ql-editor]:min-h-[180px] [&_.ql-editor]:text-sm [&_.ql-editor]:leading-[1.7]',
  '[&_.ql-editor.ql-blank::before]:text-muted-foreground [&_.ql-editor.ql-blank::before]:not-italic',
  '[&_.ql-snow_.ql-stroke]:stroke-muted-foreground [&_.ql-snow_.ql-fill]:fill-muted-foreground [&_.ql-snow_.ql-picker]:text-muted-foreground',
].join(' ');

export default function NoticeRichTextEditor({ value, onChange }) {
  const modules = useMemo(() => ({
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      [{ size: ['small', false, 'large', 'huge'] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ color: [] }, { background: [] }],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ indent: '-1' }, { indent: '+1' }],
      [{ align: [] }],
      ['link', 'clean'],
    ],
  }), []);

  const formats = useMemo(() => ([
    'header',
    'size',
    'bold',
    'italic',
    'underline',
    'strike',
    'color',
    'background',
    'list',
    'bullet',
    'indent',
    'align',
    'link',
  ]), []);

  return (
    <div>
      <p className="mb-1.5 text-xs text-muted-foreground">
        Use a barra para formatar texto, espaçamento, títulos, listas, cores e links.
      </p>
      <div className={ESTILO_QUILL}>
        <ReactQuill
          theme="snow"
          value={value}
          onChange={onChange}
          modules={modules}
          formats={formats}
          placeholder="Digite e formate o conteúdo do aviso..."
        />
      </div>
    </div>
  );
}
