import clsx from "clsx"
import React, { useState } from "react"
import browser from "webextension-polyfill"
import { PopupMessages, SwitchProps } from "../common/stuff"
import { ToggleSwitchWithLabel } from "../common/ToggleSwitch"
import {
  ContentScriptResponse,
  SetEnabledResponse,
  UpdateTimeMessage,
} from "../types"

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
    (
      { action, data }: UpdateTimeMessage,
      sender,
      response: ResponseCallback,
    ) => {
      if (action === "updateTime") {
        // ! Remove this
        console.log(
          `Received bg message to update time to: ${data} from ${nearestSegmentStart}`,
        )
        try {
          setNearestSegmentStart(data)
          setDisplayMessage(`Next muted segment at ${nearestSegmentStart}`)
          response({ data: true })
        } catch (error) {
          console.error("Idk wtf goin on: ", error)
        } finally {
          return true
        }
      }
    },
  )

  // TODO: Only send setEnabled message if enabled is being changed to false
  // TODO: Send second setEnabled message to BG script.
  async function handleToggle(): Promise<void> {
    // ! Remove this
    console.log("attempting to send a message to the content script...")
    try {
      const tabs = await browser.tabs.query({
        active: true,
        lastFocusedWindow: true,
      })
      const currentTab: browser.Tabs.Tab = tabs[0]

      if (currentTab && currentTab.id) {
        const csResponse: SetEnabledResponse = await browser.tabs.sendMessage(
          currentTab.id,
          {
            action: "setEnabled",
            data: enabled,
          },
        )
        // ! Remove this
        console.log(
          `CS Response type: ${typeof csResponse} | csResponse message: ${csResponse} | stringify: ${JSON.stringify(
            csResponse,
          )}`,
        )
      } else {
        // ! Remove this
        console.error(
          `Either no tab: ${currentTab} or no id: ${
            currentTab?.id ?? "no id shruge"
          }. Here's the tabs array: ${tabs}\n`,
        )
      }

      // ! Remove this
      console.log("Attempting to send message to bg script...")
      const bgResponse: SetEnabledResponse = await browser.runtime.sendMessage({
        action: "setEnabled",
        data: enabled,
      })
      // ! Remove this
      console.log(
        `BG Response type: ${typeof bgResponse} | bgResponse message: ${bgResponse} | stringify: ${JSON.stringify(
          bgResponse,
        )}`,
      )
    } catch (error) {
      console.error(`Failed: ${error}`)
    } finally {
      // ! Remove this
      console.log(`Changing enabled state to ${!enabled}.`)
      setEnabled(!enabled)
    }
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
          setEnabled={handleToggle}
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
