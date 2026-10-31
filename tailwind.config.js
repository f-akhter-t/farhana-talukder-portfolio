/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./*.html', './projects/*.html', './js/**/*.js'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        paper: 'var(--bg)',
        surface: 'var(--surface)',
        'surface-2': 'var(--surface-2)',
        ink: 'var(--text)',
        muted: 'var(--muted)',
        line: 'var(--line)',
        'line-strong': 'var(--line-strong)',
        gold: { DEFAULT: 'var(--gold)', ink: 'var(--gold-ink)', tint: 'var(--gold-tint)' },
        pink: { DEFAULT: 'var(--pink)', ink: 'var(--pink-ink)', tint: 'var(--pink-tint)' },
        green: { DEFAULT: 'var(--green)', hover: 'var(--green-hover)', ink: 'var(--green-ink)', tint: 'var(--green-tint)' },
        'on-green': 'var(--on-green)',
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['Figtree', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      borderColor: { DEFAULT: 'var(--line)' },
      boxShadow: { card: 'var(--shadow)' },
    },
  },
  plugins: [],
};
