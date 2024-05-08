const { createServer } = require("@mocks-server/main")
const collections = require("./collections.cjs")
const runTest = require('./runTest.cjs').default
const routes = require("./routes/api.cjs")
const { exit } = require('node:process')
const path = require('path')

const test = process.argv.slice(2).pop()
const wdioTestFile = path.join(__dirname, '..', 'wdio.test.conf.ts')

const server = createServer()

/**
 * Promise.all for this stuff? Probably need a wrapper thingy
 * Needs to start the server, run the test, stop the server
 * Or, maybe there's a way to start the server & switch it
 * programmatically
 * 
 * Maybe something that takes in server instance and changes
 * collections thingy before / in between running tests
 * 
 * Class that takes in Server instance and array that has all test types (bg, content)
 * Class can parse all the test types and create async functions for them
 * those async functions can modify the classes server instance directly & set collections
 * 
 * running w/o args will run all tests in config file
 * 
 */
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
      server.logger.info("Running 'real' test specs...")
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

// test factory fn that takes collection & test command
//   
// for each test type, run
// timers? one per or just one?
// for test of args:
/**
 * create test context
 * - context knows which server collection(s) it needs
 * - pass in some object that maps suites to collections?
 * -  
 */
class TestRunner { }

/**
 * Need some way to start mocks server before all tests
 * Before suite is where collections can be swapped
 * WorkerService class can just create a server instance and
 * hold it internally, singleton style
 * 
 * then before each suite it can change the collection accordingly
 */
