import { Browser } from "webextension-polyfill"
import { DEFAULTSEGMENT } from "./content-script/component"
import {
  FindNearestMutedSegmentFunction,
  ListenForMutedSegmentsFunction,
  FetchMutedSegmentsFunction,
  HandleSeekFunction,
  State,
  Action,
  GetDataResponse,
} from "./types"
import formatCurrentTime from "./background/utils/formatTime"

/**
 * Looks for the muted segment closest to
 * the video's current time. If no segment
 * is found, the user has most likely passed all of them.
 * @returns The segment or undefined.
 */
export const findNearestMutedSegment: FindNearestMutedSegmentFunction = (
  video,
  mutedSegments,
) => {
  // ! Remove this
  // console.log(
  //   `Looking for nearest muted segment in muted segments!: ${mutedSegments}`,
  // )
  // don't bother skipping if a muted
  // segment will end in 3 seconds.
  const cutoffPoint = 3

  return (
    mutedSegments.find(segment => {
      if (video.currentTime <= segment.startingOffset) {
        return segment
      } else if (video.currentTime > segment.startingOffset) {
        if (video.currentTime < segment.endingOffset - cutoffPoint) {
          return segment
        }
      }
    }) || DEFAULTSEGMENT
  )
}

export function calculateInterval(
  startingOffset: number,
  endingOffset: number,
) {
  // ! Remove this
  // console.log("Trying to find the interval...")
  // console.log(
  //   `Nearest segment time: ${startingOffset} | Ending offset: ${endingOffset}`,
  // )
  const DEFAULTINTERVAL = 3000
  const difference = startingOffset - endingOffset

  // TODO: Round up to make sure interval is always at or after the start of a segment
  return difference > 0 ? difference * 1000 + 200 : DEFAULTINTERVAL
}

/**
 * Issues:
 * - Waiting until the segment start is reached to use the
 * generated interval. E.G., skipping to 27170 manually creates
 * a 9 second listener. After 9 seconds, "OMG OK IT'S HAPPENING I'M SKIPPING"
 * is logged, but the actual skip doesn't happen until 9 seconds later.
 * ? Set up an else block w/ console logs to see what happens
 * ? After the after the first 9 seconds when the listener should be called.
 */
export function performSkip(
  video: HTMLVideoElement,
  startingOffset: number,
  endingOffset: number,
) {
  // ! Remove this
  console.log("OMG OK IT'S HAPPENING")
  console.log(`Skipping from: ${startingOffset} to ${endingOffset}`)
  video.currentTime = endingOffset
  console.log("performSkip execution finished!")
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
  video?: HTMLVideoElement,
) {
  // ! Remove this
  // TODO: Update nearest segment
  console.log("Handling the seek!")
  if (state.skipped) {
    console.log(`Changed skipped from ${state.skipped} to ${!state.skipped}.`)
    // ! Remove this
    // console.log(`Full state inside of handleSeek: ${JSON.stringify(state)}`)
    // clearTimeout(state.listener)
    // dispatch({ type: "SET_LISTENER", payload: undefined })
    dispatch({ type: "SET_SKIPPED", payload: false })
    console.log(`Full state inside of handleSeek after dispatch: ${state}`)

    /**
     * If the seeked event was fired because of
     * the script, send a message to the popup
     * script to update the time. Set the skipped
     * state to false.
     * ? This goes to bg script?
     */
    // ! Remove this
    console.log("Sending update message to bg script - I performed a skip!")

    // ! need workaround. talking to bg script here
    // ! results in extension context invalidated error.
    // Send the next closest muted segment to
    // bg script to send to popup and show user
    // await browser.runtime.sendMessage({
    //   action: "updateTime",
    //   data: state.nearestSegment.readableOffset,
    // })
  } else {
    // This is a user-initiated seek - need to reassess the nearest muted segment.
    // ! Remove this
    console.log("Ok this seek wasn't me - swear!")
    const next = findNearestMutedSegment(video!, state.mutedSegments)
    console.log(
      `Updating state.nearestSegment from ${JSON.stringify(
        state.nearestSegment,
      )} to ${JSON.stringify(next)}`,
    )
    dispatch({ type: "SET_NEAREST", payload: next })
  }
  // ! Remove this
  console.log("handle seek execution finished!")
  return
}

// enum CreateListenerCodes {
//   VideoBeyondNearest = 0,
//   VideoBehindNearest = 1,
//   CreatedListener = 2,
// }

// type CreateListenerResponse = [CreateListenerCodes, NodeJS.Timeout]

/**
 * Creates a new listener for skipping.
 * Sets the listener in reducer state via dispatch.
 *
 * @param state The current state via useReducer.
 * @param video HTML video element to operate on.
 * @param dispatch Dispatch function for updating the listener.
 */
export function createListener(
  startingOffset: number,
  video: HTMLVideoElement,
  endingOffset: number,
): NodeJS.Timeout {
  // ! Remove this
  console.log("Creating a new listener")
  const int = calculateInterval(startingOffset, video.currentTime)
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

export async function fetchDataFromBGScript(
  vodID: string,
  browser: Browser,
  video: HTMLVideoElement,
) {
  const { data }: GetDataResponse = await browser.runtime.sendMessage({
    action: "getData",
    data: vodID,
  })
  // ! Remove this
  console.log(`Received a response from bg!: ${data}`)
  if (data instanceof Error) {
    // ! Remove this
    console.error(`Got an error! ${data}`)
    return data
    // dispatch({ type: "SET_ERROR", payload: data.message })
  } else if (data.length === 0) {
    // Returning if there's no data
    // since initial reducer state has dummy data
    // ! Remove this
    console.log(`Muted segments not found for vod ${vodID}.`)
    return undefined
  } else {
    // ! Remove this
    console.log(`Found ${data.length} muted segments for vod ${vodID}.`)
    return { segments: data, nearest: findNearestMutedSegment(video, data) }
  }
}

// seek before playing
// can try dispatching the setTimeout fn directly as payload?
// handle via useEffect? once state.skipped changes, let useEffect clear listener, and then make a new one

// 1905 - right before skip
// Seeks count as pausing, so pause handler clears this listener right after / because of performSkip
// handleSeek (both calls) still has stale 1905 listener.
// However in createListener, state.listener is absent. Believe this is because JSON.stringify omits things that have an 'undefined' value, which listener does due to the pause handler
// A new listener is created w/ a default 3000 ms interval. Seemingly because it's still working off the video time from before the skip happened. This listener is not cleared.
// I can't tell whether the above is because of createListener or its caller, i.e. If a delay at the start of createListener should be used or a delay before createListener is called should be used.
// A second listener is created with the expected interval.

// Tried setting a delay of 500 ms at the start of createListener. This helped a bit, for example, state.listener now has a value when logged instead of being undefined. Didn't solve the issue.
// Tried setting a delay of 1500 ms BEFORE createListener is called - it seemed like the function was given stale data. This did not work - the initial 3000 ms listener is still created.

// ! Causes an issue (obv) with skips not happening mid muted segment. Just call performSkip directly?
// Managed to get rid of initial issue of listeners being present after first skip. Think I just added a check in handleSeek for manual seeks, and a check in createListener to make sure starting offset >= current time? Also put a clearTimeout before calling createListener in the content script.
// ? Too many calls to createListener? Lots of "changing listener in reducer" console logs
// ? Are listeners being cleared after a seek? Should they be cleared? Does onpause handler clear them?
// ?
// But if the user rewinds past the first skip and plays again, extra listeners are present - think it's because of the delays in place.
// Another issue related to above, things like the playing and paused events get called a shitload of times, like 5+. Thinking that maybe this is caused to a component re-render, maybe caused by the updating of nearestSegment? (since) Maybe some cleanup isn't being done right. Double check that tearDownListeners is called on everything, and look for other things to clean up. There are the video listeners and the fkn state listener to clear.
