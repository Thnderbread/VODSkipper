import type { Route } from "mocks-server-lite"

const route: Route = {
  id: "get-server_timeout",
  url: "/vods/muted/:id",
  method: "GET",
  variants: [
    {
      id: "disabled",
      type: "handler",
      response: async (_, res) => {
        await new Promise(r => setTimeout(r, 10000))
        res.sendStatus(500)
      },
    },
  ],
}

export default route
