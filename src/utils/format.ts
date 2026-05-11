export function formatContent(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^[-*] /gm, '• ')
    .replace(/\n  [-*] /g, '\n    ◦ ')
    .replace(/\n/g, '<br/>');
}
