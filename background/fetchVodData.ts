import { type MutedSegmentResponse } from "../types"
import { cacheSegments, checkCache } from "./utils/cacheHandler"

const BASE_URL = import.meta.env.PROD
  ? "https://api-vodskipper.koyeb.app/vods/muted/"
  : "http://localhost:3100/vods/muted/"

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
  if (cachedResponse !== undefined) {
    return { success: true, data: cachedResponse }
  }

  const requestTimeout = setTimeout(() => {
    console.log("Request too long, aborting")
    controller.abort()
  }, requestTimeoutDelay)
  try {
    const response = await fetch(endpoint, { signal: controller.signal })
    /**
     * 404 responses mean there's no segments for the given vod.
     * These can be cached as empty arrays to avoid hitting the
     * server.
     */
    if (response.ok) {
      clearTimeout(requestTimeout)
      const data = await response.json()
      await cacheSegments({ [vodID]: data.segments })
      return {
        success: true,
        data: data.segments,
      }
    } else if (response.status === 404) {
      clearTimeout(requestTimeout)
      await cacheSegments({ [vodID]: [] })
      return {
        success: true,
        data: [],
      }
    } else {
      /**
       * Bad server response
       */
      return {
        success: false,
        error: new Error("Something went wrong with the server."),
      }
    }
  } catch (error: unknown) {
    // used as the default case
    let errorState = new Error("Unexpected error occurred.")
    /**
     * Client side error with the fetch operation
     * Also, switch looked easier to read than if-else
     */
    switch ((error as Error).name) {
      case "AbortError":
        errorState = new Error("Server request timed out.")
        break
      case "TypeError":
        errorState = new Error("Couldn't contact server.")
        break
      default:
        break
    }
    return {
      success: false,
      error: errorState,
    }
  }
}
