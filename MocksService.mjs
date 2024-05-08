import pkg from '@mocks-server/main'
const { createServer } = pkg
import collections from "./mocks/collections.cjs"
import routes from "./mocks/routes/api.cjs"
import { appendFileSync } from "node:fs"
import { SevereServiceError } from "webdriverio"

/**
 * The names of collections for MocksServer
 */
const MocksCollections = Object.freeze({
  SEGMENTS: 'segments',
  TIMEOUT: 'server_timeout',
  FAILURE: 'server_failure',
})

class MocksWorkerService {
  constructor(serviceOptions, capabilities, config) {
    /** Matches test names to their mocks collection. */
    this.collectionsMap = {
      'content': MocksCollections.SEGMENTS,
      'background': MocksCollections.SEGMENTS,
      'popupTimeout': MocksCollections.TIMEOUT,
      'popupSegments': MocksCollections.SEGMENTS,
      'popupServerless': MocksCollections.FAILURE
    }
    this._server = null
    this._logFile = "runner.txt"

  }

  _getServerInstance() {
    try {
      this._server = createServer()
      this._server.start().then(async () => {
        const { loadRoutes, loadCollections } = this._server.mock.createLoaders()

        throw SevereServiceError
        loadRoutes(routes)
        loadCollections(collections)
      })

    } catch (error) {
      appendFileSync(this._logFile, `some error happened while tryna create the server instance: ${error}\n`)
      throw SevereServiceError(error.message)
    }
  }

  before(config, capabilities, browser) {
    this._getServerInstance()
  }

  async beforeTest(test, context) {
    try {
      const testName = test.title[0].toLowerCase()
      const collectionName = this.collectionsMap[testName]

      if (collectionName === undefined) {
        appendFileSync(this._logFile, `Collection name is undefined: '${testName}' is not a key.\n`)
      }
      await this._server.mock.collections.select(collectionName, { check: true })

    } catch (error) {
      appendFileSync(this._logFile, `Some error happened in before test hook: ${error.message}\n`)
      throw SevereServiceError(error.message)
    }
  }

  /**
   * For some reason the issue is here -
   * the "after" hook took 3 minutes to run:
   * 
   * Try using the other hooks maybe (onWorkerEnd, onComplete)
   * 
   * Also, in the .spec files, Rename the tests to have a name that can be used in this.collectionsMap. That way the beforeTest hook can use test.title to get the needed collection.
   */
  async after(exitCode, config, capabilites) {
    try {
      if (this._server !== null) await this._server.stop()
    } catch (error) {
      throw SevereServiceError(error.message)
    }
  }
}

export default new MocksWorkerService()
