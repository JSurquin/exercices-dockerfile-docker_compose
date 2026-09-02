import hljs from 'highlight.js/lib/core';
import bash from 'highlight.js/lib/languages/bash';
import go from 'highlight.js/lib/languages/go';
import http from 'highlight.js/lib/languages/http';
import javascript from 'highlight.js/lib/languages/javascript';
import json from 'highlight.js/lib/languages/json';
import php from 'highlight.js/lib/languages/php';
import python from 'highlight.js/lib/languages/python';

export type HighlightLanguage =
  | 'javascript'
  | 'python'
  | 'php'
  | 'go'
  | 'json'
  | 'bash'
  | 'http'
  | 'bruno'
  | 'plaintext';

hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('python', python);
hljs.registerLanguage('php', php);
hljs.registerLanguage('go', go);
hljs.registerLanguage('json', json);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('http', http);
hljs.registerLanguage('bruno', () => ({
  name: 'Bruno',
  aliases: ['bru'],
  keywords: {
    keyword: 'meta get post put patch delete vars headers auth body',
    literal: 'json none bearer http',
  },
  contains: [
    {
      className: 'attr',
      begin: /^[ \t]*[A-Za-z_][\w-]*(?=\s*:)/m,
    },
    {
      className: 'string',
      variants: [
        { begin: /"/, end: /"/ },
        { begin: /'/, end: /'/ },
        { begin: /\{\{/, end: /\}\}/ },
        { begin: /https?:\/\/[^\s]+/ },
      ],
    },
    {
      className: 'number',
      begin: hljs.NUMBER_RE,
    },
  ],
}));

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

export function highlightCode(code: string, language: HighlightLanguage): string {
  if (language === 'plaintext' || !hljs.getLanguage(language)) {
    return escapeHtml(code);
  }
  try {
    return hljs.highlight(code, { language, ignoreIllegals: true }).value;
  } catch {
    return escapeHtml(code);
  }
}
