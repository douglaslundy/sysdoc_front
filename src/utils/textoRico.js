// Utilitários dos textos ricos (HTML do editor). A mesma lista de permissões vale no back (HtmlSeguro).

const ENTIDADES = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&nbsp;': ' ' };

export function temHtml(valor) {
  return /<[a-z][\s\S]*>/i.test(String(valor || ''));
}

export function escapar(texto) {
  return String(texto || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Texto puro (registros antigos, resposta da IA) em parágrafos: linha em branco separa blocos. */
export function textoParaHtml(texto) {
  const bruto = String(texto || '').replace(/\r\n?/g, '\n').trim();
  if (!bruto) return '';
  return bruto
    .split(/\n{2,}/)
    .map((bloco) => `<p>${escapar(bloco).replace(/\n/g, '<br>')}</p>`)
    .join('');
}

export function textoSemTags(valor) {
  return String(valor || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (e) => ENTIDADES[e])
    .replace(/[\s ]+/g, ' ')
    .trim();
}

export function htmlVazio(html) {
  return !textoSemTags(html) && !/<img\b/i.test(String(html || ''));
}

// h1 e background-color só na exibição: existem em avisos antigos do Quill (o back não grava mais).
const TAGS = ['p', 'br', 'strong', 'em', 'u', 's', 'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'blockquote', 'a', 'img', 'span'];
const CSS = ['font-size', 'text-align', 'color', 'background-color'];
const URL_OK = /^(https?:|mailto:)/i;

export const PERMITIDOS = {
  ALLOWED_TAGS: TAGS,
  ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'style', 'class'],
  ALLOWED_URI_REGEXP: URL_OK,
};

function filtrarEstilo(estilo) {
  return String(estilo || '')
    .split(';')
    .map((d) => d.trim())
    .filter((d) => {
      const [prop, ...resto] = d.split(':');
      const valor = resto.join(':').toLowerCase();
      return CSS.includes(prop.trim().toLowerCase()) && !valor.includes('url(') && !valor.includes('expression');
    })
    .join('; ');
}

const configurados = new WeakSet();

/** Limpa com o DOMPurify (importado no cliente) e restringe class, style, links e imagens. */
export function limparHtml(DOMPurify, html) {
  if (!configurados.has(DOMPurify)) {
    DOMPurify.addHook('afterSanitizeAttributes', (no) => {
      if (no.hasAttribute('class')) {
        const legadas = no.getAttribute('class').split(/\s+/).filter((c) => c.startsWith('ql-')).join(' ');
        if (legadas) no.setAttribute('class', legadas);
        else no.removeAttribute('class');
      }
      if (no.hasAttribute('style')) {
        const estilo = filtrarEstilo(no.getAttribute('style'));
        if (estilo) no.setAttribute('style', estilo);
        else no.removeAttribute('style');
      }
      // DOMPurify aceita data: em <img> por padrão: imagem em base64 nunca é exibida.
      if (no.tagName === 'IMG' && !URL_OK.test(no.getAttribute('src') || '')) no.removeAttribute('src');
      if (no.tagName === 'A' && no.getAttribute('target') === '_blank') no.setAttribute('rel', 'noopener noreferrer');
    });
    configurados.add(DOMPurify);
  }
  return DOMPurify.sanitize(html, PERMITIDOS);
}
