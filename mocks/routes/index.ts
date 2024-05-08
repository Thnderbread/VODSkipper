import segments from "./segmentRoute.js"
import serverDown from "./serverDownRoute.js"
import serverTimeout from "./serverTimeoutRoute.js"

const routes = [segments, serverDown, serverTimeout]

export default routes
