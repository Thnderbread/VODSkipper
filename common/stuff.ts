export interface SwitchProps {
  switchTitle: string
  enabled: boolean
  switchDescription: string
  setEnabled: (manualSkip: boolean) => void
}

export interface PopupMessages {
  errorMessage: string
  loadingMessage: string
  nearestSegmentMessage?: string
  noMutedSegmentsMessage: string
  passedAllSegmentsMessage: string
}
