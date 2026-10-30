import { parentPort, workerData } from 'node:worker_threads'
import { bundleClientScript, tempBuildName } from '../../../src/client-script-bundler'

if (typeof workerData === 'string') {
  parentPort!.postMessage(tempBuildName(workerData))
}
else {
  const { script, templatePath, projectRoot, cacheDir } = workerData
  parentPort!.postMessage(await bundleClientScript(script, templatePath, {
    projectRoot, cacheDir, throwOnFailure: true, externalizeUserModules: false,
  }))
}
parentPort!.close()
