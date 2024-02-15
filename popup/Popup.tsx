/* eslint-disable @typescript-eslint/no-unused-vars */
import browser from "webextension-polyfill"
import React, { useEffect, useState } from "react"
import sendStatusMessage from "./utils/statusMessageSender"

const Popup = (): JSX.Element => {
  const [result, setResult] = useState("")
  // const [display, setDisplay] = useState("")
  const [message, setMessage] = useState("Loading...")
  browser.extension.getBackgroundPage()

  // TODO: Refactoring.
  // TODO: Fix session storage to use caches api.
  /**
   * TODO: Check whether shit is enabled
   * TODO: Check whether segments exist
   * TODO: USING "https://www.twitch.tv/videos/*" IN MATCHES FIELD TRIGGERS CORS! RE-ENABLE THAT SHIT
   * TODO: Check for server response
   * TODO: Go through all possible content script errors and see if they show up in the popup when they happen
   * TODO: Try removing scripting permission and see if shit still works - user risk to have that needed.
   * TODO: When you write e2es, cover a case where a call is made to server and stuff is cached. Reload the page & make sure cache persists, and popup message is correct.
   * (or just write the e2es)
   * ? Only display message, error, or disabled joint. While fetching, show a loading thing.
   * ? Wait for fetching? i.e., if the content script is hit for stuff, be like yo it's still loading
   * ? and wait?
   */

  useEffect(() => {
    void (async () => {
      /**
       * Check result variable for saved
       * message to avoid querying on each load
       */
      if (result) {
        setMessage(result)
        console.log(`There's already a result: ${result}.`)
        return
      }

      // Check for active in case multiple vod
      // tabs are open
      // ! Test this works
      result &&
        console.log(
          `There's already a result: ${result} so shouldn't see this.`,
        )
      const tabs = await browser.tabs.query({
        url: "https://www.twitch.tv/videos/*",
        // lastFocusedWindow: true,
        active: true,
      })
      const currentTab = tabs[0]

      const response = await sendStatusMessage(currentTab)
      setResult(response)
      setMessage(response)
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
