import { type Action, type State } from "../types"

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function reducer(state: State, action: Action) {
  switch (action.type) {
    case "SET_NEAREST":
      return { ...state, nearestSegment: action.payload }
    case "SET_MUTED_SEGMENTS":
      return { ...state, mutedSegments: action.payload }
    case "SET_ENABLED":
      return { ...state, enabled: action.payload }
    case "SET_ERROR":
      return { ...state, error: action.payload }
    default:
      return state
  }
}

export default reducer
