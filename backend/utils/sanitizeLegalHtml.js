import sanitizeHtml from 'sanitize-html';

// Les mentions légales sont du HTML saisi par l'administrateur puis affiché à tous les visiteurs :
// on n'en garde que la mise en forme de texte (titres, paragraphes, listes, liens, tableaux).
// Scripts, iframes, formulaires, gestionnaires d'événements (onclick…) et styles en ligne sont retirés.
const OPTIONS = {
  allowedTags: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'hr', 'div', 'span', 'blockquote',
    'ul', 'ol', 'li', 'strong', 'b', 'em', 'i', 'u', 's', 'small', 'sup', 'sub', 'code',
    'a', 'table', 'thead', 'tbody', 'tr', 'th', 'td'
  ],
  allowedAttributes: {
    a: ['href', 'title', 'target', 'rel'],
    th: ['colspan', 'rowspan'],
    td: ['colspan', 'rowspan'],
    '*': ['class']
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowProtocolRelative: false,
  transformTags: {
    a: (tagName, attribs) => ({
      tagName,
      attribs: {
        ...attribs,
        ...(attribs.href && /^https?:/i.test(attribs.href) ? { target: '_blank', rel: 'noopener noreferrer' } : {})
      }
    })
  }
};

export const MAX_LEGAL_LENGTH = 200_000;

export const sanitizeLegalHtml = (html) => sanitizeHtml(String(html ?? ''), OPTIONS);

export default sanitizeLegalHtml;
