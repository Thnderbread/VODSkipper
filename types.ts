import { HelixVideo } from "@twurple/api/lib"
import { Browser } from "webextension-polyfill"

export type SkipMethod = "auto" | "manual"

export type Vod = HelixVideo | null

export type FindNearestMutedSegmentFunction = (
  video: HTMLVideoElement,
  mutedSegments: MutedVodSegment[],
  DEFAULTSEGMENT: DefaultVodSegment,
) => MutedVodSegment

export type ListenForMutedSegmentsFunction = (
  video: HTMLVideoElement,
  browser: Browser,
  DEFAULTSEGMENT: DefaultVodSegment,
  state: State,
  dispatch: React.Dispatch<Action>,
) => NodeJS.Timeout

export type FetchMutedSegmentsFunction = (
  video: HTMLVideoElement,
  browser: Browser,
  dispatch: React.Dispatch<Action>,
) => Promise<void>

export type HandleSeekFunction = (
  video: HTMLVideoElement,
  state: State,
  dispatch: React.Dispatch<Action>,
) => void

export type MutedVodSegment = {
  id?: string
  title?: string
  duration: number
  endingOffset: number
  startingOffset: number
  readableOffset?: string
}

export type DefaultVodSegment = {
  default: boolean
} & MutedVodSegment

export interface State {
  enabled: boolean
  skipped: boolean
  listener: NodeJS.Timeout | undefined
  nearestSegment: MutedVodSegment
  mutedSegments: MutedVodSegment[]
  prevMutedSegment: MutedVodSegment
}

export type Action =
  | { type: "SET_LISTENER"; payload: NodeJS.Timeout }
  | { type: "SET_ENABLED"; payload: boolean }
  | { type: "SET_SKIPPED"; payload: boolean }
  | { type: "SET_NEAREST"; payload: MutedVodSegment }
  | { type: "SET_MUTED_SEGMENTS"; payload: MutedVodSegment[] }
  | { type: "SET_PREV_MUTED_SEGMENT"; payload: MutedVodSegment }
