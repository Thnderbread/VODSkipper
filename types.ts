export type ResponseCallback = <T>(data: T) => void

export type ShouldMakeListenerResponse = DecisionCodes

/**
 * The response from contacting the api for segments.
 */
export type MutedSegmentResponse =
  | {
      success: true
      data: MutedVodSegment[]
    }
  | {
      success: false
      data?: never
    }

/**
 * Represents what is cached in the browser's session storage.
 * Key is the vod's id.
 */
export type CacheObject = Record<string, CacheObjectLiteral>

/**
 * Whether or not a listener should be created.
 */
export enum DecisionCodes {
  Create = 0,
  NoMutedSegments = 1,
  NearestIsDefault = 2,
}

/**
 * All the possible resolutions of
 * fetching vod data from the api.
 * Used to determine whether or not
 * to retry a request later.
 */
export enum FetchResolutions {
  /** Api error. */
  INTERNAL_SERVER_ERROR = "Something went wrong with the server.",
  /** No idea what happened. Likely client side. */
  UNEXPECTED_ERROR = "Unexpected error occurred.",
  /** Long running request was aborted. */
  TIMEOUT_ERROR = "Server request timed out.",
  /** Usually some fetch-specific error, like CORS. Logs as a type error. */
  TYPE_ERROR = "Couldn't contact server.",
}
export interface CacheObjectLiteral {
  metadata: Metadata
  segments: MutedVodSegment[]
}

/**
 * Holds some metadata about the vod that will be useful
 * to the popup.
 */
export interface Metadata {
  numSegments: number
  hasSegments: boolean
  error: string
}

/**
 * Message to the content script
 * from the popup checking for any errors
 * that occurred during segment data fetching.
 */
export interface StatusMessage {
  data: "getStatus"
}

/**
 * Response from the content script
 * to the popup checking for any errors
 * that occurred during segment data fetching.
 */
export interface StatusMessageResponse {
  segmentLength: number | null
  error: string | null
}

/**
 * Object that is passed into the
 * shouldCreateListener function.
 */
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

/**
 * Message to the background script
 * from the content script for segment data.
 */
export interface GetDataMessage {
  action: "getData"
  vodID: string
}

/**
 * Response from the background script
 * to the content script for segment data.
 */
export interface GetDataResponse {
  data: MutedVodSegment[]
  error: string | null
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
   * Any Errors that occur in the BG script.
   */
  error: string
  /**
   * The nearest muted segment to be skipped.
   */
  nearestSegment: MutedVodSegment
  /**
   * All of the muted segments for the vod.
   */
  mutedSegments: MutedVodSegment[]
}

// TODO: Set error payload to be specific strings.
export type Action =
  | { type: "SET_ERROR"; payload: string }
  | { type: "SET_NEAREST"; payload: MutedVodSegment }
  | { type: "SET_MUTED_SEGMENTS"; payload: MutedVodSegment[] }
