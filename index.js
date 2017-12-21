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
  xp: 'xp'
};

controller.hears(
  '^jpy (.+)$',
  ['direct_message','direct_mention','mention'],
  (bot, message) => {
    const currency = message.match[1];
    if (typeof currencies[currency] == 'undefined') {
      bot.reply(message, 'Could not find ' + currency.toUpperCase());
      return;
    }
    request.get({
      uri: URL + currencies[currency],
      headers: { 'Content-type': 'application/json' },
      qs: { convert: 'JPY' },
      json: true
    },
    (err, req, data) => {
      const info = data[0];
      let strings = [];
      strings.push(info.symbol + ' is ¥' + info.price_jpy + ' JPY (' + info.percent_change_24h + '%)');
      bot.reply(message, strings.join('\n'));
    });
  }
);
