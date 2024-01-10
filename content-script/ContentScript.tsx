/* eslint-disable @typescript-eslint/restrict-template-expressions */
import type React from "react"
import reducer from "./reducer"
import browser from "webextension-polyfill"
import DEFAULTSEGMENT from "../common/DefaultSegment"
import { useState, useEffect, useReducer, useRef } from "react"
import { type State, type GetDataResponse, DecisionCodes } from "../types"
import {
  createListener,
  shouldCreateListener,
  findNearestMutedSegment,
} from "../functions"

const initialState: State = {
  error: "",
  enabled: true,
  mutedSegments: [],
  nearestSegment: DEFAULTSEGMENT,
}

const ContentScript: React.FC = () => {
  const [loaded, setLoaded] = useState(false)
  const [state, dispatch] = useReducer(reducer, initialState)
  const listener = useRef<NodeJS.Timeout | undefined>(undefined)

  const vodID = document.location.pathname.split("/")[2]
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const video = document.querySelector("video")!

  const seekedHandler = (): void => {
    if (state.mutedSegments.length > 0) {
      clearTimeout(listener.current)
      const nearest = findNearestMutedSegment(video, state.mutedSegments)
      dispatch({ type: "SET_NEAREST", payload: nearest })
    }
  }

  const playingHandler = (): void => {
    const { nearestSegment, mutedSegments } = state
    if (
      shouldCreateListener({ nearestSegment, mutedSegments }) ===
      DecisionCodes.Create
    ) {
      listener.current = createListener(
        state.nearestSegment.startingOffset,
        state.nearestSegment.endingOffset,
        video,
      )
    }
  }

  const pauseHandler = (): void => {
    clearTimeout(listener.current)
    listener.current = undefined
  }

  const setupListeners = (): void => {
    video.addEventListener("playing", playingHandler)
    video.addEventListener("seeked", seekedHandler)
    video.addEventListener("pause", pauseHandler)
  }

  const tearDownListeners = (): void => {
    video.removeEventListener("playing", playingHandler)
    video.removeEventListener("seeked", seekedHandler)
    video.removeEventListener("pause", pauseHandler)

    clearTimeout(listener.current)
    listener.current = undefined
  }

  // On mount useEffect
  useEffect(() => {
    void (async () => {
      const { data, error }: GetDataResponse =
        await browser.runtime.sendMessage({
          action: "getData",
          vodID,
        })
      if (error !== null) {
        dispatch({ type: "SET_ERROR", payload: error.message })
        setLoaded(true)
      } else if (data.length === 0) {
        // Returning if there's no data
        // since initial reducer state has dummy data
        setLoaded(true)
      } else {
        console.log(`Found ${data.length} muted segments for vod ${vodID}.`)
        dispatch({ type: "SET_MUTED_SEGMENTS", payload: data })
        dispatch({
          type: "SET_NEAREST",
          payload: findNearestMutedSegment(video, data),
        })
        setLoaded(true)
      }
    })()

    return () => {
      tearDownListeners()
    }
  }, [])

  // finished loading useEffect
  useEffect(() => {
    const { nearestSegment, mutedSegments } = state
    if (state.error !== "") {
      return
    } else if (
      shouldCreateListener({ nearestSegment, mutedSegments }) !==
      DecisionCodes.Create
    ) {
      return
    }
    if (loaded && state.enabled) {
      console.log(`Loaded vod data from bg script.`)
      setupListeners()
    }
  }, [loaded])

  // Re-establish the playing handler when
  // A new nearest segment is set
  useEffect(() => {
    const { nearestSegment } = state
    if (shouldCreateListener({ nearestSegment }) !== DecisionCodes.Create) {
      return
    }
    video.addEventListener("playing", playingHandler)

    return () => {
      video.removeEventListener("playing", playingHandler)
    }
  }, [state.nearestSegment])

  useEffect(() => {
    tearDownListeners()
    if (state.enabled) {
      setupListeners()
    }
  }, [state.enabled])

  return null
}

export default ContentScript
