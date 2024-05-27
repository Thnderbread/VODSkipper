import React from "react"
import ReactDOM from "react-dom/client"

import App from "./Popup.jsx"

const pluginTagId = "extension-root"
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const component = document.getElementById(pluginTagId)!
ReactDOM.createRoot(component).render(
  // <React.StrictMode>
  <App />
  // </React.StrictMode>
)
