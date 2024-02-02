import DEFAULTSEGMENT from "../../common/DefaultSegment"
import type {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  SegmentInfo,
  MutedVodSegment,
  ShouldMakeListenerResponse,
} from "../../types"

/**
 * Looks for the muted segment closest to
 * the video's current time.
 *ks
 * @param {HTMLVideoElement} video
 * @param {MutedVodSegment[]} mutedSegments Array containing all the muted segments for a vod.
 * @returns {MutedVodSegment | DefaultVodSegment} Either an actual vod segment or a default segment.
 */
export const findNearestMutedSegment = (
  video: HTMLVideoElement,
  mutedSegments: MutedVodSegment[],
): MutedVodSegment => {
  return (
    mutedSegments.find(segment => {
      // Before or at / in the segment
      if (video.currentTime <= segment.startingOffset) {
        return segment
        // past the start of segment
      } else if (video.currentTime > segment.startingOffset) {
        // inside the segment
        if (video.currentTime < segment.endingOffset) {
          return segment
        }
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
 * @param {number} endingOffset The target time offset when an action (e.g. ```performSkip```) should occur.
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
 * @param {number} startingOffset The point at which perform skip will trigger. Purely for logging.
 * @param {number} endingOffset The point to where the video should skip.
 */
export function performSkip(
  video: HTMLVideoElement,
  startingOffset: number,
  endingOffset: number,
): void {
  console.log(`Skipping from: ${startingOffset} to ${endingOffset}`)
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
    performSkip(video, startingOffset, endingOffset)
  }, int)
  return listener
}

/**
 * Checks if nearest is default and if there are muted segments, returns if either is true
 * Creates a new listener
 *  - Doesn't overwrite a listener if one is set already
 * Skips if inside the muted segment
 * sets the nearest muted segment (should be done on handle seek)
 */
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
}): ShouldMakeListenerResponse {
  if (Object.entries(segmentInfo).length === 0) {
    return 1
  }
  for (const [k, v] of Object.entries(segmentInfo)) {
    if (k === "mutedSegments" && Array.isArray(v)) {
      if (v.length === 0) {
        return 2
      }
    } else if (k === "nearestSegment") {
      if (Object.hasOwnProperty.call(v, "default")) {
        return 3
      }
    }
  }
  return 0
}

/**
 * Makes sure the page is currently on a valid playing vod.
 * @param {vodUrl} vodUrl The url of the current page.
 * @returns {string | undefined} The vod id from the page if valid. Undefined if not.
 */
export function isValidVod(vodUrl: string): string | undefined {
  const validVodRegex = /https:\/\/www.twitch.tv\/videos\/\d{8,}/g
  if (vodUrl.match(validVodRegex)) {
    return vodUrl.split("/")[4]
  }
}
