import browser from "webextension-polyfill";
import { HelixVideo } from "@twurple/api";
import { ApiClient } from "@twurple/api/lib";
import { ExtensionAuthProvider } from "@twurple/auth-ext/lib";
import { HelixVideoMutedSegmentData, HelixVideoData, } from "@twurple/api/lib/interfaces/endpoints/video.external";

let clientId;
const authProvider = new ExtensionAuthProvider(clientId);
const api = new ApiClient({ authProvider });

type Message = {
  action: 'fetch',
  value: null
}

type ResponseCallback = <T>(data: T) => void

async function handleMessage({action, value}: Message, response: ResponseCallback) {
  if (action === 'fetch') {
    const result = await fetch('https://meowfacts.herokuapp.com/');

    const { data } = await result.json();

    response({ message: 'success', data });
  } else {
    response({data: null, error: 'Unknown action'});
  }
}

/**
 * Given a vodId, attempt to retrieve the VOD's muted segments data.
 * We then format that data by adding the endingOffset property 
 * for skipping. We also sort the array to make sure the muted
 * segments are in order.
*/

type MutedVodSegment = {
  id: string | undefined,
  title: string | undefined,
  duration: number,
  endingOffset: number,
  startingOffset: number,
}

type Vod = HelixVideo | null

function formatMutedSegmentsData(video: Vod, mutedSegments: HelixVideoMutedSegmentData[]): MutedVodSegment[] {
  return mutedSegments
    .map(segment => {
    const formattedSegment: MutedVodSegment = {
      id: video?.id,
      title: video?.title,
      duration: segment.duration,
      startingOffset: segment.offset,
      endingOffset: segment.offset + segment.duration
    }
    return formattedSegment;
  })
    .sort()
}

async function getMutedVodSegmentsFromTwitch(vodId: string): Promise<MutedVodSegment[] | undefined> {
  const vod = await api.videos.getVideoById(vodId)
  const mutedSegments = vod?.mutedSegmentData

  // Checking for undefined here also covers if the vod
  // variable is null. Can return undefined regardless 
  // as there's no data to process.

  return mutedSegments === undefined 
    ? undefined 
    : formatMutedSegmentsData(vod, mutedSegments);
}

// @ts-ignore
browser.runtime.onMessage.addListener((msg, sender, response) => {
  handleMessage(msg, response);
  return true;
});

browser.runtime.onMessage.addListener((message) => {
  return getMutedVodSegmentsFromTwitch(message.vodId);
})
