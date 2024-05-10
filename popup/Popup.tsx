import browser from "webextension-polyfill"
import parseMetadata from "./utils/parseMetadata"
import React, { useEffect, useState } from "react"
import type { CacheObjectLiteral } from "../types"
import { isValidVod } from "../content-script/utils/utils"
import { checkCache } from "../background/utils/cacheHandler"

const Popup = (): JSX.Element => {
  const [message, setMessage] = useState("Loading...")

  useEffect(() => {
    async function displayInfo(): Promise<void> {
      const tabs = await browser.tabs.query({
        url: "https://www.twitch.tv/videos/*",
        active: true,
      })
      const currentTab = tabs[0]
      const vodId = isValidVod(currentTab?.url ?? "")

      if (currentTab?.id === undefined || vodId === false) {
        setMessage("No vod detected.")
        return
      }

      const cachedObject = await checkCache(vodId)
      if (cachedObject?.metadata !== undefined) {
        const displayString = parseMetadata(cachedObject)
        setMessage(displayString)
        return
      }

      const handler = (
        changes: Record<string, browser.Storage.StorageChange>,
        area: string,
      ): void => {
        if (area === "session") {
          const cachedObject = changes[vodId]
            .newValue satisfies CacheObjectLiteral as CacheObjectLiteral

          const displayString = parseMetadata(cachedObject)
          setMessage(displayString)
        }
        browser.storage.onChanged.removeListener(handler)
      }

      browser.storage.onChanged.addListener(handler)
    }
    void displayInfo()
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
