const { spawn } = require('node:child_process')
const which = require('which')
const path = require('path')

function runTest(testCommand, server = null) {
  const npxPath = which.sync('npx')

  if (!npxPath) throw new Error("Can't find npx executable.")
  if (!testCommand) throw new Error("Please supply test command.")

  const args = testCommand.split(' ')
  const npxExecutable = npxPath.split(path.sep).pop()

  const logger = server?.logger ?? console

  // sub is of type never if this isn't done
  if (!npxExecutable) throw new Error("Missing npx executable.")

  const wdioPrefix = '\u001b[90mwdio\u001b[0m'

  return new Promise((resolve, reject) => {
    const sub = spawn(npxExecutable, args)
    let inResultsBlock = false

    sub.on('error', (error) => {
      logger.error('Subprocess error: ', error)
      reject(error)
    })

    sub.stdout.on('data', (data) => {
      logger.info(`\b[${wdioPrefix}] ${data.toString()}`)
      // if (data.includes('"spec" Reporter:')) {
      //   inResultsBlock = true
      // }

      // if (inResultsBlock) {
      // }

      // if (data.includes('Spec Files:')) {
      //   inResultsBlock = false
      // }
    })

    sub.stderr.on('data', (data) => {
      logger.error(`\b[${wdioPrefix}] ${data.toString()}`)
      // if (data.includes('"spec" Reporter:')) {
      //   inResultsBlock = true
      // }

      // if (inResultsBlock) {
      // }

      // if (data.includes('Spec Files:')) {
      //   inResultsBlock = false
      // }
    })

    sub.on('close', (code) => {
      if (code === 0) {
        logger.info(`Subprocess exited with code ${code}`)
        resolve()
        return
      } else {
        logger.error(`Subprocess exited with code ${code}`)
        reject()
        return
      }
    })
  })
}

module.exports = {
  default: runTest
}
