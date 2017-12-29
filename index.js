const Botkit = require('botkit')
const fetch = require('node-fetch')
const mathjs = require('mathjs')

const API_URI = 'https://api.coinmarketcap.com/v1/ticker/'
const WEB_URI = 'https://coinmarketcap.com/currencies/'

if (!process.env.SLACK_TOKEN) {
  console.log('Error: Specify token in environment')
  process.exit(1)
}

const numberFormat = (value, trancates = false) => {
  const arr = value.split('.')
  arr[0] = parseInt(arr[0], 10).toLocaleString()
  return trancates ? arr[0] : arr.join('.')
}

const currencies = {}
async function updateCurrencies () {
  const res = await fetch(API_URI + '?limit=10000').then(res => res.json())
  res.forEach(ticker => {
    currencies[ticker.symbol.toLowerCase()] = ticker.id
  })
}

async function fetchTicker (symbolOrId) {
  if (!symbolOrId) {
    throw new Error('Not symbol or id')
  }

  symbolOrId = symbolOrId.toLowerCase()
  let id = currencies[symbolOrId]
  if (!id) {
    for (const val of Object.keys(currencies).map(key => currencies[key])) {
      if (symbolOrId !== val) {
        continue
      }
      id = val
      break
    }
  }

  const ticker = await fetch(`${API_URI}/${id}/?convert=JPY`)
    .then(res => res.json())
    .then(res => {
      if (res.error) {
        throw new Error(res.error)
      }
      return res[0]
    })
  return ticker
}

const controller = Botkit.slackbot({
  debug: false
})

controller.spawn({ token: process.env.SLACK_TOKEN })
  .startRTM((err) => {
    if (err) {
      throw new Error(err)
    }
  })

const handler = (bot, message) => {
  const { text } = message
  const [symbolOrId, tmpAmount] = text.split(' ')
  return fetchTicker(symbolOrId)
    .then(ticker => {
      const amount = parseFloat(tmpAmount) || 1.0
      let res = amount !== 1.0 ? amount + ' ' : ''

      const math = (a, b) => mathjs.eval(a + ' * ' + b)
      const priceJpy = '' + math(ticker.price_jpy, amount)
      res += ticker.symbol + ' is ¥' + numberFormat(priceJpy) + ' JPY (1h: ' + ticker.percent_change_1h + '% / 24h: ' + ticker.percent_change_24h + '% / 24hvol: ' + numberFormat(ticker['24h_volume_jpy'], true) + ' JPY)'

      if (ticker.symbol !== 'BTC') {
        const priceBtc = '' + math(ticker.price_btc, amount)
        res += ' and ' + numberFormat(priceBtc) + ' BTC'
      }

      res += '\n' + WEB_URI + currencies[ticker.symbol.toLowerCase()]
      bot.reply(message, '```' + res + '```')
    })
    .catch(err => {
      bot.reply(message, err.message)
      console.error('fetchTicker', err)
    })
}

updateCurrencies().then(() => {
  controller.on('direct_message', handler)
  controller.on('direct_mention', handler)
}).catch(err => console.error('updateCurrensies', err))

controller.hears(
  '^math (.+)$',
  ['direct_message', 'direct_mention'],
  (bot, message) => {
    try {
      const result = mathjs.eval(message.match[1])
      bot.reply(message, '' + result)
    } catch (e) {
    }
  }
)
