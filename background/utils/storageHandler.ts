import browser from "webextension-polyfill"

export async function retrieveFromStorage(
  key: string,
): Promise<LocalStorageSettings> {
  const settings = await browser.storage.local.get(key)
  return settings[key]
}

export async function setInStorage(
  settings: LocalStorageSettings,
): Promise<void> {
  await browser.storage.local.set(settings)
}

/**
 * What's set in local storage.
 * Vodskipper property is used as the
 * local storage item key.
 */
export interface LocalStorageSettings {
  vodskipper: {
    enabled: boolean
  }
}
