export interface TwurpleError {
  error: string
  status: number
  message: string
}

/**
 * { body: string } symbolizes the JSON nature of
 * the raw twurple response.
 */
export function isTwurpleError(error: unknown): error is { body: string } {
  return typeof error === "object" && error !== null && "body" in error
}
