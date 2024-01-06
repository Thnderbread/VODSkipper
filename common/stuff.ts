export interface SwitchProps {
  enabled: boolean
  switchTitle: string
  setEnabled: () => Promise<void>
  switchDescription: string
}

export interface PopupMessages {
  errorMessage: string
  loadingMessage: string
  nearestSegmentMessage?: string
  noMutedSegmentsMessage: string
  passedAllSegmentsMessage: string
}

/**
 * - Need to add types for stuff (TODO)
 * - Double check implementations of stuff in content script
 * - Honestly, just test it out real time and see what happens.
 */
