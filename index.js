const Botkit = require('botkit');
const fetch = require('node-fetch');
const mathjs = require('mathjs')

const API_URI = 'https://api.coinmarketcap.com/v1/ticker/';
const WEB_URI = 'https://coinmarketcap.com/currencies/';

if (!process.env.SLACK_TOKEN) {
  console.log('Error: Specify token in environment');
  process.exit(1);
}

const numberFormat = (value) => {
  const arr = value.split('.');
  arr[0] = parseInt(arr[0], 10).toLocaleString();
  return arr.join('.');
};

const currencies = {};
async function updateCurrencies() {
  const res = await fetch(API_URI + '?limit=10000').then(res => res.json());
  res.forEach(ticker => {
    currencies[ticker.symbol.toLowerCase()] = ticker.id;
  })
}

async function fetchTicker(symbolOrId) {
  if (!symbolOrId) {
    throw new Error('Not symbol or id');
  }

  symbolOrId = symbolOrId.toLowerCase()

  const res = await fetch(API_URI + '?convert=JPY&limit=10000').then(res => res.json());
  const ticker = res.filter(res => res.id.toLowerCase() === symbolOrId || res.symbol.toLowerCase() === symbolOrId)[0];
  if (!ticker) {
    throw new Error('Not found ' + symbolOrId);
  }
  return ticker;
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

updateCurrencies().then(() => {
  controller.hears(
    '^(' + Object.keys(currencies).join('|') + ') ?(.+)?$',
    ['direct_message', 'direct_mention'],
    (bot, message) => {
      const symbolOrId = message.match[1];
      const amount = message.match[2] || 1;
      return fetchTicker(symbolOrId)
        .then(ticker => {
          let res = '';

          const priceJpy = '' + mathjs.eval(ticker.price_jpy + ' * ' + amount);
          res += ticker.symbol + ' is ¥' + numberFormat(priceJpy) + ' JPY (1h: ' + ticker.percent_change_1h + '% / 24h: ' + ticker.percent_change_24h + '%)';

          if (ticker.symbol != 'BTC') {
            const priceBtc = '' + mathjs.eval(ticker.price_btc + ' * ' + amount);
            res += ' and ' + numberFormat(priceBtc) + ' BTC';
          }

          res += '\n' + WEB_URI + currencies[ticker.symbol.toLowerCase()];
          bot.reply(message, '```' + res + '```');
        })
        .catch(err => {
          bot.reply(message, err.message);
          console.error('fetchTicker', err);
        });
    }
  );
}).catch(err => console.error('updateCurrensies', err));

controller.hears(
  '^math (.+)$',
  ['direct_message', 'direct_mention'],
  (bot, message) => {
    try {
      const result = mathjs.eval(message.match[1]);
      bot.reply(message, '' + result);
    } catch (e) {
    }
  }
);
