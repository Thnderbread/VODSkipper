/**
 * More touch ups
 * Test - see what fkn broke cuz yk you broke some shit
 */
export type ResponseCallback = <T>(data: T) => void

export type PopupMessage = SetEnabledMessage

export type StorageArea = "local" | "session" | undefined

export enum DecisionCodes {
  Create = 0,
  NoMutedSegments = 1,
  NearestIsDefault = 2,
}

export type ShouldMakeListenerResponse = DecisionCodes

/**
 * What's set in local storage.
 * Vodskipper property is used as the
 * local storage item key.
 */
export interface LocalStorageSettings {
  vodskipper: {
    enabled: boolean
  }
}

export interface SessionStorageSettings {
  vodskipper: Record<string, MutedVodSegment[]>
}

export interface VodSkipperSettings {
  enabled: boolean
}

export type StoredVodSegments = Record<string, MutedVodSegment[]>

/**
 * Tuple that either contains an error and undefined,
 * Or null as the error and an array containing data
 * on the vod's muted segments.
 */
export type MutedSegmentResponse = [Error | null, MutedVodSegment[]?]

/**
 * Axios response from the api.
 */
export interface ApiResponse {
  segments: MutedVodSegment[]
}

export interface SetEnabledMessage {
  action: "setEnabled"
  data: boolean
}

export interface GetDataMessage {
  action: "getData"
  data: string
}

export interface NoDataMessage {
  action: "getData"
  data: []
}

export interface UpdateTimeMessage {
  action: "updateTime"
  data: number
}

export interface GetDataResponse {
  data: MutedVodSegment[]
  error: Error | null
}

export enum NewListenerCodes {
  /**
   * For when there's no data at all.
   */
  NoMutedSegmentData = 0,
  /**
   * Successful listener registration.
   */
  RegisteredNewListener = 1,
  /**
   * Specifically for when there are
   * no muted segments beyond the current
   * point in the video.
   */
  NoMutedSegmentDetected = 2,
}

export interface NewListenerResponse {
  data?:
    | "No muted segments found for this vod."
    | "No muted segments ahead."
    | "Listener created."
  error: Error
}

/**
 * Background script's response to a message
 * from the popup.
 */
export interface PopupBGResponse {
  error: Error | null
  data: "Preferences updated." | boolean
}

/**
 * Content script's response to a message
 * from the popup.
 */
export interface PopupCSResponse {
  error: Error | null
  data:
    | "No muted segments found for this vod."
    | "No muted segments ahead."
    | "Listeners cleared."
    | "Listener created."
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
   * Whether the extension is currently enabled.
   */
  enabled: boolean
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

export type Action =
  | { type: "SET_ERROR"; payload: string }
  | { type: "SET_ENABLED"; payload: boolean }
  | { type: "SET_NEAREST"; payload: MutedVodSegment }
  | { type: "SET_MUTED_SEGMENTS"; payload: MutedVodSegment[] }
