const server = Bun.serve({
  port: 3000,
  development: true,
  async fetch(req) {
    const url = new URL(req.url);
    let path = url.pathname;
    if (path === '/') path = '/homepage-full.html';

    try {
      const file = Bun.file('.' + path);
      const exists = await file.exists();
      if (!exists) {
        console.log('404:', path);
        return new Response('File not found: ' + path, { status: 404 });
      }
      console.log('200:', path);

      // Transpile TypeScript files on the fly
      if (path.endsWith('.ts')) {
        const transpiler = new Bun.Transpiler({ loader: 'ts' });
        const code = await file.text();
        const js = transpiler.transformSync(code);
        return new Response(js, {
          headers: {
            'Content-Type': 'application/javascript',
            'Cache-Control': 'no-store, no-cache, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          },
        });
      }

      return new Response(file, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });
    } catch (err) {
      console.error('Error:', err);
      return new Response('Error: ' + err.message, { status: 500 });
    }
  }
});

console.log('✓ Server running at http://localhost:3000');
console.log('✓ Full Homepage: http://localhost:3000/homepage-full.html');
console.log('✓ Debug page: http://localhost:3000/debug-test.html');
console.log('✓ Homepage CSS: http://localhost:3000/homepage.css');
console.log('✓ Homepage JS: http://localhost:3000/homepage.js');
console.log('Press Ctrl+C to stop');
