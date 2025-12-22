export default {
  content: ['./**/*.stx'],
  output: './dist/voide.css',
  minify: false,
  preflight: true,
  safelist: ['border-solid', 'bg-black', 'opacity-60', 'appearance-none'],
}
