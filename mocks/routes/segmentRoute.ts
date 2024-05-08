import segmentsMap from "../fixtures/segments.js"
import type { Route, RouteVariantHandler } from "mocks-server-lite"

const routeHandler: RouteVariantHandler<{ id: string }> = {
  id: "real",
  type: "handler",
  response: (req, res) => {
    const segments = segmentsMap.get(req.params.id as string)
    if (segments !== undefined && segments.length > 0) {
      res.status(200).json({ segments })
    } else {
      res.sendStatus(404)
    }
  },
}

const route: Route = {
  id: "get-segments",
  url: "/vods/muted/:id",
  method: "GET",
  variants: [routeHandler],
}

export default route
