import Head from 'next/head';

const humanize = require('humanize-number');
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

const getStats = async () => {
  const [cfData, npmData] = await Promise.all([
    requestCF(`https://api.cloudflare.com/client/v4/zones/${process.env.CF_ZONE}/analytics/dashboard?since=-43200&continuous=true`),
    request('https://api.npmjs.org/downloads/point/last-month')
  ]).then(result => result.map(item => JSON.parse(item)));

  const yarnDownloads = cfData.result.totals.requests.content_type['octet-stream'];
  const npmDownloads = npmData.downloads;
  return {
    yarnDownloads,
    percentage: Math.round(yarnDownloads / npmDownloads * 10000) / 100,
  };
};

export default class extends React.Component {
  static async getInitialProps({req}) {
    return req ? await getStats() : {
      percentage: 0,
      yarnDownloads: 0,
    };
  }

  render() {
    return <div className="parent">
      <Head>
        <title>Yarn Stats</title>
      </Head>
      <h1>
        <img className='logo' src='/static/logo.png' />
        <span className='sep'>&#183;</span>
        Last month
      </h1>
      <div className="child"><strong>{humanize(this.props.yarnDownloads)}</strong> package downloads</div>
      <div className="child"><strong>{this.props.percentage}%</strong> of npm downloads</div>
      <style jsx>{`
        h1 {
          line-height: 200px;
          font-size: 60px;
          margin: 0;
          margin-bottom: 40px;
        }

        h1 .sep {
          margin: 0 30px;
        }

        img.logo {
          height: 200px;
          vertical-align: middle;
        }

        div.parent {
          text-align: center;
          bottom: 0;
          left: 0;
          position: absolute;
          right: 0;
          top: 50%;
          height: 420px;
          margin-top: -210px;
        }

        div.child {
          font-size: 50px;
          line-height: 90px;
          letter-spacing: 1.2px;
        }

        strong {
          font-weight: 700;
        }
      `}</style>
      <style global jsx>{`
        body {
          color: #fff;
          text-shadow: 5px 5px #1476A2;
          font-family: -apple-system, system-ui, system-ui, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          background: #2188b6;
        }
      `}</style>
    </div>
  }
}
