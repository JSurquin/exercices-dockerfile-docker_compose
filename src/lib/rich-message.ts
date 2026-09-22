export type RichMessagePart = {
  text: string;
  highlight: boolean;
};

const HIGHLIGHT_RE = /<highlight>(.*?)<\/highlight>/g;

/**
 * Split a translated string that embeds `<highlight>…</highlight>` markers.
 * Keeps grammar intact in every locale (the highlighted span can sit anywhere).
 */
export function splitHighlightedMessage(template: string): RichMessagePart[] {
  const parts: RichMessagePart[] = [];
  let lastIndex = 0;
  const re = new RegExp(HIGHLIGHT_RE.source, "g");
  let match: RegExpExecArray | null;

  while ((match = re.exec(template)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ text: template.slice(lastIndex, match.index), highlight: false });
    }
    parts.push({ text: match[1] ?? "", highlight: true });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < template.length) {
    parts.push({ text: template.slice(lastIndex), highlight: false });
  }

  if (parts.length === 0) {
    parts.push({ text: template, highlight: false });
  }

  return parts;
}
