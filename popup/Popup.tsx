import browser from "webextension-polyfill"
import React, { useEffect, useState } from "react"
// import sendStatusMessage from "./utils/statusMessageSender"
import { checkCache } from "../background/utils/cacheHandler"
import { isValidVod } from "../content-script/utils/utils"

const Popup = (): JSX.Element => {
  const [message, setMessage] = useState("Loading...")

  /**
   * Concerns:
   *
   * Popup fetches when it wants
   * Some way to show registered errors. (Send from bg script?)
   * Some mechanism for when content script isn't ready (storage listener?)
   *
   * Change the storage mechanism:
   *  Stores the segments and vod metadata, like: {
   *    error: message (or maybe status code & message as object or tuple?),
   *    muted_segments: true,
   *    num_segments: foo,
   * }
   *    segments: segments_array
   * on each mount, just check the storage joint for needed info.
   * this means content script doesn't need error info, fix that.
   * * Remove error storage in content script - it just needs to know whether to run skips or not
   * * Bg script doesn't need to send anything specific to content script
   *
   * ! Remove all the error message stuff from content script,
   * ! Fix tests to not need that stupid timeout bs, and done!
   *
   */
  useEffect(() => {
    void (async () => {
      const tabs = await browser.tabs.query({
        url: "https://www.twitch.tv/videos/*",
        active: true,
      })
      const currentTab = tabs[0]
      const vodId = isValidVod(currentTab.url ?? "")

      if (currentTab?.id === undefined || vodId === false) {
        setMessage("No vod detected.")
        return
      }

      const cachedObject = await checkCache(vodId)
      if (cachedObject !== undefined) {
        const { error, hasSegments, numSegments } = cachedObject.metadata

        if (error !== "") {
          setMessage(error)
          return
        }

        setMessage(
          `This vod has ${hasSegments ? numSegments : "no"} muted segment${
            numSegments === 1 ? "" : "s"
          }.`,
        )
      }
    })()
  }, [])

  return (
    <div className="flex flex-col gap-4 p-4 shadow-sm bg-black bg-opacity-100 w-96">
      <h1>VODSkipper</h1>
      <div className="border border-solid border-gray-700"></div>
      <p className="text-center justify-center text-lg text-white mb-4">
        {message}
      </p>
    </div>
  )
}

export default Popup
