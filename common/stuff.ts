export interface SwitchProps {
  enabled: boolean
  switchTitle: string
  setEnabled: () => void
  switchDescription: string
}

export interface PopupMessages {
  errorMessage: string
  loadingMessage: string
  nearestSegmentMessage?: string
  noMutedSegmentsMessage: string
  passedAllSegmentsMessage: string
}
