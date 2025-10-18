import { desktopIcons, libraries, plugins, templates } from './data.ts';

// Read the homepage.stx template
const template = await Bun.file('./homepage.stx').text();

// Find and replace the @foreach loop for desktop icons
const desktopIconsHTML = desktopIcons.map(icon => `
        <button
          class="desktop-icon"
          data-icon-id="${icon.id}"
          data-icon-type="${icon.type}"
          data-icon-section="${icon.section || ''}"
          data-icon-url="${icon.url || ''}"
        >
          <div class="desktop-icon-image">${icon.icon}</div>
          <div class="desktop-icon-label">${icon.title}</div>
        </button>`).join('\n');

// Replace desktop icons @foreach loop
let html = template.replace(
  /@foreach\(desktopIcons as icon\)[\s\S]*?@endforeach/,
  desktopIconsHTML
);

// Generate and replace libraries @foreach loop
const librariesHTML = libraries.map(library => `
            <a href="${library.url}" target="_blank" class="folder-item">
              <div class="folder-item-icon">📦</div>
              <div class="folder-item-content">
                <div class="folder-item-name">${library.name}</div>
                <div class="folder-item-desc">${library.desc}</div>
              </div>
            </a>`).join('\n');

html = html.replace(
  /@foreach\(libraries as library\)[\s\S]*?@endforeach/,
  librariesHTML
);

// Generate and replace plugins @foreach loop
const pluginsHTML = plugins.map(plugin => `
            <a href="${plugin.url}" target="_blank" class="folder-item">
              <div class="folder-item-icon">🔌</div>
              <div class="folder-item-content">
                <div class="folder-item-name">${plugin.name}</div>
                <div class="folder-item-desc">${plugin.desc}</div>
              </div>
            </a>`).join('\n');

html = html.replace(
  /@foreach\(plugins as plugin\)[\s\S]*?@endforeach/,
  pluginsHTML
);

// Generate and replace templates @foreach loop
const templatesHTML = templates.map(template => `
            <a href="${template.url}" target="_blank" class="folder-item">
              <div class="folder-item-icon">📋</div>
              <div class="folder-item-content">
                <div class="folder-item-name">${template.name}</div>
                <div class="folder-item-desc">${template.desc}</div>
              </div>
            </a>`).join('\n');

html = html.replace(
  /@foreach\(templates as template\)[\s\S]*?@endforeach/,
  templatesHTML
);

// Remove the module.exports script block since data is now in data.js
html = html.replace(
  /<script>[\s\S]*?module\.exports = \{[\s\S]*?\};[\s\S]*?<\/script>/,
  ''
);

// Write the output
await Bun.write('./homepage-full.html', html);

console.log('✓ Built homepage-full.html');
console.log(`  Desktop icons rendered: ${desktopIcons.length}`);
console.log(`  Libraries rendered: ${libraries.length}`);
console.log(`  Plugins rendered: ${plugins.length}`);
console.log(`  Templates rendered: ${templates.length}`);
console.log(`  File size: ${html.length} bytes`);
