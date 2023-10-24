import React, { useEffect, useState } from 'react'
import browser from 'webextension-polyfill'

// const EXPIRES_IN = 259_000_000

export default () => {
  const [fact, setFact] = useState('Click the button to fetch a fact!')
  const [loading, setLoading] = useState(false)
  const [mutedSegment, setMutedSegment] = useState({}) // stores the nearest muted segment.
  const video = document.querySelector("video")

  // binary search?
  // findNearestMutedSegment():
    // go through skipdata (forEach)
    // is video.currentTime <= startingOffset?
      // return this segment.
    // is video.currentTime > startingOffset?
      // is video.CurrentTime < endingOffset - 5? (ignore when muted segment is about to end)
        // return this segment.
      // go to next segment, repeat steps.

    // video.seeked = handleSeek()
      // wasListenForSkipRequest() called? - state var to set and read this (listeningForSkips). if true
        // stop listening.
          // restore default skip method
          // set listeningForSkips = false.
            // useEffect to call listenForSkips? 
            // that way we can cleanly engage and disengage the fn?
      // findNearestMutedSegment()
      // is user in mutedSegment?
        // setSkipMethod(manual)
        // listenForSkipRequest()
          // should set listeningForSkips = true
      // setSkipMethod(default)

    // video.onPlaying = listenForMutedSegments()
      // whileVideo.paused !== false:
        // setInterval (1s)
        // if video.currentTime >= nearestSegmentStart && video.currentTime < nearestSegmentEnd:
          // if skipMethod === manual:
            // setSkipState(manual)
            // listenForSkipRequest()
            // updateSkipSegments() || findNearestMutedSegment()?
          // else if skipMethod === auto:
            // setSkipState === auto:
            // handleSkip()
            // updateSkipSegments() || findNearestMutedSegment()?

  // Flow:
    // retrieve VOD data & user skip method preference.
    // video.onplaying = listenForMutedSegments().
    // video.onseeked = handleSeek().

  const [skipData, setSkipData] = useState([])

  type skipMethod = "auto" | "manual"
  const [defaultSkipMethod, setDefaultSkipMethod] = useState<skipMethod>("auto") // default skip method - user's preferred choice
  const [currentSkipMethod, setCurrentSkipMethod] = useState<skipMethod>(defaultSkipMethod) // if a user scrubs

  // Update skipMethod in localStorage once the user toggles it
  // useEffect(() => {
  //   const userSettings = JSON.parse(localStorage.getItem("vodskipper"))
  //   userSettings.skipMethod = skipMethod
  //   localStorage.setItem("vodskipper", JSON.stringify(userSettings))
  // }, [skipMethod])

  async function handleOnClick() {
    setLoading(true)
    const {data} = await browser.runtime.sendMessage({ action: 'fetch' })
    setFact(data)
    setLoading(false)
  }

  /**
   * Retrieve the muted segment data for this VOD. Look in
   * local storage, or contact Twitch API if necessary.
   */
  async function fetchSkipData() {
    const vodID = document.location.pathname.split('/')[2];
    
    try {
      /**
       * Retrieve current settings. Looking for skip method 
       * as well as skip data for the current vod.
       */ 
      const userSettings = JSON.parse(localStorage.getItem("vodskipper") ?? "")
      
      /**
       * Create a dummy settings object. Using this as a template to
       * either add newly retrieved data, or to easily handle nonexistent
       * properties.
       */
      let settings = { 
        skipMethod: userSettings?.settings?.skipMethod || "auto",
        vodData: userSettings?.settings?.vodData || {} 
      } // initialize settings object 
      
      /**
       * If there is no data for this vod, retrieve it using the bg script.
       * Add the new skip data to the settings object. Update localStorage
       * with the new settings.
       */
  
      if (userSettings?.settings?.vodData[vodID] === undefined) {
        const skipData = await browser.runtime.sendMessage({ vodID })
        settings.vodData[vodID] = { 
          skipData,
          // exp: Date.now() + EXPIRES_IN
        }
  
        localStorage.setItem("vodskipper", JSON.stringify(settings))
      }
  
      /**
       * Set skip data and skip method that will be used when actually
       * skipping through the vod.
       */
  
      setDefaultSkipMethod(settings.skipMethod)
      setSkipData(settings.vodData[vodID])
      
      // TODO: Implement expiration? How? Session storage or manual cleanup check localStorage on each page load?
    } catch (error) {
      // TODO: Send this to error handler or whatever
      console.error(`Unable to fetch the skip data: ${error}`)
    }
  }

  function determineCurrentLocation() {
    const video = document.querySelector("video")
    return video?.currentTime
  }

  // Function is only called by other functions 
  function handleSkip(endingOffset: number) {
    //
  }

  /**
   * Listen for a skip prompt when the skipMethod is set to manual.
   */
  function listenForSkip(skipMethod: skipMethod) {
    //
  }

  /**
   * Listen for an undo prompt after skipping.
   */
  function listenForUndo() {
    //
  }

  return (
    <div className='absolute top-20 left-20'>
      <div className='flex flex-col gap-4 p-4 shadow-sm bg-gradient-to-r from-purple-500 to-pink-500 w-96 rounded-md'>
        <h1>Cat Facts!</h1>
        <button
          className='px-4 py-2 font-semibold text-sm bg-cyan-500 text-white rounded-full shadow-sm disabled:opacity-75 w-48'
          disabled={loading} onClick={handleOnClick}>Get a Cat Fact!
        </button>
        <p className='text-white'>{fact}</p>
      </div>
    </div>
  )
}
