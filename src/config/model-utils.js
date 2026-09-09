// Shared model utility for formatting display labels
export function getModelDisplayName(modelId) {
  if (!modelId) return 'Gemini Flash';
  const clean = String(modelId).replace(/^models\//, '');
  if (clean === 'gemini-3.8-flash') return 'Gemini 3.8 Flash';
  if (clean === 'gemini-3.7-flash') return 'Gemini 3.7 Flash';
  if (clean === 'gemini-3.6-flash') return 'Gemini 3.6 Flash';
  if (clean === 'gemini-3.5-flash') return 'Gemini 3.5 Flash';
  if (clean === 'gemini-2.5-flash') return 'Gemini 2.5 Flash';
  if (clean === 'gemini-flash-latest') return 'Gemini Flash Latest';
  if (clean === 'gemini-2.5-flash-lite') return 'Gemini 2.5 Flash Lite';

  return clean
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(' ');
}
