import type * as ts from 'typescript/lib/tsserverlibrary'

function init(_modules: { typescript: typeof ts }): ts.server.PluginModule {
  return {
    create(info: ts.server.PluginCreateInfo): ts.LanguageService {
      // Get the original language service
      const languageService = info.languageService

      // Return the original language service with minimal changes
      // Just register STX files with the language service
      return languageService
    },

    getExternalFiles(project: ts.server.Project): string[] {
      // Add STX and MD files to the project
      return project.getFileNames().filter(file =>
        file.endsWith('.stx') ||
        file.endsWith('.md')
      )
    },
  }
}

export default init
