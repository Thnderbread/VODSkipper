import type { Collection } from "mocks-server-lite"

const collections: Collection[] = [
  {
    id: "segments",
    routes: ["get-segments:real"],
  },
  {
    id: "server_failure",
    routes: ["get-server_failure:real"],
  },
  {
    id: "server_timeout",
    routes: ["get-server_timeout:disabled"],
  },
]

export default collections
