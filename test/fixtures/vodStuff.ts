export const mutedVodID = "1780240732"
export const unmutedVodID = "2111779905"

export const mutedVodUrl = `https://www.twitch.tv/videos/${mutedVodID}`
export const unmutedVodUrl = `https://www.twitch.tv/videos/${unmutedVodID}`

export const MUTED_SEGMENT_DATA = {
  metadata: {
    error: "",
    numSegments: 3,
  },
  segments: [
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
  ],
}

export const UNMUTED_SEGMENT_DATA = {
  metadata: {
    error: "",
    numSegments: 0,
  },
  segments: [],
}
