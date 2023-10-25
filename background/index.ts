import browser from "webextension-polyfill";
import { ApiClient } from "@twurple/api/lib";
import { ExtensionAuthProvider } from "@twurple/auth-ext/lib";
import { HelixVideoMutedSegmentData } from "@twurple/api/lib/interfaces/endpoints/video.external";
import { Vod, MutedVodSegment } from "../types";

function getApi(clientID: string | undefined): ApiClient | undefined {
  if (clientID !== undefined) {
    const authProvider = new ExtensionAuthProvider(clientID);
    return new ApiClient({ authProvider })
  }
}

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
 * Given a vodID, attempt to retrieve the VOD's muted segments data.
 * We then format that data by adding the endingOffset property 
 * for skipping. We also sort the array to make sure the muted
 * segments are in order.
*/

function formatMutedSegmentsData(vod: Vod, mutedSegments: HelixVideoMutedSegmentData[]): MutedVodSegment[] {
  return mutedSegments
    .map(segment => {
    const formattedSegment: MutedVodSegment = {
      id: vod?.id,
      title: vod?.title,
      duration: segment.duration,
      startingOffset: segment.offset,
      endingOffset: segment.offset + segment.duration
    }
    return formattedSegment;
  })
    .sort()
}

async function getMutedVodSegmentsFromTwitch(vodID: string): Promise<MutedVodSegment[] | undefined> {
  const api = getApi(process.env.clientID);
  
  if (!api) {
    throw new Error("Could not create api client.");
  }

  const vod = await api.videos.getVideoById(vodID)
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
  try {
    return getMutedVodSegmentsFromTwitch(message.vodID);
  } catch (error) {
    return error
  }
})
