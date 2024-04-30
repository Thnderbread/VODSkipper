import type React from "react"
import reducer from "./reducer"
import browser from "webextension-polyfill"
import DEFAULTSEGMENT from "../common/DefaultSegment"
import { useState, useEffect, useReducer, useRef } from "react"
import {
  type State,
  DecisionCodes,
  type StatusMessage,
  type GetDataResponse,
  type ResponseCallback,
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

  const vodID = isValidVod(document.location.href)
  const video = document.querySelector("video")

  if (vodID === false || video === null) {
    dispatch({ type: "SET_ERROR", payload: "No vod detected." })
    return null
  }

  const seekedHandler = (): void => {
    clearTimeout(listener.current)
    const nearest = findNearestMutedSegment(
      video.currentTime,
      state.mutedSegments,
    )
    dispatch({ type: "SET_NEAREST", payload: nearest })
  }

  const playingHandler = (): void => {
    const { nearestSegment } = state
    if (shouldCreateListener({ nearestSegment }) === DecisionCodes.Create) {
      listener.current = createListener(
        nearestSegment.startingOffset,
        nearestSegment.endingOffset,
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
        await browser.runtime.sendMessage({ action: "getData", vodID })
      if (error !== null) {
        console.error(`Couldn't do stuff (content script): ${error}`)
        dispatch({ type: "SET_ERROR", payload: error })
      } else if (data.length > 0) {
        console.log(`Found ${data.length} muted segments for vod ${vodID}.`)
        dispatch({ type: "SET_MUTED_SEGMENTS", payload: data })
      }
      /**
       * Allow the initial
       * reducer state with dummy data
       * to be used
       */
      setLoaded(true)
    })()

    return () => {
      tearDownVideoListeners()
    }
  }, [])

  // finished loading useEffect
  useEffect(() => {
    const { mutedSegments } = state
    if (loaded) {
      /**
       * Setting up this listener here so
       * that it's only reading freshly
       * processed data
       */
      const statusMessageListener = (
        msg: StatusMessage,
        sender: browser.Runtime.MessageSender,
        response: ResponseCallback,
      ): void => {
        if (state.error !== "") {
          response({ error: state.error })
        } else {
          response({ segmentLength: state.mutedSegments.length })
        }
      }
      /**
       * If this vod has no muted segments, then no listeners
       * should be created. Otherwise, there could potentially be a
       * case where the page loads past all segments, but
       * the user seeks to segments earlier in the vod.
       * Checking for "=== create" might not create listeners in
       * this case.
       */
      if (
        shouldCreateListener({ mutedSegments }) !==
        DecisionCodes.NoMutedSegments
      ) {
        setupVideoListeners()
      }
      browser.runtime.onMessage.addListener(statusMessageListener)

      return () => {
        browser.runtime.onMessage.removeListener(statusMessageListener)
      }
    }
  }, [loaded])

  /**
   * Re-establish the playing handler when
   * A new nearest segment is set by the seek handler
   */
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
