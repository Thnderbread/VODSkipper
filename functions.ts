import { Browser } from "webextension-polyfill"
import { DEFAULTSEGMENT } from "./content-script/component"
import {
  FindNearestMutedSegmentFunction,
  ListenForMutedSegmentsFunction,
  FetchMutedSegmentsFunction,
  HandleSeekFunction,
  State,
  Action,
} from "./types"

/**
 * Looks for the muted segment closest to
 * the video's current time. If no segment
 * is found, the user has most likely passed all of them.
 * @returns The segment or undefined.
 */
export const findNearestMutedSegment: FindNearestMutedSegmentFunction = (
  video,
  mutedSegments,
  DEFAULTSEGMENT,
) => {
  // don't bother skipping if a muted
  // segment will end in 3 seconds.
  const cutoffPoint = 3

  return (
    mutedSegments.find(segment => {
      if (video?.currentTime <= segment.startingOffset) {
        return segment
      } else if (video?.currentTime > segment.startingOffset) {
        if (video?.currentTime < segment.endingOffset - cutoffPoint) {
          return segment
        }
      }
    }) || DEFAULTSEGMENT
  )
}

/**
 * Full function w/ undo functionality.
 * This shit do not work lmao. Plenty of conflicts with
 * the skipping, and how undo listens are initiated.
 * The initial idea was that listening should start
 * for an undo request after every skip event, and to
 * make sure to stop listening after a manual seek. Tried
 * using the video.onseeked event to stop listening after a
 * manual seek, but initiating a skip counts as a seek event.
 * This would mean that after every skip, the undo listener is
 * cleared.
 * ---
 * A possible solution might be to define custom events -
 * create a skip event that is only fired after the function
 * itself skips, and then stops listening when the video.onseeked
 * event is fired. This would mean that another custom event would be needed
 * to **start** listening for a muted segment, instead of the video.onplaying
 * event, since initiating a skip fires the video.onseeked event.
 *
 * But this would ALSO mean that there would need to be an event to STOP
 * listening for an undo instead of the video.onseeked event.
 * At this point, some custom logic to detect a manual skip (maybe the
 * onseeked event can have a handler that only clears the listener if
 * the y-axis position of the mouse is on the seekbar, and they clicked,
 * or if there was a keyboard keypress on one of the arrow keys?)
 * would be required, in order to make sure the undo listener
 * is cleared on a user-initiated seek and not a seek that is the result of
 * a skip.
 */
// export const listenForMutedSegments: ListenForMutedSegmentsFunction = (
//   video,
//   browser,
//   DEFAULTSEGMENT,
//   state,
//   dispatch,
// ) => {
//   dispatch({
//     type: "SET_NEAREST",
//     payload: findNearestMutedSegment(
//       video,
//       state.mutedSegments,
//       DEFAULTSEGMENT,
//     ),
//   })
//   // setNearestSegment(findNearestMutedSegment(mutedSegments))

//   const DEFAULTINTERVAL = 1000
//   /**
//    * - Determine the interval for setInterval by getting the
//    *    - distance from the current time to the next startingOffset.
//    * - Verify the offset exists, and that the distance value is positive.
//    * - If there's no offset, nearestSegment is a default segment,
//    *    - meaning there are no more muted segments, and
//    *    - setInterval will return after DEFAULTINTERVAL's delay.
//    * - If the distance value is negative, we're already inside a
//    *    - mutedSegment. The skip will occur after DEFAULTINTERVAL's delay.
//    */
//   const INTERVAL = state.nearestSegment?.startingOffset
//     ? state.nearestSegment.startingOffset - video.currentTime > 0
//       ? state.nearestSegment.startingOffset - video.currentTime
//       : DEFAULTINTERVAL
//     : DEFAULTINTERVAL

//   /**
//    * Check where we're at in the VOD.
//    * Perform skip if necessary.
//    */
//   return setInterval(() => {
//     // Check and see if the nearest segment is a default segment or not.
//     if (state.nearestSegment.hasOwnProperty("default")) {
//       return
//     }

//     /**
//      * To figure out if the user is in a muted VOD segment:
//      * Check check if the currentTime is >=
//      * the closest starting offset because of the dynamic interval -
//      * should always be in close proximity of a muted segment.
//      */
//     if (
//       video.currentTime >= state.nearestSegment.startingOffset &&
//       video.currentTime < state.nearestSegment.endingOffset
//     ) {
//       // listen for icon click before initiating manual skip
//       if (state.defaultSkipMethod === "manual") {
//         browser.browserAction.onClicked.addListener(() => {
//           video.currentTime = state.nearestSegment.endingOffset
//           // ? useReducer
//           dispatch({
//             type: "SET_PREV_MUTED_SEGMENT",
//             payload: state.nearestSegment,
//           })
//           dispatch({
//             type: "SET_NEAREST",
//             payload: findNearestMutedSegment(
//               video,
//               state.mutedSegments,
//               DEFAULTSEGMENT,
//             ),
//           })
//         })
//         // auto skip
//       } else {
//         // ? useReducer
//         video.currentTime = state.nearestSegment.endingOffset
//         dispatch({
//           type: "SET_PREV_MUTED_SEGMENT",
//           payload: state.nearestSegment,
//         })
//         dispatch({
//           type: "SET_NEAREST",
//           payload: findNearestMutedSegment(
//             video,
//             state.mutedSegments,
//             DEFAULTSEGMENT,
//           ),
//         })
//       }
//     }
//   }, INTERVAL)
// }

/**
 * Retrieve the muted segment data for this VOD. Look in
 * local storage, or contact Twitch API if necessary.
 */
// export const fetchMutedSegments: FetchMutedSegmentsFunction = async (
//   video,
//   browser,
//   dispatch,
// ) => {
//   // Sanity check to make sure video element exists
//   if (!video) {
//     return
//   }

//   const vodID = document.location.pathname.split("/")[2]

//   try {
//     /**
//      * Retrieve current settings. Looking for skip method
//      * as well as skip data for the current vod.
//      */
//     const userSettings = JSON.parse(localStorage.getItem("vodskipper") ?? "")

//     /**
//      * Create a dummy settings object. Using this as a template to
//      * either add newly retrieved data, or to easily handle nonexistent
//      * properties.
//      */
//     let settings = {
//       SkipMethod: userSettings?.settings?.SkipMethod || "auto",
//       vodData: userSettings?.settings?.vodData || {},
//     } // initialize settings object

//     /**
//      * If there is no data for this vod, retrieve it using the bg script.
//      * Add the new skip data to the settings object. Update localStorage
//      * with the new settings.
//      */
//     if (userSettings?.settings?.vodData[vodID] === undefined) {
//       const data = await browser.runtime.sendMessage({ vodID })

//       if (data instanceof Error) {
//         console.error(data)
//         return
//       }

//       settings.vodData[vodID] = {
//         mutedSegments: data,
//         // exp: Date.now() + EXPIRES_IN
//       }

//       localStorage.setItem("vodskipper", JSON.stringify(settings))
//     }

//     /**
//      * Set skip data and skip method that will be used when actually
//      * skipping through the vod.
//      */
//     // ? useReducer
//     dispatch({ type: "SET_SKIP_METHOD", payload: settings.SkipMethod })
//     dispatch({ type: "SET_MUTED_SEGMENTS", payload: settings.vodData[vodID] })
//     // setDefaultSkipMethod(settings.SkipMethod)
//     // setMutedSegments(settings.vodData[vodID])

//     // TODO: Implement expiration? How? Session storage or manual cleanup check localStorage on each page load?
//   } catch (error) {
//     // TODO: Send this to error handler or whatever (some centralized error handler - kabana?)
//     console.error(`Unable to fetch the skip data: ${error}`)
//   }
// }

/**
 * Generates an interval based on
 * the video's current time (endingOffset)
 * and its distance to the start of the nearest
 * muted segment (endingOffset). Used to determine
 * When the skip function should run.
 *
 * @param startingOffset The current time in seconds.
 * @param endingOffset The time in seconds when the skip
 * function should trigger.
 * @returns The calculated interval in ms, or a default
 * value of 1000 if the calculated interval was negative.
 */
export function findInterval(startingOffset: number, endingOffset: number) {
  const DEFAULTINTERVAL = 1000
  const difference = startingOffset - endingOffset

  if (startingOffset !== undefined && difference > 0 && !isNaN(difference)) {
    return startingOffset - endingOffset
  }
  return DEFAULTINTERVAL
}

export function performSkip(
  state: State,
  dispatch: React.Dispatch<Action>,
  video: HTMLVideoElement,
) {
  if (state.nearestSegment === undefined) {
    return // ? include message?
  }

  /**
   * Should always be inside of a muted segment because
   * of the calculated interval.
   */
  if (
    video.currentTime >= state.nearestSegment.startingOffset &&
    video.currentTime < state.nearestSegment.endingOffset
  ) {
    // update the current time (perform skip)
    video.currentTime = state.nearestSegment.endingOffset

    /**
     * set previous segment to be the one that was just
     * passed. In case of undo implementation.
     */
    dispatch({
      type: "SET_PREV_MUTED_SEGMENT",
      payload: state.nearestSegment,
    })

    /**
     * Find the next nearest muted segment.
     */
    dispatch({
      type: "SET_NEAREST",
      payload: findNearestMutedSegment(
        video,
        state.mutedSegments,
        DEFAULTSEGMENT,
      ),
    })

    /**
     * For ensure application knows a skip was
     * initiated. Probably employ a useEffect
     * that will reset this variable to false,
     * clear the old listener, and generate a new one.
     */
    dispatch({ type: "SET_SKIPPED", payload: true })
  }
}

// Maybe employ a queue for handling seeks?
// This way if the script skips ahead, and then
// the user skips right after, everything is processed
// at a pace.
/**
 * Handle the seek event based on whether the user skipped
 * or whether script skipped.
 *
 * @param state
 * @param dispatch
 * @param browser
 */
export async function handleSeek(
  state: State,
  dispatch: React.Dispatch<Action>,
  browser: Browser,
) {
  if (state.skipped) {
    /**
     * If the seeked event was fired because of
     * the script, send a message to the popup
     * script to update the time. Set the skipped
     * state to false.
     */
    await browser.runtime.sendMessage({
      action: "updateTime",
      data: state.nearestSegment.startingOffset,
    })

    dispatch({ type: "SET_SKIPPED", payload: false })
  }
  return
}

/**
 * Creates a new listener for skipping.
 * Sets the listener in reducer state via dispatch.
 *
 * @param state The current state via useReducer.
 * @param video HTML video element to operate on.
 * @param dispatch Dispatch function for updating the listener.
 */
export function createListener(
  state: State,
  video: HTMLVideoElement,
  dispatch: React.Dispatch<Action>,
): void {
  const listener = setInterval(() => {
    if (state.nearestSegment?.startingOffset === undefined) {
      return undefined
    }
    performSkip(state, dispatch, video)
  }, findInterval(state.nearestSegment.startingOffset, video.currentTime))
  dispatch({ type: "SET_LISTENER", payload: listener })
}

// export const main = (video: HTMLVideoElement) => {
//   video.onplaying = () => {
//     const skipInterval = listenForMutedSegments(video, browser, DEFAULTSEGMENT, state, dispatch)
//     video.onpause = () => clearInterval(skipInterval)
//   }
//   // video.onpause = () => clearT
// }
