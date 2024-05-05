import type React from "react"
import browser from "webextension-polyfill"
import { useEffect, useRef, useState } from "react"
import {
  DecisionCodes,
  type GetDataResponse,
  type MutedVodSegment,
} from "../types"
import {
  createListener,
  shouldCreateListener,
  findNearestMutedSegment,
} from "./utils/utils"

const ContentScript: React.FC = () => {
  const listener = useRef<NodeJS.Timeout | undefined>(undefined)
  const [mutedSegments, setMutedSegments] = useState<MutedVodSegment[]>([])

  const video = document.querySelector("video")

  // Runs on url changes to account for Twitch's SPA behavior
  useEffect(() => {
    async function fetchDataAndSetSegments(): Promise<void> {
      const { data }: GetDataResponse = await browser.runtime.sendMessage({
        action: "getData",
        vodUrl: document.location.href,
      })
      if (data !== undefined && data?.length > 0) {
        console.log(`Found ${data.length} muted segments this vod.`)
        setMutedSegments(data)
      }
    }
    void fetchDataAndSetSegments()
  }, [document.location.href])

  // Set up listeners once muted segments are set
  useEffect(() => {
    if (video === null) return

    const playingHandler = (): void => {
      clearTimeout(listener.current)
      const nearest = findNearestMutedSegment(video.currentTime, mutedSegments)

      if (
        shouldCreateListener({ nearestSegment: nearest }) ===
        DecisionCodes.Create
      ) {
        listener.current = createListener(
          nearest.startingOffset,
          nearest.endingOffset,
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
      video.addEventListener("pause", pauseHandler)
    }

    const tearDownVideoListeners = (): void => {
      video.removeEventListener("playing", playingHandler)
      video.removeEventListener("pause", pauseHandler)

      clearTimeout(listener.current)
      listener.current = undefined
    }

    setupVideoListeners()

    return () => {
      tearDownVideoListeners()
    }
  }, [mutedSegments])

  return null
}

export default ContentScript
