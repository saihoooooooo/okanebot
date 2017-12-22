const Botkit = require('botkit');
const request = require('request');

const URL = 'https://api.coinmarketcap.com/v1/ticker/';

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
  usdt: 'tether'
};

const numberFormat = (value) => {
  return parseFloat(value).toLocaleString();
};

controller.hears(
  '^(' + Object.keys(currencies).join('|') + ')$',
  ['direct_message', 'direct_mention', 'mention'],
  (bot, message) => {
    const symbol = message.match[1];
    request.get({
      uri: URL + currencies[symbol],
      headers: { 'Content-type': 'application/json' },
      qs: { convert: 'JPY' },
      json: true
    },
    (err, req, data) => {
      const info = data[0];
      let res = [];
      res.push(info.symbol + ' is ¥' + numberFormat(info.price_jpy) + ' JPY (' + info.percent_change_24h + '%)');
      if (symbol != 'btc') {
        res.push(' and ' + numberFormat(info.price_btc) + ' BTC');
      }
      bot.reply(message, res.join(''));
    });
  }
);
