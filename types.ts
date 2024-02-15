export type ResponseCallback = <T>(data: T) => void

export type StorageArea = "local" | "session" | undefined

export type StoredVodSegments = Record<string, MutedVodSegment[]>

/**
 * Tuple that either contains an error and undefined,
 * Or null as the error and an array containing data
 * on the vod's muted segments.
 */
export type ShouldMakeListenerResponse = DecisionCodes

export type MutedSegmentResponse = [Error | null, MutedVodSegment[]?]

export enum DecisionCodes {
  Create = 0,
  NoDataGiven = 1,
  NoMutedSegments = 2,
  NearestIsDefault = 3,
}

export interface StatusMessage {
  data: "getStatus"
}

export interface StatusMessageResponse {
  segmentLength: number | null
  error: string | null
}

export interface SessionStorageSettings {
  vodskipper: Record<string, MutedVodSegment[]>
}

export interface SegmentInfo {
  nearestSegment: MutedVodSegment
  mutedSegments: MutedVodSegment[]
}
/**
 * Response from the proxy api.
 */
export interface ApiResponse {
  segments: MutedVodSegment[]
}

export interface GetDataMessage {
  action: "getData"
  vodID: string
}

export interface NoDataMessage {
  action: "getData"
  data: []
}

export interface GetDataResponse {
  data: MutedVodSegment[]
  error: string | null
}

/**
 * An object denoting a muted segment
 * as returned by Twitch.
 */
export interface VodSegment {
  offset: number
  duration: number
}

/**
 * An object denoting a muted segment
 * that has been formatted with additional
 * properties.
 */
export interface MutedVodSegment {
  duration: number
  endingOffset: number
  startingOffset: number
  readableOffset?: string
}

/**
 * An object denoting a 'default' muted segment.
 * Used to distinguish between present and absent
 * data for a vod.
 */
export interface DefaultVodSegment extends MutedVodSegment {
  default: boolean
}

export interface State {
  /**
   * The nearest muted segment to be skipped.
   */
  nearestSegment: MutedVodSegment
  /**
   * All of the muted segments for the vod.
   */
  mutedSegments: MutedVodSegment[]
  /**
   * Any Errors that occur in the BG script.
   */
  error: string
}

// TODO: Set error payload to be specific strings.
export type Action =
  | { type: "SET_ERROR"; payload: string }
  | { type: "SET_NEAREST"; payload: MutedVodSegment }
  | { type: "SET_MUTED_SEGMENTS"; payload: MutedVodSegment[] }
