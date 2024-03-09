import browser from "webextension-polyfill"
import React, { useEffect, useState } from "react"
import sendStatusMessage from "./utils/statusMessageSender"

const Popup = (): JSX.Element => {
  const [message, setMessage] = useState("Loading...")

  useEffect(() => {
    void (async () => {
      const tabs = await browser.tabs.query({
        url: "https://www.twitch.tv/videos/*",
        active: true,
      })
      const currentTab = tabs[0]

      if (currentTab?.id === undefined) {
        setMessage("No vod detected.")
        return
      }

      const result = await sendStatusMessage(currentTab.id)

      setMessage(result)
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
