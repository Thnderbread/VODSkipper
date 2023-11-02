import clsx from "clsx"
import React, { useState } from "react"
import browser from "webextension-polyfill"

export interface SwitchProps {
  switchTitle: string
  switchDescription: string
}

export interface PopupMessages {
  errorMessage: string
  loadingMessage: string
  nearestSegmentMessage?: string
  noMutedSegmentsMessage: string
  passedAllSegmentsMessage: string
}

export default () => {
  const [fact, setFact] = useState("Click the button to fetch a fact!")
  const [loading, setLoading] = useState(false)
  const [manualSkip, setManualSkip] = useState(false)
  const [mutedSegments, setMutedSegments] = useState([])
  const [nearestSegment, setNearestSegment] = useState({})

  const messages: PopupMessages = {
    errorMessage: "Something went wrong. Try refreshing the page.",
    noMutedSegmentsMessage: "Didn't detect any muted segments in this VOD.",
    nearestSegmentMessage: `Muted segment at ${formatCurrentTime(
      21197.118775,
    )}`,
    passedAllSegmentsMessage: "No muted segments remaining in this VOD.",
    loadingMessage: "Loading muted segment data...",
  }

  function formatCurrentTime(seconds: number) {
    if (isNaN(seconds)) {
      return ""
    }

    function beautifyNumber(time: number) {
      return time > 10
        ? Math.floor(time).toString()
        : Math.floor(time).toString().padStart(2, "0")
    }

    const currTime = Number(beautifyNumber(seconds))

    if (currTime < 60) {
      return currTime.toString()
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
    <div className="flex flex-col gap-4 p-4 shadow-sm bg-black bg-opacity-100 p-4 w-96">
      <h1>VODSkipper</h1>
      <div className="border border-solid border-gray-700"></div>
      <div>
        <ToggleSwitchWithLabel
          switchTitle={"Prompt Me Before Skipping"}
          switchDescription={
            "Check to be prompted before skipping a muted section."
          }
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
