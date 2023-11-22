export interface SwitchProps {
  switchTitle: string
  manualSkip: boolean
  switchDescription: string
  setManualSkip: (manualSkip: boolean) => void
}

export interface PopupMessages {
  errorMessage: string
  loadingMessage: string
  nearestSegmentMessage?: string
  noMutedSegmentsMessage: string
  passedAllSegmentsMessage: string
}
