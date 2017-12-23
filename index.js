const Botkit = require('botkit');
const fetch = require('node-fetch')

const API_URI = 'https://api.coinmarketcap.com/v1/ticker/';
const WEB_URI = 'https://coinmarketcap.com/currencies/';

if (!process.env.SLACK_TOKEN) {
  console.log('Error: Specify token in environment');
  process.exit(1);
}

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

async function updateCurrencies() {
  const res = await fetch(API_URI).then(res => res.json());
  res.forEach(ticker => {
    currencies[ticker.symbol.toLowerCase()] = symbol.id;
  })
}

async function fetchTicker(symbolOrId) {
  if (!symbolOrId) {
    throw new Error('Not symbol or id');
  }

  symbolOrId = symbolOrId.toLowerCase()

  const res = await fetch(API_URI + '?convert=JPY').then(res => res.json());
  const ticker = res.filter(res => res.id.toLowerCase() === symbolOrId || res.symbol.toLowerCase() === symbolOrId)[0];
  if (!ticker) {
    throw new Error('Not found ' + symbolOrId);
  }
  return ticker;
}

const controller = Botkit.slackbot({
  debug: false
});

updateCurrencies().then(() => {
  controller.spawn({ token: process.env.SLACK_TOKEN })
    .startRTM((err) => {
      if (err) {
        throw new Error(err);
      }
    });

  controller.hears(
    '^(' + Object.keys(currencies).join('|') + ')$',
    ['direct_message', 'direct_mention', 'mention'],
    (bot, message) => {
      const symbolOrId = message.match[1];
      return fetchTicker(symbolOrId)
        .then(ticker => {
          let res = '';
          res += ticker.symbol + ' is ¥' + numberFormat(ticker.price_jpy) + ' JPY (1h: ' + ticker.percent_change_1h + '% / 24h: ' + ticker.percent_change_24h + '%)';
          if (symbol != 'btc') {
            res += ' and ' + numberFormat(ticker.price_btc) + ' BTC';
          }
          res += '\n' + WEB_URI + currencies[symbol];
          bot.reply(message, '```' + res + '```');
        })
        .catch(err => {
          bot.reply(message, err.message);
          console.error('fetchTicker', err);
        });
    }
  );
}).catch(err => console.error('updateCurrensies', err))

