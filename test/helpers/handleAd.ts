async function handleAd() {
  const ad = await $("[aria-label=Ad]")
  try {
    // Check for ad while page is loading
    await ad.waitForExist({
      timeout: 10000,
      interval: 1000,
      timeoutMsg: "No ad.",
    })
    // If it's found, give some time for it to finish
    await ad.waitForExist({
      reverse: true,
      timeout: 40000,
      interval: 2000,
      timeoutMsg: "Ad too long.",
    })
  } catch (error) {
    // only throwing if the ad is too long,
    // or some other error occurs.
    if (error.message !== "No ad.") {
      throw error
    }
  }
}

export default handleAd
