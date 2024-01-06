// eslint-disable-next-line @typescript-eslint/no-unused-vars
import axios from "./utils/axios"
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { isAxiosError, type AxiosResponse } from "axios"
import {
  type VodSegment,
  type MutedVodSegment,
  type MutedSegmentResponse,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  type ApiResponse,
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
  console.log("INSIDE THE FORMATTING FUNCTION")
  // eslint-disable-next-line @typescript-eslint/require-array-sort-compare
  const sortedSegments = mutedSegments
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
  for (const segment of sortedSegments) {
    console.log(
      `Segment stuff:\nDuration: ${segment.duration}
      \nEnding offset: ${segment.endingOffset}
      \nStarting offset: ${segment.startingOffset}
      \nReadable: ${segment.readableOffset}`,
    )
  }
  return sortedSegments
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
  try {
    const controller = new AbortController()
    const response = await fetch(`http://localhost:8000/vodData/${vodID}`, {
      signal: controller.signal,
      headers: {
        "X-ServiceWorker-Origin": "VODSkipperSW",
      },
    })
    const data: ApiResponse = await response.json()
    console.log(`Response: ${JSON.stringify(data)}`)

    return [null, data.segments]
  } catch (error) {
    // TODO: change from axios architecture
    if (isAxiosError(error)) {
      // ? Failure cases return only codes. Could checking
      // ? for undefined here cause confusion / issues?
      if (error?.response === undefined) {
        console.error(
          `No error or sumn, couldn't fetch stuff: ${JSON.stringify(error)}`,
        )
        return [error]
      } else if (error.response.status === 401) {
        console.error(
          `Failed the shit cuz of some shit: ${JSON.stringify(error)}`,
        )
        return [error]
      } else if (error.response.status === 404) {
        console.error(
          `No muted segments found for this vod. ${JSON.stringify(error)}`,
        )
        return [new Error("No muted segments found for this vod.")]
      } else if (error.response.status === 405) {
        console.error("Invalid HTTP method.")
        return [error]
      }
      console.error(
        `Failed to fetch vod data (not an axios error): ${JSON.stringify(
          error,
        )}`,
      )
      return [error]
    }
  }
  /**
   * Returning this to avoid [Symbol.iterator]() error
   * That occurs when return type is <MutedSegmentResponse | undefined>.
   */
  return [null, undefined]
}
