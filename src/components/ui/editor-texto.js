import React, { useEffect, useRef, useState } from 'react';
import { EditorContent, useEditor, useEditorState } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Color, FontSize, TextStyle } from '@tiptap/extension-text-style';
import TextAlign from '@tiptap/extension-text-align';
import Image from '@tiptap/extension-image';
import { Placeholder } from '@tiptap/extensions';
import {
  AlignCenter, AlignJustify, AlignLeft, AlignRight, Bold, Heading2, Heading3, ImagePlus, Italic, Link2, List,
  ListOrdered, Redo2, RemoveFormatting, Strikethrough, Underline, Undo2,
} from 'lucide-react';
import { cn } from '../../lib/cn';
import { enviarImagemEditor } from '../../services/editor';
import { htmlVazio, temHtml, textoParaHtml, textoSemTags } from '../../utils/textoRico';
import { Button } from './button';
import { Input, Label, SelectNativo } from './campos';
import { CLASSE_TEXTO_FORMATADO } from './texto-formatado';

const TAMANHOS = [
  { valor: '0.875rem', rotulo: 'Pequeno' },
  { valor: '', rotulo: 'Normal' },
  { valor: '1.25rem', rotulo: 'Grande' },
  { valor: '1.5rem', rotulo: 'Muito grande' },
];
const CORES = [
  { valor: '', rotulo: 'Cor padrão' },
  { valor: '#dc2626', rotulo: 'Vermelho' },
  { valor: '#16a34a', rotulo: 'Verde' },
  { valor: '#2563eb', rotulo: 'Azul' },
  { valor: '#ca8a04', rotulo: 'Amarelo' },
];
const URL_OK = /^(https?:|mailto:)/i;
const ERRO_IMAGEM = 'Não foi possível enviar a imagem. Use PNG, JPG ou WEBP de até 2 MB.';
const ERRO_LINK = 'Use um endereço http, https ou e-mail.';

const paraEditor = (valor) => (temHtml(valor) ? String(valor) : textoParaHtml(valor));

/** Endereço digitado pelo usuário: sem esquema vira https (ou mailto se for e-mail); outros esquemas são recusados. */
export function normalizarLink(entrada) {
  const url = String(entrada || '').trim();
  if (!url) return null;
  if (URL_OK.test(url)) return url;
  if (/^[a-z][a-z0-9+.-]*:/i.test(url)) return null;
  return /^[^\s@/]+@[^\s@/]+\.[^\s@/]+$/.test(url) ? `mailto:${url}` : `https://${url}`;
}

function Botao({ rotulo, ativo, onClick, disabled, children }) {
  return (
    <Button
      type="button"
      variant={ativo ? 'secondary' : 'ghost'}
      size="icon-sm"
      aria-label={rotulo}
      title={rotulo}
      aria-pressed={ativo === undefined ? undefined : Boolean(ativo)}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

const Separador = () => <span aria-hidden className="mx-0.5 h-5 w-px bg-border" />;

/**
 * Editor de texto rico (TipTap) no visual do SysDoc. `value`/`onChange` em HTML; texto antigo (sem HTML) entra como
 * parágrafos e `onChange('')` quando o conteúdo fica vazio. Imagens vão ao back (nunca base64 no texto).
 */
export function EditorTexto({ id, label, value, onChange, maxLength, obrigatorio, erro, dica, disabled = false, placeholder, minAltura = 180 }) {
  const aoMudar = useRef(onChange);
  aoMudar.current = onChange;
  const ultimo = useRef(null);
  const arquivo = useRef(null);
  const [erroImagem, setErroImagem] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [link, setLink] = useState(null); // null = fechado; string = endereço sendo editado
  const [erroLink, setErroLink] = useState(null);

  const enviar = useRef(null);

  const editor = useEditor({
    immediatelyRender: false,
    editable: !disabled,
    content: paraEditor(value),
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        code: false,
        codeBlock: false,
        horizontalRule: false,
        link: {
          openOnClick: false,
          autolink: true,
          defaultProtocol: 'https',
          isAllowedUri: (url) => URL_OK.test(url),
          HTMLAttributes: { target: '_blank', rel: 'noopener noreferrer' },
        },
      }),
      TextStyle,
      FontSize,
      Color,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Image.configure({ allowBase64: false }),
      Placeholder.configure({ placeholder: placeholder || '' }),
    ],
    editorProps: {
      attributes: {
        id,
        role: 'textbox',
        'aria-multiline': 'true',
        'aria-label': typeof label === 'string' ? label : undefined,
        class: 'outline-none',
        style: `min-height:${minAltura}px`,
      },
      handlePaste: (_view, event) => enviar.current?.(event.clipboardData?.files),
      handleDrop: (_view, event) => enviar.current?.(event.dataTransfer?.files),
    },
    onUpdate: ({ editor: ed }) => {
      const html = ed.getHTML();
      ultimo.current = html;
      aoMudar.current?.(htmlVazio(html) ? '' : html);
    },
  });

  enviar.current = (arquivos) => {
    const imagens = Array.from(arquivos || []).filter((f) => f.type?.startsWith('image/'));
    if (!imagens.length || !editor) return false;
    setErroImagem(null);
    setEnviando(true);
    Promise.all(imagens.map((f) => enviarImagemEditor(f)))
      .then((respostas) => {
        respostas.forEach(({ url }) => editor.chain().focus().setImage({ src: url, alt: '' }).run());
      })
      .catch(() => setErroImagem(ERRO_IMAGEM))
      .finally(() => setEnviando(false));
    return true;
  };

  // Valor que muda de fora (texto da IA, registro carregado) substitui o conteúdo.
  useEffect(() => {
    if (!editor) return;
    const alvo = paraEditor(value);
    const atual = editor.getHTML();
    if (alvo === ultimo.current || alvo === atual || (htmlVazio(alvo) && htmlVazio(atual))) return;
    editor.commands.setContent(alvo, { emitUpdate: false });
    ultimo.current = editor.getHTML();
  }, [editor, value]);

  useEffect(() => {
    if (editor) editor.setEditable(!disabled);
  }, [editor, disabled]);

  const estado = useEditorState({
    editor,
    selector: ({ editor: ed }) => (ed ? {
      negrito: ed.isActive('bold'),
      italico: ed.isActive('italic'),
      sublinhado: ed.isActive('underline'),
      tachado: ed.isActive('strike'),
      h2: ed.isActive('heading', { level: 2 }),
      h3: ed.isActive('heading', { level: 3 }),
      lista: ed.isActive('bulletList'),
      numerada: ed.isActive('orderedList'),
      link: ed.isActive('link'),
      alinhamento: ['center', 'right', 'justify'].find((a) => ed.isActive({ textAlign: a })) || 'left',
      tamanho: ed.getAttributes('textStyle').fontSize || '',
      cor: ed.getAttributes('textStyle').color || '',
      desfazer: ed.can().undo(),
      refazer: ed.can().redo(),
    } : null),
  }) || {};

  const cadeia = () => editor.chain().focus();
  const semEditor = !editor || disabled;

  const aplicarLink = () => {
    const url = normalizarLink(link);
    if (!url) {
      setErroLink(ERRO_LINK);
      return;
    }
    setErroLink(null);
    cadeia().extendMarkRange('link').setLink({ href: url }).run();
    setLink(null);
  };

  const removerLink = () => {
    cadeia().extendMarkRange('link').unsetLink().run();
    setLink(null);
    setErroLink(null);
  };

  const idErro = `${id}-erro`;
  const idDica = `${id}-dica`;
  const tamanhoTexto = textoSemTags(value).length;

  return (
    <div className="space-y-1">
      <Label htmlFor={id}>
        {label}
        {obrigatorio ? (
          <>
            <span aria-hidden className="ml-0.5 text-danger">*</span>
            <span className="sr-only"> (obrigatório)</span>
          </>
        ) : null}
      </Label>
      <div
        className={cn(
          'rounded-lg border border-input bg-background text-foreground transition-colors focus-within:border-ring focus-within:ring-[3px] focus-within:ring-primary/25',
          erro && 'border-danger ring-[3px] ring-danger/20',
          disabled && 'opacity-60',
        )}
        aria-describedby={[dica ? idDica : null, erro ? idErro : null].filter(Boolean).join(' ') || undefined}
      >
        <div role="toolbar" aria-label={`Formatação de ${typeof label === 'string' ? label : 'texto'}`} className="flex flex-wrap items-center gap-0.5 border-b border-border px-1.5 py-1">
          <Botao rotulo="Desfazer" disabled={semEditor || !estado.desfazer} onClick={() => cadeia().undo().run()}><Undo2 /></Botao>
          <Botao rotulo="Refazer" disabled={semEditor || !estado.refazer} onClick={() => cadeia().redo().run()}><Redo2 /></Botao>
          <Separador />
          <Botao rotulo="Negrito" ativo={estado.negrito} disabled={semEditor} onClick={() => cadeia().toggleBold().run()}><Bold /></Botao>
          <Botao rotulo="Itálico" ativo={estado.italico} disabled={semEditor} onClick={() => cadeia().toggleItalic().run()}><Italic /></Botao>
          <Botao rotulo="Sublinhado" ativo={estado.sublinhado} disabled={semEditor} onClick={() => cadeia().toggleUnderline().run()}><Underline /></Botao>
          <Botao rotulo="Tachado" ativo={estado.tachado} disabled={semEditor} onClick={() => cadeia().toggleStrike().run()}><Strikethrough /></Botao>
          <Separador />
          <SelectNativo
            aria-label="Tamanho da fonte"
            className="h-8 w-auto py-0 text-xs"
            disabled={semEditor}
            value={estado.tamanho || ''}
            onChange={(e) => (e.target.value ? cadeia().setFontSize(e.target.value).run() : cadeia().unsetFontSize().run())}
          >
            {TAMANHOS.map((t) => <option key={t.rotulo} value={t.valor}>{t.rotulo}</option>)}
          </SelectNativo>
          <SelectNativo
            aria-label="Cor do texto"
            className="h-8 w-auto py-0 text-xs"
            disabled={semEditor}
            value={estado.cor || ''}
            onChange={(e) => (e.target.value ? cadeia().setColor(e.target.value).run() : cadeia().unsetColor().run())}
          >
            {CORES.map((c) => <option key={c.rotulo} value={c.valor}>{c.rotulo}</option>)}
          </SelectNativo>
          <Separador />
          <Botao rotulo="Título 2" ativo={estado.h2} disabled={semEditor} onClick={() => cadeia().toggleHeading({ level: 2 }).run()}><Heading2 /></Botao>
          <Botao rotulo="Título 3" ativo={estado.h3} disabled={semEditor} onClick={() => cadeia().toggleHeading({ level: 3 }).run()}><Heading3 /></Botao>
          <Botao rotulo="Lista" ativo={estado.lista} disabled={semEditor} onClick={() => cadeia().toggleBulletList().run()}><List /></Botao>
          <Botao rotulo="Lista numerada" ativo={estado.numerada} disabled={semEditor} onClick={() => cadeia().toggleOrderedList().run()}><ListOrdered /></Botao>
          <Separador />
          <Botao rotulo="Alinhar à esquerda" ativo={estado.alinhamento === 'left'} disabled={semEditor} onClick={() => cadeia().setTextAlign('left').run()}><AlignLeft /></Botao>
          <Botao rotulo="Centralizar" ativo={estado.alinhamento === 'center'} disabled={semEditor} onClick={() => cadeia().setTextAlign('center').run()}><AlignCenter /></Botao>
          <Botao rotulo="Alinhar à direita" ativo={estado.alinhamento === 'right'} disabled={semEditor} onClick={() => cadeia().setTextAlign('right').run()}><AlignRight /></Botao>
          <Botao rotulo="Justificar" ativo={estado.alinhamento === 'justify'} disabled={semEditor} onClick={() => cadeia().setTextAlign('justify').run()}><AlignJustify /></Botao>
          <Separador />
          <Botao
            rotulo="Link"
            ativo={estado.link}
            disabled={semEditor}
            onClick={() => { setErroLink(null); setLink(link === null ? (editor.getAttributes('link').href || '') : null); }}
          >
            <Link2 />
          </Botao>
          <Botao rotulo="Imagem" disabled={semEditor || enviando} onClick={() => arquivo.current?.click()}><ImagePlus /></Botao>
          <Botao rotulo="Limpar formatação" disabled={semEditor} onClick={() => cadeia().unsetAllMarks().clearNodes().run()}><RemoveFormatting /></Botao>
          <input
            ref={arquivo}
            type="file"
            accept=".png,.jpg,.jpeg,.webp"
            aria-label="Arquivo de imagem"
            className="hidden"
            onChange={(e) => {
              const files = Array.from(e.target.files || []);
              e.target.value = '';
              if (files.length) enviar.current(files);
            }}
          />
        </div>

        {link !== null ? (
          <div className="flex flex-wrap items-center gap-2 border-b border-border px-2 py-2">
            <Input
              aria-label="Endereço do link"
              placeholder="https://..."
              className="h-8 min-w-[200px] flex-1 py-1 text-xs"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); aplicarLink(); } }}
            />
            <Button type="button" size="sm" onClick={aplicarLink}>Aplicar link</Button>
            {estado.link ? <Button type="button" size="sm" variant="outline" onClick={removerLink}>Remover link</Button> : null}
            {erroLink ? <p className="w-full text-xs text-danger">{erroLink}</p> : null}
          </div>
        ) : null}

        <EditorContent
          editor={editor}
          className={cn(
            CLASSE_TEXTO_FORMATADO,
            'px-3 py-2',
            '[&_p.is-editor-empty:first-child]:before:pointer-events-none [&_p.is-editor-empty:first-child]:before:float-left [&_p.is-editor-empty:first-child]:before:h-0 [&_p.is-editor-empty:first-child]:before:text-muted-foreground [&_p.is-editor-empty:first-child]:before:content-[attr(data-placeholder)]',
          )}
        />
      </div>
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-0.5">
          {enviando ? <p className="text-[11px] text-muted-foreground">Enviando imagem...</p> : null}
          {erroImagem ? <p className="text-xs text-danger">{erroImagem}</p> : null}
          {dica ? <p id={idDica} className="text-[11px] text-muted-foreground">{dica}</p> : null}
          {erro ? <p id={idErro} className="text-xs text-danger">{erro}</p> : null}
        </div>
        {maxLength ? (
          <p className={cn('shrink-0 text-[11px] text-muted-foreground', tamanhoTexto > maxLength && 'text-danger')}>{`${tamanhoTexto}/${maxLength}`}</p>
        ) : null}
      </div>
    </div>
  );
}
