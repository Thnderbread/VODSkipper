import clsx from "clsx"
import React, { useState } from "react"
import browser from "webextension-polyfill"
import { PopupMessages, SwitchProps } from "../common/stuff"

/**
 * Shows the given time in a friendlier HH:mm:ss format.
 *
 * @param seconds The current time in seconds to format.
 * @returns A HH:mm:ss string based on the given seconds value.
 */
function formatCurrentTime(seconds: number): string {
  if (isNaN(seconds)) {
    return ""
  }

  /**
   * Creates a string for the given number.
   * Adds a 0 in front of the given number if
   * necessary.
   *
   * @param time The number to beautify.
   * @returns The number as a string.
   */
  function beautifyNumber(time: number): string {
    return time > 10
      ? Math.floor(time).toString()
      : Math.floor(time).toString().padStart(2, "0")
  }

  /**
   * Format the number. If the current time is under 60s,
   * pass it to beautifyNumber and return it.
   *
   * Otherwise - calculate the needed values (HH, mm, ss),
   * construct a string based off of them, and return that.
   */
  if (seconds < 60) {
    return beautifyNumber(seconds)
  } else if (seconds < 3600) {
    const minutes = beautifyNumber(Math.floor(seconds / 60))
    const remainingSeconds = beautifyNumber(seconds % 60)
    return `${minutes}:${remainingSeconds}.`
  } else {
    const hours = beautifyNumber(Math.floor(seconds / 3600))
    const remainingMinutes = beautifyNumber(Math.floor((seconds % 3600) / 60))
    const remainingSeconds = beautifyNumber(seconds % 60)

    return `${hours}:${remainingMinutes}:${remainingSeconds}`
  }
}

export const messages: PopupMessages = {
  errorMessage: "Something went wrong. Try refreshing the page.",
  noMutedSegmentsMessage: "Didn't detect any muted segments in this VOD.",
  nearestSegmentMessage: `Muted segment at ${formatCurrentTime(21197.118775)}`,
  passedAllSegmentsMessage: "No muted segments remaining in this VOD.",
  loadingMessage: "Loading muted segment data...",
}

export default () => {
  const [fact, setFact] = useState("Click the button to fetch a fact!")
  const [loading, setLoading] = useState(false)
  const [manualSkip, setManualSkip] = useState(false)
  const [mutedSegments, setMutedSegments] = useState([])
  const [nearestSegment, setNearestSegment] = useState({})

  const ToggleSwitchWithLabel = (props: SwitchProps) => {
    return (
      <div className={clsx("flex items-center justify-between")}>
        <div className="mr-4 mb-2">
          <label className={clsx("text-lg text-white dark:text-gray-400")}>
            {props.switchTitle}
          </label>
          <p className={clsx("text-gray-500", "text-left")}>
            {props.switchDescription}
          </p>
        </div>
        <input
          type="checkbox"
          checked={manualSkip}
          onChange={() => setManualSkip(!manualSkip)}
          className={clsx(
            "relative",
            "shrink-0",
            "rounded-md",
            "w-4",
            "h-5",
            "p-3",
            "bg-gray-600",
            "border-gray-400",
            "text-blue-950",
          )}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-4 shadow-sm bg-black bg-opacity-100 w-96">
      <h1>VODSkipper</h1>
      <div className="border border-solid border-gray-700"></div>
      <div>
        <ToggleSwitchWithLabel
          switchTitle={"Prompt Me Before Skipping"}
          switchDescription={
            "Check to be prompted before skipping a muted section."
          }
          manualSkip={manualSkip}
          setManualSkip={setManualSkip}
        />
      </div>

      <div className="border border-solid border-gray-700"></div>

      <div
        hidden={false}
        className="text-center justify-center text-lg text-white mb-10"
      >
        {messages.passedAllSegmentsMessage}
      </div>
    </div>
  )
}
