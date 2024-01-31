/* eslint-disable @typescript-eslint/no-unused-vars */
import browser from "webextension-polyfill"
import React, { useEffect, useState } from "react"
import type { StatusMessageResponse } from "../types"

const Popup = (): JSX.Element => {
  const [enabled, setEnabled] = useState(true)
  const [message, setMessage] = useState("Doing stuff...")

  const [error, setError] = useState("")
  const [display, setDisplay] = useState("")

  /**
   * TODO: Check whether shit is enabled
   * TODO: Check whether segments exist
   * TODO: Check for server response
   * TODO: If opened too soon, joint can incorrectly display no muted segments message.
   * ? Only display message, error, or disabled joint. While fetching, show a loading thing.
   * ? Wait for fetching? i.e., if the content script is hit for stuff, be like yo it's still loading
   * ? and wait?
   */

  useEffect(() => {
    if (!enabled) {
      return
    }

    void (async () => {
      const tabs = await browser.tabs.query({
        url: "https://www.twitch.tv/videos/*",
      })
      const currentTab = tabs[0]

      if (currentTab && currentTab.id) {
        // ! Remove this
        console.log("Have the tab & id. Tryna get info.")
        // Get information about the fetch operation -
        const response: StatusMessageResponse = await browser.tabs.sendMessage(
          currentTab.id,
          {
            action: "getStatus",
          },
        )
        if (Object.hasOwnProperty.call(response, "error") && response.error) {
          // ! Remove this
          console.log(
            `Got a response, but there's an error: ${JSON.stringify(
              response.error,
            )}`,
          )
          // TODO: Check if response.error is disabled extension, abort error, or any other specifics
          setError(response.error.message)
        } else if (response.segmentLength === 0) {
          // ! Remove this
          console.log("Got a response, no muted segments.")
          setMessage("No muted segments for this vod.")
        } else {
          // ! Remove this
          console.log("Got a response, everything is fine.")
          setMessage(`This vod has ${response.segmentLength} muted segments.`)
        }
      } else {
        // ! Remove this
        console.warn(
          `No tab ${currentTab} or tab id: ${
            currentTab?.id
          } or tabs: ${JSON.stringify(tabs)}`,
        )
      }
    })()
  }, [])

  useEffect(() => {
    if (browser.runtime === undefined) {
      setEnabled(false)
    }
  }, [browser.runtime])

  useEffect(() => {
    if (!enabled) {
      setDisplay("VODSkipper is currently disabled.")
    }
  }, [enabled])

  useEffect(() => {
    if (error !== "") {
      setDisplay(error)
    }
  }, [error])

  useEffect(() => {
    if (message !== "") {
      setDisplay(message)
    }
  }, [message])

  return (
    <div className="flex flex-col gap-4 p-4 shadow-sm bg-black bg-opacity-100 w-96">
      <h1>VODSkipper</h1>
      <div className="border border-solid border-gray-700"></div>
      <p className="text-center justify-center text-lg text-white mb-4">
        {display}
      </p>
    </div>
  )
}

export default Popup
