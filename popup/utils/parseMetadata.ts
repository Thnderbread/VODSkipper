import type { CacheObjectLiteral } from "../../types"

/**
 * Reads the object to extract and return metadata.
 *
 * @param param0 Object containing the metadata for a vod.
 * @returns {string} Error message or a string showing the number of muted segments for a vod.
 */
function parseMetadata({
  metadata,
}: Omit<CacheObjectLiteral, "segments">): string {
  const { error, numSegments } = metadata
  if (error !== "") {
    return error
  }

  return `This vod has ${numSegments > 0 ? numSegments : "no"} muted segment${
    numSegments === 1 ? "" : "s"
  }.`
}

export default parseMetadata
