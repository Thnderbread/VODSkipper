import { HelixVideo } from "@twurple/api/lib"

export type SkipMethod = "auto" | "manual"

export type Vod = HelixVideo | null

export type MutedVodSegment = {
  id?: string
  title?: string
  duration: number
  endingOffset: number
  startingOffset: number
}

export interface State {
  listeningForUndo: boolean
  defaultSkipMethod: SkipMethod
  nearestSegment: MutedVodSegment
  mutedSegments: MutedVodSegment[]
  prevMutedSegment: MutedVodSegment
}

export type Action =
  | { type: "SET_UNDO_LISTEN"; payload: boolean }
  | { type: "SET_SKIP_METHOD"; payload: SkipMethod }
  | { type: "SET_NEAREST"; payload: MutedVodSegment }
  | { type: "SET_MUTED_SEGMENTS"; payload: MutedVodSegment[] }
  | { type: "SET_PREV_MUTED_SEGMENT"; payload: MutedVodSegment }
