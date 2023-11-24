/**
 * Shows the given time in a friendlier HH:mm:ss format.
 *
 * @param seconds The current time in seconds to format.
 * @returns A HH:mm:ss string based on the given seconds value.
 */
function formatCurrentTime(seconds: number): string {
  if (isNaN(seconds)) {
    return ""
  }

  /**
   * Creates a string for the given number.
   * Adds a 0 in front of the given number if
   * necessary.
   *
   * @param time The number to beautify.
   * @returns The number as a string.
   */
  function beautifyNumber(time: number): string {
    return time > 10
      ? Math.floor(time).toString()
      : Math.floor(time).toString().padStart(2, "0")
  }

  /**
   * Format the number. If the current time is under 60s,
   * pass it to beautifyNumber and return it.
   *
   * Otherwise - calculate the needed values (HH, mm, ss),
   * construct a string based off of them, and return that.
   */
  if (seconds < 60) {
    return beautifyNumber(seconds)
  } else if (seconds < 3600) {
    const minutes = beautifyNumber(Math.floor(seconds / 60))
    const remainingSeconds = beautifyNumber(seconds % 60)
    return `${minutes}:${remainingSeconds}.`
  } else {
    const hours = beautifyNumber(Math.floor(seconds / 3600))
    const remainingMinutes = beautifyNumber(Math.floor((seconds % 3600) / 60))
    const remainingSeconds = beautifyNumber(seconds % 60)

    return `${hours}:${remainingMinutes}:${remainingSeconds}`
  }
}

export default formatCurrentTime
