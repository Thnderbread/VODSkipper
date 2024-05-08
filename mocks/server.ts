import { createServer } from "mocks-server-lite"

import collections from "./collections.js"
import routes from "./routes/index.js"

const server = createServer({
  selected: "segments",
  port: 3100,
})

void server.start({ routes, collections })
