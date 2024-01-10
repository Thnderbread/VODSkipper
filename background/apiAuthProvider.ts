import {
  type VodSegment,
  type ApiResponse,
  type MutedVodSegment,
  type MutedSegmentResponse,
} from "../types"

/**
 * Formats the muted segment data retrieved from
 * Twitch. Adds an endingOffset property.
 *
 * @param {VodSegment[]} mutedSegments The muted segments array
 * received from Twitch.
 * @returns {MutedVodSegment[]} Array containing the formatted
 * segments.
 */
export function formatMutedSegmentsData(
  mutedSegments: VodSegment[],
): MutedVodSegment[] {
  // eslint-disable-next-line @typescript-eslint/require-array-sort-compare
  return mutedSegments
    .map(segment => {
      const formattedSegment: MutedVodSegment = {
        duration: segment.duration,
        startingOffset: segment.offset,
        endingOffset: segment.offset + segment.duration,
        readableOffset: "the real time is now type shit",
      }
      return formattedSegment
    })
    .sort()
}

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
    const response = await fetch(`http://localhost:8000/vodData/${vodID}`, {
      signal: controller.signal,
    })
    if (!response.ok) {
      console.error(`Code: ${response.status} | Text: ${response.statusText}`)
      return [new Error("Something went wrong."), undefined]
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
