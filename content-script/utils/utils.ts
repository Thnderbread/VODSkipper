import DEFAULTSEGMENT from "../../common/DefaultSegment"
import type {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  SegmentInfo,
  MutedVodSegment,
  DecisionCodes,
} from "../../types"

/**
 * Looks for the muted segment closest to
 * the video's current time.
 *
 * @param {number} currentTime The current time of the video.
 * @param {MutedVodSegment[]} mutedSegments Array containing all the muted segments for a vod.
 * @returns {MutedVodSegment | DefaultVodSegment} Either an actual vod segment or a default segment.
 */
export const findNearestMutedSegment = (
  currentTime: number,
  mutedSegments: MutedVodSegment[],
): MutedVodSegment => {
  return (
    mutedSegments.find(segment => {
      if (currentTime <= segment.startingOffset) {
        return segment
      } else if (
        currentTime > segment.startingOffset &&
        currentTime < segment.endingOffset
      ) {
        return segment
      }
      return undefined
    }) ?? DEFAULTSEGMENT
  )
}

/**
 * Calculates the interval between the ```startingOffset```
 * and the ```endingOffset``` to determine
 * when to trigger the ```performSkip``` function.
 * 
 * @param {number} startingOffset The initial time offset (e.g. ```video.currentTime```).
 * @param {number} endingOffset The target time offset when an action (i.e. ```performSkip```) should occur.
 * @returns {number} The calculated interval in milliseconds, rounded up to
the nearest whole number. Will return a default interval of 1000 ms if the result is 0 or less.
 */
export function calculateInterval(
  startingOffset: number,
  endingOffset: number,
): number {
  const DEFAULTINTERVAL = 1000
  const difference = endingOffset - startingOffset

  return difference > 0 ? Math.ceil(difference * 1000) : DEFAULTINTERVAL
}

/**
 * Skips the video ahead to the ending offset.
 *
 * @param {HTMLVideoElement} video The video element to perform the skip on.
 * @param {number} endingOffset The point to where the video should skip.
 */
export function performSkip(
  video: HTMLVideoElement,
  endingOffset: number,
): void {
  video.currentTime = endingOffset
}

/**
 * Creates a new listener for skipping.
 *
 * @param {number} startingOffset Starting offset of the nearest muted segment - used to calculate the interval.
 * @param {number} endingOffset The ending offset of the nearest muted segment - used to perform the skip.
 * @param {HTMLVideoElement} video
 *
 * @returns {NodeJS.Timeout} The created listener.
 */
export function createListener(
  startingOffset: number,
  endingOffset: number,
  video: HTMLVideoElement,
): NodeJS.Timeout {
  const int = calculateInterval(video.currentTime, startingOffset)
  const listener = setTimeout(() => {
    performSkip(video, endingOffset)
  }, int)
  return listener
}

/**
 * Determines whether or not a listener should be created.
 * @param {SegmentInfo} segmentInfo Object containing info about the video's segments.
 * @param {MutedVodSegment} [segmentInfo.nearestSegment] nearestSegment The current closest muted segment.
 * @param {MutedVodSegment[]} [segmentInfo.mutedSegments] mutedSegments An array containing all muted segments for a vod.
 * @returns {number} 0 If the listener should be created. 1 if there are no muted segments, and 2
 * if the nearest segment is a default segment.
 */
export function shouldCreateListener(segmentInfo: {
  nearestSegment?: MutedVodSegment
  mutedSegments?: MutedVodSegment[]
}): DecisionCodes {
  if (Object.entries(segmentInfo).length === 0) {
    throw new Error("No data given.")
  }
  for (const [k, v] of Object.entries(segmentInfo)) {
    if (k === "mutedSegments" && Array.isArray(v)) {
      if (v.length === 0) {
        return 1
      }
    } else if (k === "nearestSegment") {
      if (Object.hasOwn(v, "default")) {
        return 2
      }
    }
  }
  return 0
}

/**
 * Makes sure the page is currently on a valid playing vod.
 * @param {vodUrl} vodUrl The url of the current page.
 * @returns {string | false} The vod id from the page if valid. False if not.
 */
export function isValidVod(vodUrl: string): string | false {
  // covers urls like: https://www.twitch.tv/videos/2111779905?filter=highlights&sort=time
  const validVodRegex = /https:\/\/www.twitch.tv\/videos\/\d{8,}/
  // extract the vod id
  const vodIdRegex = /\d{8,}/
  const matchResult = vodUrl.match(vodIdRegex)
  return typeof vodUrl === "string" &&
    validVodRegex.test(vodUrl) &&
    matchResult !== null
    ? matchResult[0]
    : false
}
