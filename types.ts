export type ResponseCallback = <T>(data: T) => void

export type ShouldMakeListenerResponse = DecisionCodes

/**
 * The response from contacting the api for segments.
 */
export type MutedSegmentResponse =
  | {
      error?: never
      success: true
      data: MutedVodSegment[]
    }
  | {
      error: Error
      success: false
      data?: never
    }

/**
 * Represents what is cached in the browser's session storage.
 * Key is the vod's id.
 */
export type CacheObject = Record<string, MutedVodSegment[]>

/**
 * Whether or not a listener should be created.
 */
export enum DecisionCodes {
  Create = 0,
  NoMutedSegments = 1,
  NearestIsDefault = 2,
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
