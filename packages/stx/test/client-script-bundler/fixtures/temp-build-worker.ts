import { parentPort, workerData } from 'node:worker_threads'
import { tempBuildName } from '../../../src/client-script-bundler'

parentPort!.postMessage(tempBuildName(String(workerData)))
parentPort!.close()
