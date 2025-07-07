import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

// Interface for init options
interface InitOptions {
  force?: boolean
  template?: string // Path to a template file
}

/**
 * Initialize a new STX file with the specified name
 */
export async function initFile(fileName: string = 'index.stx', options: InitOptions = {}): Promise<boolean> {
  try {
    // Set default options
    const force = options.force || false

    // Resolve file path
    const filePath = path.resolve(process.cwd(), fileName)

    // Check if file exists
    if (fs.existsSync(filePath)) {
      if (!force) {
        throw new Error(`File ${fileName} already exists. Use --force to overwrite.`)
      }

      console.warn(`File ${fileName} already exists. Overwriting...`)
    }

    // Create directory if it doesn't exist
    const dirPath = path.dirname(filePath)
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true })
    }

    // Get the template content
    let templateContent: string

    // If a template is specified, use that file as the template
    if (options.template) {
      const templatePath = path.resolve(process.cwd(), options.template)

      if (!fs.existsSync(templatePath)) {
        throw new Error(`Template file ${options.template} does not exist.`)
      }

      if (!templatePath.endsWith('.stx')) {
        console.warn(`Warning: Template file ${options.template} does not have a .stx extension. Using it anyway.`)
      }

      templateContent = fs.readFileSync(templatePath, 'utf-8')
      console.warn(`Using template from ${options.template}`)
    }
    else {
      // Use default template
      templateContent = getDefaultTemplate()
    }

    // Write the file
    fs.writeFileSync(filePath, templateContent)

    console.warn(`Created new STX file: ${fileName}`)
    return true
  }
  catch (error) {
    console.error(`Error creating file: ${error instanceof Error ? error.message : String(error)}`)
    return false
  }
}

/**
 * Get the default template content for a new STX file
 */
function getDefaultTemplate(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{ title }}</title>
  <script>
    export const title = "My STX Page";
    export const description = "A page built with STX";
    export const items = [
      "Templates with TypeScript support",
      "Powerful directives",
      "Reusable components"
    ];
  </script>
  <style>
    :root {
      --primary-color: #3498db;
      --dark-color: #34495e;
      --light-color: #ecf0f1;
      --font-main: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    body {
      font-family: var(--font-main);
      line-height: 1.6;
      color: var(--dark-color);
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
    }

    h1 {
      color: var(--primary-color);
    }

    .content {
      margin-top: 2rem;
    }

    ul {
      padding-left: 1.5rem;
    }

    li {
      margin-bottom: 0.5rem;
    }
  </style>
</head>
<body>
  <header>
    <h1>{{ title }}</h1>
    <p>{{ description }}</p>
  </header>

  <div class="content">
    <h2>Features</h2>
    <ul>
      @foreach(items as item)
        <li>{{ item }}</li>
      @endforeach
    </ul>
  </div>
</body>
</html>`
}
