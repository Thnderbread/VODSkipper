import type { Route } from "mocks-server-lite"

const route: Route = {
  id: "get-server_failure",
  url: "/vods/muted/:id",
  method: "GET",
  variants: [
    {
      id: "real",
      type: "json",
      response: {
        status: 500,
      },
    },
  ],
}

export default route
