import { type MutedSegmentResponse } from "../types"
import { cacheSegments, checkCache } from "./utils/cacheHandler"

// ! use environment variable
const BASE_URL = "http://localhost:8000/vods/muted/"

/**
 * Given a vodID, attempt to retrieve the VOD's muted segments data.
 * Checks the service worker cache before hitting the api.
 * @param {string} vodID String of the vod's id.
 * @returns {MutedSegmentResponse} A two-element tuple. The first element is an error or null,
 * the second element is the formatted vod segment or undefined.
 */
export async function fetchVodData(
  vodID: string,
): Promise<MutedSegmentResponse> {
  const requestTimeoutDelay = 5000
  const endpoint = BASE_URL + vodID
  const controller = new AbortController()

  const cachedResponse = await checkCache(vodID)

  if (cachedResponse) {
    return [null, cachedResponse]
  }

  const requestTimeout = setTimeout(() => {
    controller.abort()
  }, requestTimeoutDelay)
  try {
    const response = await fetch(endpoint, { signal: controller.signal })

    // 404 responses mean there's no segments for the given vod.
    // These can be cached to avoid hitting the server.
    if (response.ok || response.status === 404) {
      const data = await response.json()
      cacheSegments({ [vodID]: data.segments ?? [] })
      clearTimeout(requestTimeout)
      return [null, data.segments]
    } else {
      return [new Error("Something went wrong with the server."), undefined]
    }
  } catch (error: unknown) {
    // idk switch just looked more legible here
    switch ((error as Error).name) {
      case "AbortError":
        console.error(`Abortion: ${error}`)
        return [new Error("Server request timed out."), undefined]
      case "TypeError":
        console.error(`Type error: ${error}`)
        return [new Error("Couldn't contact server."), undefined]
      default:
        return [new Error("Unexpected error occurred."), undefined]
    }
  }
}
