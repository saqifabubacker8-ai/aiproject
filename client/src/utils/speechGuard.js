// Pure helper (no React import) so it can be unit-tested from the server test suite.
// It only decides whether spoken input is substantive enough to dispatch.
export function shouldDispatchCommand(text) {
  if (typeof text !== 'string') return false;
  const cleaned = text.replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
  return cleaned.length >= 2;
}
