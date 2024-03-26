# README

This repo is dedicated to figuring out the issues encountered when trying to run the tests in the Github Actions CI pipeline.

I'll go ahead and outline some of the things attempted, as well as some ideas I still have.

## Attempts / Initial findings

I initially tried just running the tests directly, without Docker. One of the first things done in almost all the tests is opening the extension popup, using the following wdio commands to select the extension and extract its id:

---

```javascript
    const extensionItem = await this.$(">>> extensions-item")
    const extId = await extensionItem.getAttribute("id")
```

---

The tests would fail because the getAttribute would turn up null, meaning the extension wasn't found, and thus not installed. This only happened in Chrome.

I thought at first that there was some sort of permissions issue on Linux systems that did not allow the extension's installation. Running tests locally on my Windows machine would sometimes give me a UAC popup asking to allow chromedriver to do what it wanted. Instead of dismissing the popup on subsequent runs, I tried both ignoring it and denying it - the tests passed in both cases.

I also thought there might have been some naming issue - maybe there's a chance that the "extensions-item" selector is called something different on Linux? Using a VM confirmed this wasn't the case - as well as the screenshots that I had WDIO take during the test run once the program reached the point where it tried to click on the extension. It just wasn't there.

I tried using both methods for loading extensions:

---

```javascript

const __dirname = url.fileURLToPath(new URL('.', import.meta.url))
export const config = {
    capabilities: [{
        browserName,
        'goog:chromeOptions': {
            // given your wdio.conf.js is in the root directory and your compiled
            // web extension files are located in the `./dist` folder
            args: [`--load-extension=${path.join(__dirname, '..', '..', 'dist')}`]
        }
    }]
}
```

---

```javascript

const __dirname = url.fileURLToPath(new URL('.', import.meta.url))
const extPath = path.join(__dirname, `web-extension-chrome.crx`)
const chromeExtension = (await fs.readFile(extPath)).toString('base64')

export const config = {
    capabilities: [{
        browserName,
        'goog:chromeOptions': {
            extensions: [chromeExtension]
        }
    }]
}

```

---

as outlined by wdio: <https://webdriver.io/docs/extension-testing/web-extensions/>, neither of which worked.

I tried including the flag ```'--disable-extensions-except=${extensionPath}'``` with both methods. Neither worked.

I confirmed that the `/dist` folder, `.crx` and `.xpi` files were all being created by the time the tests attempted to access them. They were all there.

It should also be noted that this was not an issue earlier on in the repo's history. When I was first making pushes without touching the tests or the test.yml, they all passed. I haven't gone back and compared differences from that version of the repo and my current repo - that may provide some insight. However, there were some things that needed to be fixed that I don't fully remember (intangibles like outdated dependencies and whatnot), so going back to see what succeeded in older repo's may be a bit challenging, but overall worth it.

## More attempts with Docker

After some digging I resolved to use Docker. I thought that maybe the Github Actions runner environment introduced some intangible that was messing with wdio's installation process, but I noticed the same issue occur when I had set everything up (without docker-compose at first) and ran the tests - the extension was not installed in Chrome.

I also tried directly installing chrome and chromedriver in the Dockerfile, and using those versions in the test - I thought there might've been some sort mismatch in what was downloaded automatically by wdio during the tests. Did not work.

I did some more digging, and it seemed that the issue is that Docker allows an shm size of 64 MB for Chrome. This is not sufficient for running the browser, or any of the intensive tests that need to be run:

- <https://github.com/orgs/community/discussions/25740#discussioncomment-3249006>
- <https://github.com/puppeteer/puppeteer/blob/main/docs/troubleshooting.md#tips>
- <https://developer.chrome.com/docs/puppeteer/troubleshooting#best_practices_with_docker>

I attempted to increase the shm size as recommended. I did this by passing the --shm-size flag to docker run, and by specifying the shm size in test.yml. Neither worked.

I also attempted using docker-compose to run everything, specifically after seeing someone on Stack Overflow with a similar issue to me say that it worked for them I tried using the --shm-size flag in docker-compose as well, which did not work.

Admittedly though, this solution was attempted in desperation, there was no real reason to do this since multiple images were not being built or managed. Maybe using multiple images would help.

## Some thoughts on how to fix it

One thought I had was to split the services (the mocks server and the actual extension) into separate containers. This might reduce memory usage from one container, but also it would just be a bit of a cleaner implementation overall.

Another thought is to try a different ci solution like Jenkins or some other free solution that allows Chrome the resources it needs to install the extension and run the tests.

Maybe there's also some way to run the browser remotely? I looked into SauceLabs, but that is a paid option.

I also didn't use this sort of setup:

---

```yaml

build:
  context: .
  shm_size: '2gb'

```

---

when building the container in docker-compose.yml. This could help?

There are overall many things I don't know about Docker - I tried plenty of things as band-aid solutions. It's possible a proper configuration is the key to solving this issue. Optimizing the Dockerfile, using other images, including or omitting steps in the Dockerfile or docker-compose, etc could all be plausible solutions that I haven't tried yet.

Some docker images that might help:

- <https://github.com/andrepolischuk/docker-node-chrome-firefox>
- <https://github.com/yukinying/chrome-headless-browser-docker/blob/master/README.md>

Some other links that I skimmed through but might be useful:

- <https://codemify.com/dockerize-wdio>
- <https://github.com/c0b/chrome-in-docker/issues/1>
- <https://codecept.discourse.group/t/docker-with-webdriver-io/447/3>
- <https://stackoverflow.com/questions/49100968/running-webdriverio-in-docker-codeship>
- <https://www.intricatecloud.io/2019/05/running-webdriverio-tests-using-headless-chrome-inside-a-container/>
