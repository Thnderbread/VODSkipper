import { FetchResolutions, type MutedSegmentResponse } from "../types"
import { cacheSegments, checkCache } from "./utils/cacheHandler"

const BASE_URL = import.meta.env.PROD
  ? "https://api-vodskipper.koyeb.app/vods/muted/"
  : "http://localhost:3100/vods/muted/"

/**
 * Given a vodID, attempt to retrieve the VOD's muted segments data.
 * Checks the extension cache before hitting the api.
 * @param {string} vodID String of the vod's id.
 * @returns {MutedSegmentResponse} An object containing a boolean indicating
 * success of the operation, and a ```MutedVodSegment[]``` if the operation
 * succeeded. If it did not, ```data``` will be undefined.
 * @example
 * const { success, data } = fetchVodData(vodID)
 * if (!success) {
 *  // handle failure
 * } else {
 * // for (const segment of data) {
 * ...
 * }
 *
 */
export async function fetchVodData(
  vodID: string,
): Promise<MutedSegmentResponse> {
  const requestTimeoutDelay = 5000
  const endpoint = BASE_URL + vodID
  const controller = new AbortController()

  const cachedResponse = await checkCache(vodID)
  if (cachedResponse?.metadata.error === "") {
    // If a response was cached, and there was no issue w/ request,
    // go ahead and pass it to content script.
    return { success: true, data: cachedResponse.segments }
  }

  const requestTimeout = setTimeout(() => {
    console.log("Request too long, aborting")
    controller.abort()
  }, requestTimeoutDelay)
  try {
    const response = await fetch(endpoint, { signal: controller.signal })
    const metadata = {
      error: "",
      numSegments: 0,
    }
    /**
     * 404 responses mean there's no segments for the given vod.
     * These can be cached as empty arrays to avoid hitting the
     * server.
     */
    if (response.ok) {
      clearTimeout(requestTimeout)
      const data = await response.json()

      metadata.numSegments = data.segments.length
      await cacheSegments({ [vodID]: { metadata, segments: data.segments } })

      return { success: true, data: data.segments }
    } else if (response.status === 404) {
      clearTimeout(requestTimeout)
      await cacheSegments({ [vodID]: { metadata, segments: [] } })
      return { success: true, data: [] }
    } else {
      metadata.error = FetchResolutions.INTERNAL_SERVER_ERROR
      await cacheSegments({ [vodID]: { metadata, segments: [] } })
      return { success: false }
    }
  } catch (error: unknown) {
    // used as the default case
    let errorState = FetchResolutions.UNEXPECTED_ERROR

    if (controller.signal.aborted) {
      errorState = FetchResolutions.TIMEOUT_ERROR
    } else if (error instanceof TypeError) {
      errorState = FetchResolutions.TYPE_ERROR
    }

    const metadata = {
      error: errorState,
      numSegments: 0,
    }
    await cacheSegments({ [vodID]: { metadata, segments: [] } })
    return { success: false }
  }
}
