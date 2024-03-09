import type { State, Action } from "../types"

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_NEAREST":
      return { ...state, nearestSegment: action.payload }
    case "SET_MUTED_SEGMENTS":
      return { ...state, mutedSegments: action.payload }
    case "SET_ERROR":
      return { ...state, error: action.payload }
    default:
      return state
  }
}

export default reducer
