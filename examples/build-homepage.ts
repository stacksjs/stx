import { apps, desktopIcons, frameworks, libraries, packages, plugins, sponsorware, templates } from './data.ts'

async function buildHomepage() {
  // Read the homepage.stx template
  const template = await Bun.file('./homepage.stx').text()

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
        </button>`).join('\n')

  // Replace desktop icons @foreach loop
  let html = template.replace(
    /@foreach\(desktopIcons as icon\)[\s\S]*?@endforeach/,
    desktopIconsHTML,
  )

  // Generate and replace libraries @foreach loop
  const librariesHTML = libraries.map(library => `
            <a href="${library.url}" target="_blank" class="folder-item">
              <div class="folder-item-icon">📦</div>
              <div class="folder-item-content">
                <div class="folder-item-name">${library.name}</div>
                <div class="folder-item-desc">${library.desc}</div>
              </div>
            </a>`).join('\n')

  html = html.replace(
    /@foreach\(libraries as library\)[\s\S]*?@endforeach/,
    librariesHTML,
  )

  // Generate and replace plugins @foreach loop
  const pluginsHTML = plugins.map(plugin => `
            <a href="${plugin.url}" target="_blank" class="folder-item">
              <div class="folder-item-icon">🔌</div>
              <div class="folder-item-content">
                <div class="folder-item-name">${plugin.name}</div>
                <div class="folder-item-desc">${plugin.desc}</div>
              </div>
            </a>`).join('\n')

  html = html.replace(
    /@foreach\(plugins as plugin\)[\s\S]*?@endforeach/,
    pluginsHTML,
  )

  // Generate and replace templates @foreach loop
  const templatesHTML = templates.map(template => `
            <a href="${template.url}" target="_blank" class="folder-item">
              <div class="folder-item-icon">📋</div>
              <div class="folder-item-content">
                <div class="folder-item-name">${template.name}</div>
                <div class="folder-item-desc">${template.desc}</div>
              </div>
            </a>`).join('\n')

  html = html.replace(
    /@foreach\(templates as template\)[\s\S]*?@endforeach/,
    templatesHTML,
  )

  // Generate and replace frameworks @foreach loop
  const frameworksHTML = frameworks.map(framework => `
                <a href="${framework.url}" target="_blank" class="folder-item">
                  <div class="folder-item-icon">🏗️</div>
                  <div class="folder-item-content">
                    <div class="folder-item-name">${framework.name}</div>
                    <div class="folder-item-desc">${framework.desc}</div>
                  </div>
                </a>`).join('\n')

  html = html.replace(
    /@foreach\(frameworks as framework\)[\s\S]*?@endforeach/,
    frameworksHTML,
  )

  // Generate and replace sponsorware @foreach loop
  const sponsorwareHTML = sponsorware.map(item => `
                <a href="${item.url}" target="_blank" class="folder-item">
                  <div class="folder-item-icon">💎</div>
                  <div class="folder-item-content">
                    <div class="folder-item-name">${item.name}</div>
                    <div class="folder-item-desc">${item.desc}</div>
                  </div>
                </a>`).join('\n')

  html = html.replace(
    /@foreach\(sponsorware as item\)[\s\S]*?@endforeach/,
    sponsorwareHTML,
  )

  // Generate and replace apps @foreach loop
  const appsHTML = apps.map(app => `
                <a href="${app.url}" target="_blank" class="folder-item">
                  <div class="folder-item-icon">📱</div>
                  <div class="folder-item-content">
                    <div class="folder-item-name">${app.name}</div>
                    <div class="folder-item-desc">${app.desc}</div>
                  </div>
                </a>`).join('\n')

  html = html.replace(
    /@foreach\(apps as app\)[\s\S]*?@endforeach/,
    appsHTML,
  )

  // Generate and replace PackageGrid component
  const packagesHTML = packages.map(pkg => `
    <div class="package-item">
      <div class="package-emoji">${pkg.emoji}</div>
      <div class="package-title">${pkg.title}</div>
      <div class="package-desc">${pkg.desc}</div>
    </div>`).join('\n')

  const packageGridHTML = `<div class="package-grid">\n${packagesHTML}\n  </div>`

  html = html.replace(
    /<PackageGrid items="\{\{ packages \}\}" \/>/,
    packageGridHTML,
  )

  // Remove the module.exports script block since data is now in data.js
  html = html.replace(
    /<script>[\s\S]*?module\.exports = \{[\s\S]*?\};[\s\S]*?<\/script>/,
    '',
  )

  // Write the output
  await Bun.write('./homepage.stx', html)

  console.log('✓ Built homepage.stx')
  console.log(`  Desktop icons rendered: ${desktopIcons.length}`)
  console.log(`  Libraries rendered: ${libraries.length}`)
  console.log(`  Plugins rendered: ${plugins.length}`)
  console.log(`  Templates rendered: ${templates.length}`)
  console.log(`  Frameworks rendered: ${frameworks.length}`)
  console.log(`  Sponsorware rendered: ${sponsorware.length}`)
  console.log(`  Apps rendered: ${apps.length}`)
  console.log(`  File size: ${html.length} bytes`)
}

// Execute the build function
buildHomepage().catch(console.error)
