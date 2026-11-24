import React, { useEffect, useState } from 'react';
import { cn } from '../../lib/cn';
import { escapar, limparHtml, temHtml } from '../../utils/textoRico';

/** Tipografia do HTML do editor, mais as classes do Quill que ainda existem em avisos antigos. */
export const CLASSE_TEXTO_FORMATADO = [
  'break-words text-sm leading-relaxed',
  '[&_p]:my-1.5 [&_h2]:mt-3 [&_h2]:mb-1.5 [&_h2]:text-lg [&_h2]:font-bold [&_h3]:mt-2.5 [&_h3]:mb-1 [&_h3]:text-base [&_h3]:font-bold',
  '[&_ul]:my-1.5 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-1.5 [&_ol]:list-decimal [&_ol]:pl-6',
  '[&_a]:text-primary-text [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground',
  '[&_img]:my-2 [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-md',
  '[&_.ql-align-center]:text-center [&_.ql-align-right]:text-right [&_.ql-align-justify]:text-justify',
  '[&_.ql-size-small]:text-xs [&_.ql-size-large]:text-lg [&_.ql-size-huge]:text-2xl',
  '[&_.ql-indent-1]:pl-8 [&_.ql-indent-2]:pl-16 [&_.ql-indent-3]:pl-24',
].join(' ');

const comoTexto = (valor) => escapar(valor).replace(/\r?\n/g, '<br>');

/**
 * Exibe texto longo: registro antigo (texto puro) sai escapado com as quebras; HTML passa pelo DOMPurify.
 * Sem o DOMPurify (falha ao carregar), tudo sai escapado: nunca HTML bruto.
 */
export function TextoFormatado({ valor, className }) {
  const bruto = String(valor || '');
  const html = temHtml(bruto);
  const [limpo, setLimpo] = useState(() => (html ? '' : comoTexto(bruto)));

  useEffect(() => {
    let ativo = true;
    if (!html) {
      setLimpo(comoTexto(bruto));
      return undefined;
    }
    import('dompurify')
      .then(({ default: DOMPurify }) => { if (ativo) setLimpo(limparHtml(DOMPurify, bruto)); })
      .catch(() => { if (ativo) setLimpo(comoTexto(bruto)); });
    return () => { ativo = false; };
  }, [bruto, html]);

  if (!bruto.trim()) return null;
  return <div className={cn(CLASSE_TEXTO_FORMATADO, className)} dangerouslySetInnerHTML={{ __html: limpo }} />;
}
