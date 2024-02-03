import type { ApiResponse, MutedSegmentResponse } from "../types"

// ! use environment variable
const BASE_URL = "http://localhost:8000/vodData/"

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
      return [new Error("Server request timed out."), undefined]
    } else if ((error as Error).name === "TypeError") {
      return [new Error("Couldn't contact server."), undefined]
    }
    console.error(`Uncaught error: ${error}`)
  }
  return [new Error("Unexpected error occurred."), undefined]
}
