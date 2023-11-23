import { config } from "dotenv"
import { MutedVodSegment } from "../types"
import { ApiClient, HelixVideo } from "@twurple/api/lib"
import { RefreshingAuthProvider } from "@twurple/auth/lib"
import { TwurpleError, isTwurpleError } from "./TwurpleError"
import { HelixVideoMutedSegmentData } from "@twurple/api/lib/interfaces/endpoints/video.external"

config()

let authProvider: RefreshingAuthProvider

// export auth provider from different file
// import provider and export api client from diff file
// this file will just make the api request.

const userId = process.env.USER_ID as string
const clientId = process.env.CLIENT_ID as string
const clientSecret = process.env.CLIENT_SECRET as string

const accessTokenString = process.env.ACCESS_TOKEN as string
const refreshTokenString = process.env.REFRESH_TOKEN as string

try {
  authProvider = new RefreshingAuthProvider({ clientId, clientSecret })
} catch (error) {
  console.error(error)
  throw error
}

export const apiClient = new ApiClient({ authProvider })

authProvider.addUser(userId, {
  accessToken: accessTokenString,
  refreshToken: refreshTokenString,
  expiresIn: 0,
  obtainmentTimestamp: 0,
})

/**
 * Formats the muted segment data retrieved from
 * Twitch. Adds an endingOffset property.
 *
 * @param mutedSegments The muted segments array
 * received from Twitch.
 */
function formatMutedSegmentsData(
  mutedSegments: HelixVideoMutedSegmentData[],
): MutedVodSegment[] {
  // eslint-disable-next-line @typescript-eslint/require-array-sort-compare
  return mutedSegments
    .map(segment => {
      const formattedSegment: MutedVodSegment = {
        duration: segment.duration,
        startingOffset: segment.offset,
        endingOffset: segment.offset + segment.duration,
      }
      return formattedSegment
    })
    .sort()
}

/**
 * Given a vodID, attempt to retrieve the VOD's muted segments data.
 *
 *
 * @param vodID String of the vod's id.
 * @returns A formatted array of all the muted segments in the vod w/
 * a property denoting when the segment ends. Returns undefined if the
 * vod has no muted segment data. This could be because the vod could not
 * be found, or there could simply be no data for the given vod.
 */
export async function getMutedVodSegmentsFromTwitch(
  vodID: string,
): Promise<MutedVodSegment[] | string | undefined> {
  console.debug(`Fetching muted segments for ${vodID}`)

  let vod: HelixVideo | null
  let mutedSegments: HelixVideoMutedSegmentData[] | undefined

  try {
    vod = await apiClient.videos.getVideoById(vodID)
    mutedSegments = vod?.mutedSegmentData
  } catch (error: unknown) {
    if (isTwurpleError(error)) {
      const errorObj: TwurpleError = JSON.parse(error.body)
      if (errorObj.status === 404) {
        return undefined
      } else if (errorObj.status === 401) {
        return "Token Expired."
      }
      console.error(`Twurple Error: ${error.body}`)
    } else {
      console.error(`Error: ${error}`)
      throw error
    }
  }
}
