import browser from "webextension-polyfill"
import type {
  MutedVodSegment,
  StoredVodSegments,
  VodSkipperSettings,
  LocalStorageSettings,
  SessionStorageSettings,
} from "../../types"

export async function retrieveFromLocalStorage(
  key: string,
): Promise<VodSkipperSettings> {
  const settings = await browser.storage.local.get(key)
  return settings[key]
}
export async function retrieveFromSessionStorage(
  key: string,
): Promise<StoredVodSegments> {
  const settings = await browser.storage.session.get(key)
  // ! remove this
  if (Object.keys(settings).length > 0) {
    console.log(
      `Found the settings in session storage!: ${JSON.stringify(settings)}`,
    )
  } else {
    console.log(
      `Didn't find the settings in session storage!: ${JSON.stringify(
        settings,
      )}`,
    )
  }
  return settings[key]
}

export async function setInLocalStorage(
  settings: LocalStorageSettings,
): Promise<void> {
  await browser.storage.local.set(settings)
}
export async function setInSessionStorage(
  settings: SessionStorageSettings,
): Promise<void> {
  await browser.storage.session.set(settings)
}

export async function cacheSegments(
  vodID: string,
  segments: MutedVodSegment[],
): Promise<void> {
  const vodSettings: SessionStorageSettings = {
    vodskipper: {
      [vodID]: segments,
    },
  }
  await setInSessionStorage(vodSettings)
}
