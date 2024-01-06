// ! Remove this
import DEFAULTSEGMENT from "./common/DefaultSegment"
import formatCurrentTime from "./background/utils/formatTime"
import type { MutedVodSegment, ShouldMakeListenerResponse } from "./types"

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
  // ! Remove this
  // console.log(
  //   `Looking for nearest muted segment in muted segments!: ${mutedSegments}`,
  // )
  // Removed the cutoff check - if by some chance a user is
  // at a point where a segment ends in < 3 seconds and DEFAULTSEGMENT is returned, this will present an issue for any subsequent muted segment - the seek will not occur and the next nearest segment will not be set.

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
  // ! Remove this
  // console.log("Trying to find the interval...")
  // console.log(
  //   `Nearest segment time: ${startingOffset} | Ending offset: ${endingOffset}`,
  // )
  const DEFAULTINTERVAL = 1000
  const difference = endingOffset - startingOffset

  // TODO: Round up to make sure interval is always at or after the start of a segment
  // return difference > 0 ? difference * 1000 + 200 : DEFAULTINTERVAL
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
  startingOffset: number,
  endingOffset: number,
): void {
  // ! Remove this
  console.log(`Skipping from: ${startingOffset} to ${endingOffset}`)
  video.currentTime = endingOffset
  console.log("performSkip execution finished!")
}

// enum CreateListenerCodes {
//   VideoBeyondNearest = 0,
//   VideoBehindNearest = 1,
//   CreatedListener = 2,
// }

// type CreateListenerResponse = [CreateListenerCodes, NodeJS.Timeout]

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
  // ! Remove this
  console.log("Creating a new listener")
  const int = calculateInterval(video.currentTime, startingOffset)
  // ! Remove this
  console.log(
    `The created interval: ${int} Will trigger skip in: ${formatCurrentTime(
      int / 1000,
    )} The skip will trigger at ${formatCurrentTime(
      int / 1000 + video.currentTime,
    )} And The nearest starting offset is ${formatCurrentTime(
      startingOffset,
    )} And nearest ending is: ${formatCurrentTime(
      endingOffset,
    )}. Current video time is ${formatCurrentTime(video.currentTime)}`,
  )
  const listener = setTimeout(() => {
    performSkip(video, startingOffset, endingOffset)
    // TODO: Need a clearTimeout here?
  }, int)
  console.log("createListener execution finished!")
  return listener
}

/**
 * Checks if nearest is default and if there are muted segs, returns if either is true
 * Creates a new listener
 *  - Doesn't overwrite a listener if one is set already
 * Skips if inside the muted segment
 * sets the nearest muted segment (should be done on handle seek)
 */
/**
 * Determines whether or not a listener should be created.
 *
 * @param {MutedVodSegment} nearestSegment The current closest muted segment.
 * @param {MutedVodSegment[]} mutedSegments An array containing all muted segments for a vod.
 * @returns {number} 0 If the listener should be created. 1 if there are no muted segments, and 2
 * if the nearest segment is a default segment.
 */
export function shouldCreateListener(
  nearestSegment: MutedVodSegment,
  mutedSegments: MutedVodSegment[],
): ShouldMakeListenerResponse {
  if (mutedSegments.length === 0) {
    return 1
  } else if (Object.prototype.hasOwnProperty.call(nearestSegment, "default")) {
    return 2
  }
  return 0
}
