/* eslint-disable @typescript-eslint/no-unused-vars */
import browser from "webextension-polyfill"
import React, { useEffect, useState } from "react"
import type { NoDataMessage, VodSkipperSettings } from "../types"

const Popup = (): JSX.Element => {
  const [enabled, setEnabled] = useState(true)
  const [message, setMessage] = useState(
    `VODSkipper is currently ${enabled ? "enabled" : "disabled"}.`,
  )
  const [error, setError] = useState("")
  const [display, setDisplay] = useState("")

  useEffect(() => {
    void (async () => {
      const response: VodSkipperSettings = await browser.runtime.sendMessage({
        action: "checkEnabled",
        data: true,
      })
      setEnabled(response.enabled)
    })()

    const noDataListener = ({ action }: NoDataMessage): void => {
      if (action === "getData") {
        setMessage(message + "No muted segments found for this vod.")
      }
    }

    browser.runtime.onMessage.addListener(noDataListener)

    return () => {
      browser.runtime.onMessage.removeListener(noDataListener)
    }
  }, [])

  useEffect(() => {
    if (browser.runtime === undefined) {
      setEnabled(false)
    }
  }, [browser.runtime])

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
