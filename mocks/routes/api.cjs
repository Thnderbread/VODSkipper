const SEGMENTS = require("../fixtures/segments.cjs")

const SEGMENTS_MAP = new Map()
SEGMENTS_MAP.set("2050655749", []) // segments for an unmuted vod
SEGMENTS_MAP.set("1780240732", SEGMENTS[0]) // segments for a muted vod

module.exports = [
  {
    id: "get-segments",
    url: "/vods/muted/:id",
    method: "GET",
    variants: [
      {
        id: "real",
        type: "middleware",
        options: {
          middleware: (req, res) => {
            const vodID = req.params.id
            const segments = SEGMENTS_MAP.get(vodID)
            if (segments) {
              res.status(200).json({ segments })
            } else {
              res.sendStatus(204)
            }
          },
        },
      },
    ],
  },
  {
    id: "get-server_failure",
    url: "/vods/muted/:id",
    method: "GET",
    variants: [
      {
        id: "real",
        type: "status",
        options: {
          status: 500,
        },
      },
    ],
  },
  {
    id: "get-server_timeout",
    url: "/vods/muted/:id",
    method: "GET",
    variants: [
      {
        id: "disabled",
        type: "middleware",
        delay: 100000,
        options: {
          middleware: async (req, res) => {
            await new Promise(r => setTimeout(r, 10000))
            const segments = SEGMENTS_MAP.get(req.params.id)
            res.status(200).json({ segments })
          }
        },
      },
    ],
  },
]
