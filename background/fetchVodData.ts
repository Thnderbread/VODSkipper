import type { ApiResponse, MutedSegmentResponse } from "../types"

const BASE_URL = "http://localhost:8000/vodData/"

// TODO: Fix tests: optimal response, bad response, no response
// TODO: Fix popup - what is shown when no server response, no vod data for vod, etc?
// TODO:  - Cases: Vod data found, no vod data found, no server response, server error
// TODO:    - Solutions: Idk just ask content script for stuff on load. Add clear buttons for errors?
// TODO: Get CA cert for server
// TODO: Set up cd for this shit
// TODO: Double check for any boilerplate / stock shit
// TODO: Review firefox version - logo isn't right and extension might not be working
/**
 * Given a vodID, attempt to retrieve the VOD's muted segments data.
 *
 * @param {string} vodID String of the vod's id.
 * @returns {MutedSegmentResponse} A two-element tuple. The first element is an error or null,
 * the second element is the formatted vod segment or undefined.
 */
export async function fetchVodData(
  vodID: string,
): Promise<MutedSegmentResponse> {
  console.debug(`Fetching muted segments for ${vodID}`)
  const controller = new AbortController()
  const requestTimeout = setTimeout(() => {
    controller.abort()
  }, 5000)
  try {
    const endpoint = BASE_URL + vodID
    const response = await fetch(endpoint, { signal: controller.signal })
    if (!response.ok) {
      console.error(`Code: ${response.status} | Text: ${response.statusText}`)
      return [new Error("Something went wrong with the server."), undefined]
    }
    const data: ApiResponse = await response.json()
    clearTimeout(requestTimeout)

    return [null, data.segments]
  } catch (error: unknown) {
    if ((error as Error).name === "AbortError") {
      console.error("Request ran too long, aborting.")
      return [new Error("Request Timed out."), undefined]
    }
  }
  return [null, undefined]
}
