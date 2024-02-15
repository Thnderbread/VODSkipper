import browser from "webextension-polyfill"
import { CacheObject, MutedVodSegment } from "../../types"

/**
 * Caches vod segments with the browser's session storage api.
 *
 * @param {CacheObject} data The key is the vod's id. Its value is its corresponding segments.
 */
export async function cacheSegments(data: CacheObject): Promise<void> {
  await browser.storage.session.set(data)
}

/**
 * Checks the storage for segments corresponding to the given id.
 *
 * @param {string} key The vod id to look for.
 * @returns The associated value. Can be an array or undefined.
 */
export async function checkCache(
  key: string,
): Promise<MutedVodSegment[] | undefined> {
  const cached: CacheObject = await browser.storage.session.get(key)
  return cached[key]
}
