const Botkit = require('botkit');
const request = require('request');

const API_URI = 'https://api.coinmarketcap.com/v1/ticker/';
const WEB_URI = 'https://coinmarketcap.com/currencies/';

if (!process.env.SLACK_TOKEN) {
  console.log('Error: Specify token in environment');
  process.exit(1);
}

const controller = Botkit.slackbot({
  debug: false
});

controller.spawn({ token: process.env.SLACK_TOKEN })
  .startRTM((err) => {
    if (err) {
      throw new Error(err);
    }
  });

const currencies = {
  btc: 'bitcoin',
  ltc: 'litecoin',
  bch: 'bitcoin-cash',
  dog: 'dogecoin',
  mona: 'monacoin',
  eth: 'ethereum',
  xem: 'nem',
  xrp: 'ripple',
  omg: 'omisego',
  xvg: 'verge',
  xsh: 'shield-xsh',
  xp: 'xp',
  stc: 'santa-coin',
  xlm: 'stellar',
  usdt: 'tether'
};

const numberFormat = (value) => {
  const arr = value.split('.');
  arr[0] = parseInt(arr[0], 10).toLocaleString();
  return arr.join('.');
};

controller.hears(
  '^(' + Object.keys(currencies).join('|') + ')$',
  ['direct_message', 'direct_mention', 'mention'],
  (bot, message) => {
    const symbol = (message.match[1] || '').toLowerCase();
    request.get({
      uri: API_URI + currencies[symbol],
      headers: { 'Content-type': 'application/json' },
      qs: { convert: 'JPY' },
      json: true
    },
    (err, req, data) => {
      const info = data[0];
      let res = '';
      res += info.symbol + ' is ¥' + numberFormat(info.price_jpy) + ' JPY (1h: ' + info.percent_change_1h + '% / 24h: ' + info.percent_change_24h + '%)';
      if (symbol != 'btc') {
        res += ' and ' + numberFormat(info.price_btc) + ' BTC';
      }
      res += '\n' + WEB_URI + currencies[symbol];
      bot.reply(message, '```' + res + '```');
    });
  }
);
