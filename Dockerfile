FROM node:20

RUN corepack enable

RUN apt-get install -y gnupg wget curl unzip --no-install-recommends; \
  wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | \
  gpg --no-default-keyring --keyring gnupg-ring:/etc/apt/trusted.gpg.d/google.gpg --import; \
  chmod 644 /etc/apt/trusted.gpg.d/google.gpg; \
  echo "deb https://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list; \
  apt-get update -y; \
  apt-get install -y google-chrome-stable;

RUN CHROMEDRIVER_VERSION=$(curl https://googlechromelabs.github.io/chrome-for-testing/LATEST_RELEASE_STABLE); \
  wget -N https://storage.googleapis.com/chrome-for-testing-public/$CHROMEDRIVER_VERSION/linux64/chromedriver-linux64.zip -P ~/ && \
  unzip ~/chromedriver-linux64.zip -d ~/ && \
  rm ~/chromedriver-linux64.zip && \
  mv -f ~/chromedriver-linux64/chromedriver /usr/bin/chromedriver && \
  rm -rf ~/chromedriver-linux64 

ENV CHROME_BINARY=/usr/bin/google-chrome

ENV DRIVER_BINARY=/usr/bin/chromedriver

COPY package.json package-lock.json ./

RUN npm install

COPY . .

RUN npm run bundle-dev

CMD [ "npm", "run", "test-ci" ]
