import routes from "./mocks/routes/index.js"
import { SevereServiceError } from "webdriverio"
import collections from "./mocks/collections.js"
import type { Services, Frameworks } from "@wdio/types"
import { createServer, type Server } from "mocks-server-lite"

/**
 * The names of collections for MocksServer
 */
enum MocksCollections {
  SEGMENTS = "segments",
  TIMEOUT = "server_timeout",
  FAILURE = "server_failure",
}

type Collections = (typeof MocksCollections)[keyof typeof MocksCollections]

class MocksWorkerService implements Services.ServiceInstance {
  private server: Server | null = null
  private readonly mocksCollectionsUrl =
    "http://localhost:3100/__set-collection"

  private getServerInstance(): void {
    try {
      this.server = createServer({
        selected: MocksCollections.SEGMENTS,
        port: 3100,
      })
      void this.server.start({ routes, collections })
    } catch (error) {
      if (error instanceof Error) {
        throw new SevereServiceError(
          `some error happened while trying to create the server instance: ${error.message}\n`
        )
      }
    }
  }

  onPrepare(): void {
    this.getServerInstance()
  }

  async beforeTest(test: Frameworks.Test): Promise<void> {
    const collectionName = test.title
      .split("-")[0]
      .trim()
      .toLowerCase() as Collections

    await this.switchCollection(collectionName)
  }

  /**
   * Switches the mocks collection.
   */
  private async switchCollection(collection: Collections): Promise<void> {
    const response = await fetch(this.mocksCollectionsUrl, {
      method: "POST",
      body: JSON.stringify({ collection }),
      headers: { "Content-Type": "application/json" },
    })
    if (!response.ok) {
      throw new SevereServiceError(
        `Error while trying to switch collection: ${await response.text()}`
      )
    }
  }
}

export default MocksWorkerService
