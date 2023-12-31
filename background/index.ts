import browser from "webextension-polyfill"

type Message = {
  action: "fetch"
  value: null
}

type ResponseCallback = <T>(data: T) => void

async function handleMessage(
  { action, value }: Message,
  response: ResponseCallback,
) {
  if (action === "fetch") {
    // debugger
    const result = await fetch("https://meowfacts.herokuapp.com/")

    const { data } = await result.json()

    response({ message: "success", data })
  } else {
    response({ data: null, error: "Unknown action" })
  }
}

// @ts-ignore
browser.runtime.onMessage.addListener((msg, sender, response) => {
  handleMessage(msg, response)
  return true
})
