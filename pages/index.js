const React = require('react');
const request = require('request-promise-native');

const requestCF = url => request({
  url,
  headers: {
    'X-Auth-Email': process.env.CF_EMAIL,
    'X-Auth-Key': process.env.CF_KEY,
    'Content-Type': 'application/json',
  },
});

const getPercentage = async () => {
  const [cfData, npmData] = await Promise.all([
    requestCF(`https://api.cloudflare.com/client/v4/zones/${process.env.CF_ZONE}/analytics/dashboard?since=-10080&continuous=true`),
    request('https://api.npmjs.org/downloads/point/last-week')
  ]).then(result => result.map(item => JSON.parse(item)));

  const yarnDownloads = cfData.result.totals.requests.content_type['octet-stream'];
  const npmDownloads = npmData.downloads;
  return Math.round(yarnDownloads / npmDownloads * 10000) / 100;
};

export default class extends React.Component {
  static async getInitialProps({req}) {
    return {percentage: req ? await getPercentage() : 0};
  }
  render() {
    return <div className="parent">
      <div className="child">{this.props.percentage}%</div>
      <style jsx>{`
        div.parent {
          align-items: center;
          bottom: 0;
          display: flex;
          justify-content: center;
          left: 0;
          position: absolute;
          right: 0;
          top: 0;
        }
        div.child {
          color: #fff;
          font-family: -apple-system, system-ui, system-ui, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          font-size: 3.8em;
          font-weight: 700;
          text-shadow: 5px 5px #1476A2;
        }
      `}</style>
      <style global jsx>{`
        body {
          background: #2188b6;
        }
      `}</style>
    </div>
  }
}
