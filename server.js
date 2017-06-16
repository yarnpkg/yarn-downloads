const express = require('express');
const request = require('request-promise-native');

const app = express();
app.use(express.static('static'));

const requestCF = url => request({
  url,
  headers: {
    'X-Auth-Email': process.env.CF_EMAIL,
    'X-Auth-Key': process.env.CF_KEY,
    'Content-Type': 'application/json',
  },
});

const cachePromise = (producer, interval) => {
  let lastUpdatedAt;
  let lastUpdatedPromise;

  return function() {
    const now = Date.now();
    const hasExpired = !lastUpdatedAt || lastUpdatedAt + interval < now;

    if (hasExpired) {
      lastUpdatedAt = now;
      return lastUpdatedPromise = producer().catch(err => {
        lastUpdatedAt = null;
        lastUpdatedPromise = null;
        throw err;
      });
    } else {
      return lastUpdatedPromise;
    }
  };
};

const getStats = cachePromise(async () => {
  console.log('Fetching CF stats...');

  const [cfData, npmData] = await Promise.all([
    requestCF(`https://api.cloudflare.com/client/v4/zones/${process.env.CF_ZONE}/analytics/dashboard?since=-43200&continuous=true`),
    request('https://api.npmjs.org/downloads/point/last-month')
  ]).then(result => result.map(item => JSON.parse(item)));

  const yarnDownloads = cfData.result.totals.requests.content_type['octet-stream'];
  const npmDownloads = npmData.downloads;
  return {
    cfStats: cfData.result,
    yarnDownloads: yarnDownloads,
    percentage: Math.round(yarnDownloads / npmDownloads * 10000) / 100,
  };
}, 60 * 1000 * 60);

app.set('view engine', 'ejs');

app.get('/', (req, res) => {
  getStats().then(data => {
    res.render('index', data);
  }, () => {
    res.end('Server error');
  });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Listening on http://localhost:${port}`)
});
