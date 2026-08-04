import type { ContentType } from './types';

const CODE_KEYWORDS = /\b(function|const|let|var|def|class|import|export|return|if|else|for|while|async|await|try|catch|switch|case|interface|type|struct|fn|pub|use|from|=>|!=|===|!==)\b/;
const CODE_SYMBOLS = /[{}\[\]<>()];/;
const CODE_INDENT = /^[ \t]{2,}/m;
const COMMENT_LINE = /^\s*(\/\/|#|<!--)/m;

export function detectContentType(content: string): ContentType {
  const trimmed = content.trim();
  if (!trimmed) return 'text';

  // URL detection
  if (/^https?:\/\//i.test(trimmed)) return 'link';
  if (/^(www\.)[-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,6}\b/i.test(trimmed)) return 'link';

  // Code detection — multiple signals
  const codeSignals = [
    CODE_KEYWORDS.test(trimmed),
    CODE_SYMBOLS.test(trimmed),
    CODE_INDENT.test(trimmed),
    COMMENT_LINE.test(trimmed),
    /`[^`]+`/.test(trimmed), // backtick strings
    /\d+\.\d+/.test(trimmed) && /[a-zA-Z_]/.test(trimmed), // version strings
  ];
  const codeScore = codeSignals.filter(Boolean).length;
  if (codeScore >= 2) return 'code';

  return 'text';
}

export function autoTitle(content: string): string {
  return content.trim().split('\n')[0].substring(0, 60).trim();
}

export function contentPreview(content: string): string {
  return content.trim().replace(/\s+/g, ' ').substring(0, 80);
}

export function typeLabel(type: ContentType): string {
  switch (type) {
    case 'text': return 'Text';
    case 'link': return 'Link';
    case 'code': return 'Code';
  }
}
