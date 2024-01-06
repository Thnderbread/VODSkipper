/* eslint-disable @typescript-eslint/no-unused-vars */
import browser from "webextension-polyfill"
import React, { useEffect, useState } from "react"
import type { NoDataMessage, VodSkipperSettings } from "../types"

/**
 * Just displays shit. Obtain data from session storage
 * for showing numbers and stuff.
 *
 * Listen for new times from content script.
 */

// TODO: Idk man took away the switch. Just gonna display a message based on whether the extension is enabled. Added some console logs in the onInstalled bg listener to see if stuff is being set in storage or not
// TODO: [✅] Send a message when enabled is toggled.
// TODO: Should cancel everything on content-script side.
// try getting things from storage initially, use listeners for the storage throughout the script
const Popup = (): JSX.Element => {
  const [enabled, setEnabled] = useState(true)
  const [message, setMessage] = useState(
    `VODSkipper is currently ${enabled ? "enabled" : "disabled"}.`,
  )
  const [error, setError] = useState("")
  const [display, setDisplay] = useState("")

  // TODO: Only send setEnabled message if enabled is being changed to false
  // TODO: Send second setEnabled message to BG script.
  async function handleToggle(): Promise<void> {
    // ! Remove this
    // console.log("attempting to change enabled state.")
    // const value = await retrieveFromStorage("vodskipper")
    // if (value?.vodskipper?.enabled === undefined) {
    //   const vodskipperSettings: LocalStorageSettings = {
    //     vodskipper: {
    //       enabled: !enabled,
    //     },
    //   }
    //   await setInStorage(vodskipperSettings)
    // }
    setEnabled(!enabled)
    // ! Remove this try catch once kinks are ironed out
  }

  // browser.storage.onChanged

  // add a changed handler to content script
  // useEffect(() => {
  //   void (async () => {
  //     const value = await retrieveFromStorage("vodskipper")
  //     if (value?.vodskipper?.enabled === undefined) {
  //       console.log("Nothing found in local storage, setting manually")
  //       const vodskipperSettings: LocalStorageSettings = {
  //         vodskipper: {
  //           enabled: true,
  //         },
  //       }
  //       await setInStorage(vodskipperSettings)
  //     }
  //     setEnabled(value?.vodskipper?.enabled ?? true)
  //   })()
  // }, [])

  useEffect(() => {
    void (async () => {
      console.log("Asking bg for enabled status")
      const response: VodSkipperSettings = await browser.runtime.sendMessage({
        action: "check",
        data: true,
      })
      console.log(`BG response for enabled status: ${JSON.stringify(response)}`)
      setEnabled(response.enabled)
    })()

    const noDataListener = ({ action, data }: NoDataMessage): void => {
      if (action === "getData" && data.length === 0) {
        console.log("There's no muted segments for this vod.")
        setMessage(message + "No muted segments found for this vod.")
      }
    }

    browser.runtime.onMessage.addListener(noDataListener)

    return () => {
      browser.runtime.onMessage.removeListener(noDataListener)
    }
  }, [])

  useEffect(() => {
    if (error !== "") {
      setDisplay(error)
    }
  }, [error])

  useEffect(() => {
    if (message !== "") {
      setDisplay(message)
    }
  }, [message])

  return (
    <div className="flex flex-col gap-4 p-4 shadow-sm bg-black bg-opacity-100 w-96">
      <h1>VODSkipper</h1>
      <div className="border border-solid border-gray-700"></div>
      {/* <div>
        <ToggleSwitchWithLabel
          switchTitle={"Enabled"}
          switchDescription={
            "Uncheck to disable. Keeps the page from refreshing."
          }
          enabled={enabled}
          setEnabled={handleToggle}
        />
      </div>

      <div className="border border-solid border-gray-700"></div> */}

      {/* <div
        hidden={error === "" && message === ""}
        className="text-center justify-center text-lg text-white mb-10"
      ></div> */}
      <p
        hidden={error === "" && message === ""}
        className="text-center justify-center text-lg text-white mb-4"
      >
        {display}
      </p>
    </div>
  )
}

export default Popup
