// Light and dark mode. The page follows the system setting until the visitor
// picks one with the theme button. The choice is kept in this browser under
// the editor's own key, so the site, the hosted editor and the demo board
// (all one origin) share it. Loaded in <head> so the page never flashes the
// wrong theme. Storage can be blocked; then the choice lasts for this page only.
(() => {
  const KEY = 'sabura_ui_theme';
  const root = document.documentElement;
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)');

  const saved = () => {
    try { return localStorage.getItem(KEY); } catch (_) { return null; }
  };
  const apply = (theme) => {
    if (theme === 'light' || theme === 'dark') root.dataset.theme = theme;
    else delete root.dataset.theme;
  };
  const isDark = () => root.dataset.theme
    ? root.dataset.theme === 'dark'
    : systemDark.matches;

  apply(saved());

  const label = (button) => {
    const next = isDark() ? 'light' : 'dark';
    button.setAttribute('aria-label', `Switch to ${next} mode`);
    button.title = `Switch to ${next} mode`;
  };

  document.addEventListener('DOMContentLoaded', () => {
    for (const button of document.querySelectorAll('[data-theme-toggle]')) {
      label(button);
      button.addEventListener('click', () => {
        const theme = isDark() ? 'light' : 'dark';
        apply(theme);
        try { localStorage.setItem(KEY, theme); } catch (_) { /* not remembered */ }
        label(button);
      });
      systemDark.addEventListener('change', () => label(button));
    }
  });
})();
