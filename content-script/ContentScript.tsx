/* eslint-disable @typescript-eslint/restrict-template-expressions */
import type React from "react"
import reducer from "./reducer"
import browser from "webextension-polyfill"
import DEFAULTSEGMENT from "../common/DefaultSegment"
import { useState, useEffect, useReducer, useRef } from "react"
import {
  type State,
  type GetDataResponse,
  DecisionCodes,
  ResponseCallback,
  StatusMessage,
} from "../types"
import {
  isValidVod,
  createListener,
  shouldCreateListener,
  findNearestMutedSegment,
} from "./utils/utils"

const initialState: State = {
  error: "",
  mutedSegments: [],
  nearestSegment: DEFAULTSEGMENT,
}

const ContentScript: React.FC = () => {
  const [loaded, setLoaded] = useState(false)
  const [state, dispatch] = useReducer(reducer, initialState)
  const listener = useRef<NodeJS.Timeout | undefined>(undefined)

  const vodUrl = document.location.href
  const vodID = isValidVod(vodUrl)

  if (!vodID) {
    dispatch({
      type: "SET_ERROR",
      payload: "No vod detected. VODSkipper not running.",
    })
    return null
  }
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

  const setupVideoListeners = (): void => {
    video.addEventListener("playing", playingHandler)
    video.addEventListener("seeked", seekedHandler)
    video.addEventListener("pause", pauseHandler)
  }

  const tearDownVideoListeners = (): void => {
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
        dispatch({ type: "SET_ERROR", payload: error })
        setLoaded(true)
        return
      } else if (data.length === 0) {
        // Returning if there's no data since
        // initial reducer state has dummy data
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
      tearDownVideoListeners()
    }
  }, [])

  // finished loading useEffect
  useEffect(() => {
    const { nearestSegment, mutedSegments } = state
    // TODO: Revisit this. Will the listener not be set up in cases where all muted segments have been passed?
    // if (
    //   shouldCreateListener({ nearestSegment, mutedSegments }) !==
    //   DecisionCodes.Create
    // ) {
    //   return
    // }
    /**
     * The only way this listener is not set up
     * is if the extension is disabled - In which case
     * This is not hit anyway.
     */
    if (loaded) {
      const statusMessageListener = (
        msg: StatusMessage,
        sender: browser.Runtime.MessageSender,
        response: ResponseCallback,
      ): void => {
        // ! Remove this (comments) - unless re-adding attempts mechanism
        // Not checking for attempts because
        // it should be 0 by this point
        if (state.error) {
          response({ error: state.error })
          return
        } else {
          response({ segmentLength: state.mutedSegments.length })
          return
        }
      }

      if (
        shouldCreateListener({ nearestSegment, mutedSegments }) ===
        DecisionCodes.Create
      ) {
        setupVideoListeners()
      }
      browser.runtime.onMessage.addListener(statusMessageListener)

      return () => {
        browser.runtime.onMessage.removeListener(statusMessageListener)
      }
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

  return null
}

export default ContentScript
