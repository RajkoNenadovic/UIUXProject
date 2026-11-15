// Reading-comfort settings are applied as data attributes on <html>; styles/features.css reacts to them.
export function applyPreferences(settings) {
  if (!settings) return;
  const root = document.documentElement;
  root.dataset.fontSize = settings.font_size || 'medium';
  root.dataset.spacing = settings.spacing || 'comfortable';
  root.dataset.dyslexia = String(Boolean(settings.dyslexia_friendly));
}
