import React from "react"
import ReactDOM from "react-dom/client"

import manifest from "../public/manifest.json" assert { type: "json" }

import App from "./ContentScript.jsx"
import "./index.css"

console.debug(`Initiate Web Extension v${manifest.version}`)

const pluginTagId = "extension-root"
const existingInstance = document.getElementById(pluginTagId)
if (existingInstance !== null) {
  console.debug("existing instance found, removing")
  existingInstance.remove()
}

const component = document.createElement("div")
component.setAttribute("id", pluginTagId)

document.body.append(component)
ReactDOM.createRoot(component).render(<App />)
