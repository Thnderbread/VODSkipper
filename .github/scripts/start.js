#!/usr/bin/env node

import url from 'node:url'
import path from 'node:path'
import fs from 'node:fs/promises'

import { remote } from 'webdriverio'

import pkg from '../../package.json' assert { type: 'json' }

const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

/**
 * start WebDriver session with extension installed
 */
async function startBrowser(browserName) {
  const capabilities = browserName === 'chrome'
    ? {
      browserName,
      browserVersion: "stable",
      'goog:chromeOptions': {
        args: [
          `--load-extension=${path.join(__dirname, '..', '..', 'dist')}`,
          `--remote-debugging-port=9222`,
          '--remote-debugging-host=0.0.0.0',
          '--disable-audio'
        ]
      }
    }
    : browserName === 'firefox'
      ? {
        browserName,
        'moz:firefoxOptions': {
          args: ['-start-debugger-server', '6080', ''],
          prefs: {
            'devtools.debugger.remote-enabled': true,
            'dom.disable_open_during_load': false,
            'devtools.chrome.enabled': true,
          },
          // binary: path.join('C:', 'Program Files', 'Firefox Developer Edition', 'firefox.exe')
        }
      } : { browserName }
  const browser = await remote({
    // logLevel: 'error',
    capabilities
  })

  const vodUrl = 'https://www.twitch.tv/videos/1780240732'

  const debuggingUrls = {
    "edge": 'edge://extensions/',
    "chrome": 'chrome://extensions/',
    "firefox": 'about:debugging#/runtime/this-firefox'
  }

  if (browserName === "firefox") {
    const extension = await fs.readFile(path.join(__dirname, '..', '..', `web-extension-firefox-v${pkg.version}.xpi`))
    await browser.installAddOn(extension.toString('base64'), true)

    await browser.url("about:addons")
    // Give a second for stuff to load
    await new Promise(r => setTimeout(r, 1000))

    const extensionButton = await browser.$("span=Extensions")
    await extensionButton.click()

    const ext = await browser.$(`a=VodSkipper`)
    if (!ext) throw new Error("Couldn't find your extension.")
    await ext.click()

    const permissions = await browser.$("button=Permissions")
    await permissions.click()

    const permissionsContainer = await browser.$("#permission-0")
    const permissionLabel = await permissionsContainer.shadow$("label")

    const toggleButton = await permissionLabel.$("button")
    await toggleButton.click()
  }

  await browser.execute((url) => {
    window.open(url, '_blank')
  }, vodUrl)
  await browser.url(debuggingUrls[browserName])
}

const browserName = process.argv.slice(2).pop() || 'chrome'
console.log(`Run web extension in ${browserName}...`)
await startBrowser(browserName)
