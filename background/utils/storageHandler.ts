import browser from "webextension-polyfill"

// TODO: Type the settings object. Type the vodskipper object.
export async function retrieveFromStorage(key: string) {
  const settings = await browser.storage.local.get(key)
  return settings[key]
}

export async function setInStorage(settings: test) {
  await browser.storage.local.set(settings)
}

/**
 * What's set in local storage.
 * Name would be vodskipper. any other
 * extension settings are stored as properties
 * of name.
 */
interface test {
  name: {
    enabled: boolean
  }
}
