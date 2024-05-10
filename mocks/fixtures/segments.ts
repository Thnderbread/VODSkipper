import type { MutedVodSegment } from "../../types"

const SEGMENTS = [
  {
    startingOffset: 2520,
    endingOffset: 2700,
    duration: 180,
    readableOffset: "42:00.",
  },
  {
    startingOffset: 2880,
    endingOffset: 3060,
    duration: 180,
    readableOffset: "48:00.",
  },
  {
    startingOffset: 4680,
    endingOffset: 4860,
    duration: 180,
    readableOffset: "01:18:00",
  },
]

const segmentsMap = new Map<string, MutedVodSegment[]>()
segmentsMap.set("2111779905", []) // segments for an unmuted vod
segmentsMap.set("1780240732", SEGMENTS) // segments for a muted vod

export default segmentsMap
