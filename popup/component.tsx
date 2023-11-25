import clsx from "clsx"
import React, { useState } from "react"
import browser from "webextension-polyfill"
import { PopupMessages, SwitchProps } from "../common/stuff"
import { ToggleSwitchWithLabel } from "../common/ToggleSwitch"

/**
 * Just displays shit. Obtain data from session storage
 * for showing numbers and stuff.
 *
 * Listen for new times from content script.
 */

// export const messages: PopupMessages = {
//   errorMessage: "Something went wrong. Try refreshing the page.",
//   noMutedSegmentsMessage: "Didn't detect any muted segments in this VOD.",
//   nearestSegmentMessage: `Muted segment at ${formatCurrentTime(21197.118775)}`,
//   passedAllSegmentsMessage: "No muted segments remaining in this VOD.",
//   loadingMessage: "Loading muted segment data...",
// }

// TODO: [✅] Send a message when enabled is toggled.
// TODO: Should cancel everything on content-script side.
type ResponseCallback = <T>(data: T) => void

export default () => {
  const [fact, setFact] = useState("Click the button to fetch a fact!")
  const [enabled, setEnabled] = useState(true)
  const [loading, setLoading] = useState(false)
  const [mutedSegments, setMutedSegments] = useState([])
  const [nearestSegment, setNearestSegment] = useState({})

  const [errorMessage, setErrorMessage] = useState("")
  const [displayMessage, setDisplayMessage] = useState("")
  const [nearestSegmentStart, setNearestSegmentStart] = useState(0)

  browser.runtime.onMessage.addListener(
    (message, sender, response: ResponseCallback) => {
      if (message.action === "updateTime") {
        if (message.data === "Bad token.") {
          setErrorMessage(message.data)
          response({ data: true })
        } else if (
          message.data === "No muted segment data found for this vod."
        ) {
          setDisplayMessage(message.data)
          response({ data: true })
        } else if (typeof message.data === "number") {
          setNearestSegmentStart(message.data)
          setDisplayMessage(`Next muted segment at ${nearestSegmentStart}`)
          response({ data: true })
        } else {
          console.error("Idk wtf goin on: ", message.data)
          response({ data: true })
        }
        return true
      }
    },
  )

  async function handleToggle(enabled: boolean) {
    await browser.runtime.sendMessage({ action: "setEnabled", data: !enabled })
    setEnabled(!enabled)
  }

  return (
    <div className="flex flex-col gap-4 p-4 shadow-sm bg-black bg-opacity-100 w-96">
      <h1>VODSkipper</h1>
      <div className="border border-solid border-gray-700"></div>
      <div>
        <ToggleSwitchWithLabel
          switchTitle={"Enabled"}
          switchDescription={
            "Uncheck to disable. Keeps the page from refreshing."
          }
          enabled={enabled}
          setEnabled={() => handleToggle(enabled)}
        />
      </div>

      <div className="border border-solid border-gray-700"></div>

      <div
        hidden={false}
        className="text-center justify-center text-lg text-white mb-10"
      >
        {"This is where messages will be displayed!"}
      </div>
    </div>
  )
}
