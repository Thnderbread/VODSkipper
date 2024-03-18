const { createServer } = require("@mocks-server/main")
const collections = require("./collections.cjs")
const runTest = require('./runTest.cjs').default
const routes = require("./routes/api.cjs")
const { exit } = require('node:process')
const path = require('path')

const test = process.argv.slice(2).pop()
const wdioConfig = process.env.CI ? 'wdio.test.conf.ci.ts' : 'wdio.test.conf.ts'
const wdioTestFile = path.join(__dirname, '..', wdioConfig)

const server = createServer()

if (test === 'background') {
  let exitCode
  server.start().then(async () => {
    const { loadRoutes, loadCollections } = server.mock.createLoaders()
    loadRoutes(routes)
    loadCollections(collections)

    await server.mock.collections.select("segments", { check: true })

    server.logger.info("Running wdio background tests...")
    try {
      await runTest(`wdio run ${wdioTestFile} BACKGROUND`, server)
      exitCode = 0
    } catch (error) {
      exitCode = 1
    } finally {
      await server.stop()
      exit(exitCode)
    }
  })
} else if (test === 'popup') {
  let exitCode
  server.start().then(async () => {
    try {
      const { loadRoutes, loadCollections } = server.mock.createLoaders()
      loadRoutes(routes)
      loadCollections(collections)

      server.logger.info("Running wdio popup tests...")
      server.logger.info("Running 'serverless' test specs...")
      await server.mock.collections.select("server_failure", { check: true })
      await runTest(`wdio run ${wdioTestFile} SERVERLESS`, server)

      // server timeout message
      server.logger.info("Running 'timeout' test specs...")
      await server.mock.collections.select("server_timeout", { check: true })
      await runTest(`wdio run ${wdioTestFile} TIMEOUT`, server)

      // segments > 0 / segments === 0 messages
      server.logger.info("Running 'actual' test specs...")
      await server.mock.collections.select("segments", { check: true })
      await runTest(`wdio run ${wdioTestFile} SEGMENTS`, server)

      exitCode = 0
    } catch (error) {
      exitCode = 1
    } finally {
      await server.stop()
      exit(exitCode)
    }
  })
} else if (test === 'content') {
  let exitCode
  server.start().then(async () => {
    const { loadRoutes, loadCollections } = server.mock.createLoaders()
    loadRoutes(routes)
    loadCollections(collections)

    try {
      await server.mock.collections.select("segments", { check: true })

      server.logger.info("Running wdio content tests...")
      await runTest(`wdio run ${wdioTestFile} CONTENT`, server)

      exitCode = 0
    } catch (error) {
      exitCode = 1
    } finally {
      await server.stop()
      exit(exitCode)
    }
  })
} else {
  throw new Error(`Unsupported test type: ${test}.`)
}
