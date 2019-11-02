const _ = require('lodash')
const Twit = require('twit')
const emojiRegex = require('emoji-regex/text.js')
const wordfilter = require('wordfilter')
const TwitterPic = require('twitter-pic')
const request = require('request')
const rp = require('request-promise')
const pos = require('pos')
const TweetModelObj = require('./TweetModel')

const t = new Twit({
    consumer_key: process.env.DESIREBOT_TWIT_CONSUMER_KEY,
    consumer_secret: process.env.DESIREBOT_TWIT_CONSUMER_SECRET,
    access_token: process.env.DESIREBOT_TWIT_ACCESS_TOKEN,
    access_token_secret: process.env.DESIREBOT_TWIT_ACCESS_TOKEN_SECRET
});

const tp = new TwitterPic({
	consumer_key: process.env.DESIREBOT_TWIT_CONSUMER_KEY,
	consumer_secret: process.env.DESIREBOT_TWIT_CONSUMER_SECRET,
	token: process.env.DESIREBOT_TWIT_ACCESS_TOKEN,
	token_secret: process.env.DESIREBOT_TWIT_ACCESS_TOKEN_SECRET
});

const flickrPrefix = "https://api.flickr.com/services/rest/?"
const flickrKey = process.env.DESIREBOT_FLICKR_KEY
const twitterQuery = {
  q: '\"i%20just%20want\"',
  count: 40,
  result_type: 'recent',
  lang: 'en',
  include_entities: true,
}

wordfilter.addWords(['nigg', 'n!gg', 'sjw', 'social justice', 'pussies', 'semen']);

async function desire() {
  const rawTweetStatuses = await getRawTweetStatuses()
  const tweetGroupFilteredByEntities = filterByEntities(rawTweetStatuses)
  const tweetGroupConverted = convertTweets(tweetGroupFilteredByEntities)

  const tweetGroupFilteredByEmoji = filterByEmoji(tweetGroupConverted)
  const tweetGroupFilteredByWordfilter = filterByWordfilter(tweetGroupFilteredByEmoji)
  const tweetGroupFilteredByLyrics = filterByLyrics(tweetGroupFilteredByWordfilter)
  const tweetGroupFilteredByPattern = filterByPattern(tweetGroupFilteredByLyrics)
  const tweetGroupWithWords = extractWordsFromTweet(tweetGroupFilteredByPattern)
  const tweetGroupWithNouns = extractNounsFromWords(tweetGroupWithWords)

  const tweetGroupWithFlickrIDs = await getAllFlickrIDTitle(tweetGroupWithNouns)
  const tweetGroupWithFlickrURLs = await getAllFlickrURLs(tweetGroupWithFlickrIDs)
  const tweetGroupScored = scoreTweets(tweetGroupWithFlickrURLs)

  await createTweet(tweetGroupScored)
  rateLimitCheck()
}

function getRawTweetStatuses() {
  return t.get('search/tweets', twitterQuery)
    .then((result: twitterSearchResults) => {
      const resultData = result.data
      const rawTweetStatuses: object[] = resultData.statuses

      if(rawTweetStatuses.length) {
        return rawTweetStatuses
      } else {
        return Promise.reject(new Error('No statuses found'))
      }
    })
    .catch((err: Error) => {
      return Promise.reject(err)
    })
}

function filterByEntities(tweetStatuses: rawTweetData[] = []) {
  const filteredTweets = tweetStatuses.filter((tweet: rawTweetData) => {
    const entities = tweet.entities || {}
    const hasHashtags = (entities.hashtags || []).length > 0
    const hasSymbols = (entities.symbols || []).length > 0
    const hasMentions = (entities.user_mentions || []).length > 0
    const hasURLs = (entities.urls || []).length > 0

    return !hasHashtags && !hasSymbols && !hasMentions && !hasURLs
  })

  return filteredTweets
}

function convertTweets(tweetStatuses: rawTweetData[] = []) {
  return tweetStatuses.map((status: object) => new TweetModelObj(status))
}

function filterByEmoji(tweetModels: TweetModel[] = []) {
  const emoRegex = emojiRegex()

  const filteredTweets = tweetModels.filter((model: TweetModel) => {
    const text = model.text.lowercase
    const hasEmoji = emoRegex.test(text)

    return !hasEmoji
  })

  return filteredTweets
}

function filterByWordfilter(tweetModels: TweetModel[] = []) {
  const filteredTweets = tweetModels.filter((model: TweetModel) => {
    const text = model.text.lowercase
    const blockedTweet = wordfilter.blacklisted(text)

    return !blockedTweet
  })

  return filteredTweets
}

function filterByLyrics(tweetModels: TweetModel[] = []) {
  const filteredTweets = tweetModels.filter((model: TweetModel) => {
    const text = model.text.lowercase
    const isDrake = text.includes('just want some head')
    const isPeewee = text.includes('just want the money')
    const isGooGooDolls = text.includes('just want you to know who i am')

    return !isDrake && !isPeewee && !isGooGooDolls
  })

  return filteredTweets
}

function filterByPattern(tweetModels: TweetModel[] = []) {
  const filteredTweets = tweetModels.filter((model: TweetModel) => {
    const text = model.text.lowercase
    const pattern = /i\ just\ want/;

    return pattern.test(text)
  })

  return filteredTweets
}

function extractWordsFromTweet(tweetModels: TweetModel[] = []) {
  const excludeNonAlpha = /[^a-zA-Z]+/;
  const excludeURLs = /https?:\/\/[-a-zA-Z0-9@:%_\+.~#?&\/=]+/g;
  const excludeShortAlpha = /\b[a-z][a-z]?\b/g;
  const excludeHandles = /@[a-z0-9_-]+/g;
  const excludeWords = ['just', 'want', 'don', 'bed', 'sleep']
  const excludePatterns = [excludeURLs, excludeShortAlpha, excludeHandles, ...excludeWords];

  const extracted = tweetModels.map((model: TweetModel) => {
    let replacedText = model.text.lowercase

    _.each(excludePatterns, (pattern: string) => replacedText = replacedText.replace(pattern, ''))

    const words: string[] = replacedText.split(excludeNonAlpha)
    const filteredWords: string[] = words.filter(word => word !== '')
    const uniqueWords: Set<string>  = new Set(filteredWords)
    const allUniqueWords = Array.from(uniqueWords)

    model.text.words = allUniqueWords
    return model
  })

  return extracted
}

function extractNounsFromWords(tweetModels: TweetModel[] = []) {
  const extracted = tweetModels.filter((model: TweetModel) => {
    const wordSource = (model.text.words || []).toString()
    const allowedTags = ['NN', 'NNS', 'VB', 'VBG', 'VBP', 'VBZ']
    const lexSource = new pos.Lexer().lex(wordSource)
    const tagger = new pos.Tagger()
    const taggedWords = tagger.tag(lexSource)

    const nounsOrVerbs: string[] = []
    taggedWords.map((word: string[]) => {
      const wordTag = word[1]
      if(allowedTags.includes(wordTag)) {
        nounsOrVerbs.push(word[0])
      }
    })

    model.text.nounsVerbs = nounsOrVerbs
    return model.text.nounsVerbs.length > 0
  })

  return extracted
}

function getFlickrIDTitle(model: TweetModel) {
  const searchString = (model.text.nounsVerbs || []).join('%20')
  const flickrSearchOptions = {
    method: "flickr.photos.search",
    format: "json"
  }
  const flickrURL = flickrPrefix
    + "method=" + flickrSearchOptions.method
    + "&api_key=" + flickrKey
    + "&safe_search=2"
    + "&content_type=4"
    + "&format=json"
    + "&sort=relevance"
    + "&content_type=4"
    + "&page=10"
    + "&nojsoncallback=1"
    + "&text=" + searchString

  return rp.get({uri: flickrURL, json: true})
    .then((data: flickrPhotoSearchResults) => {
      let flickrID = ''
      let title = ''

      const photos = (data.photos || {}).photo
      if(photos.length) {
        const randomPos = Math.floor(Math.random() * photos.length)

        const randomPhoto: {id: string, title: string} = photos[randomPos]
        flickrID = randomPhoto.id
        title = randomPhoto.title
      }

      model.flickr.id = flickrID
      model.flickr.title = title
      return model
    })
    .catch((err: Error) => {
      return Promise.reject(err)
    })
}

async function getAllFlickrIDTitle(tweetModels: TweetModel[] = []) {
  const promises = tweetModels.map((tweet) => {
    return getFlickrIDTitle(tweet)
  })

  const tweetGroup = await Promise.all(promises)

  const tweetGroupFiltered = tweetGroup.filter(tweet => {
    const hasID = tweet.flickr.id
    const hasTitle = tweet.flickr.title

    return hasID && hasTitle
  })

  return tweetGroupFiltered
}

function getFlickrURL(model: TweetModel) {
  let url = ''

  const id = model.flickr.id
  const flickrGetSizesOptions = {
    method: "flickr.photos.getSizes",
    format: "json"
  }
  const flickrURL = flickrPrefix
    + "method=" + flickrGetSizesOptions.method
    + "&photo_id=" + id
    + "&api_key=" + flickrKey
    + "&format=json"
    + "&nojsoncallback=1";

  return rp.get({ uri: flickrURL, json: true })
    .then((data: flickrPhotoSizeResults) => {
      const allSizes = data.sizes.size

      const possibleSizes = allSizes.filter(sizeData => {
        return sizeData.width >= 500 && sizeData.width < 1060
      })

      if(possibleSizes.length) {
        const largestSize = possibleSizes[possibleSizes.length - 1]
        const largestSizeURL = largestSize.source
        url = largestSizeURL
      }

      model.flickr.url = url
      return model
    })
    .catch((err: Error) => {
      return Promise.reject(err)
    })
}

async function getAllFlickrURLs(tweetModels: TweetModel[] = []) {
  const promises = tweetModels.map((tweet) => {
    return getFlickrURL(tweet)
  })

  const tweetGroup = await Promise.all(promises)

  const tweetGroupFiltered = tweetGroup.filter(tweet => {
    const hasURL = tweet.flickr.url

    return !!hasURL
  })
  return tweetGroupFiltered
}

function scoreTweets(tweetModels: TweetModel[] = []) {
  const scoredTweets = tweetModels.map(tweet => {
    const nounsVerbs = tweet.text.nounsVerbs
    const flickrTitle = tweet.flickr.title.toLowerCase().split(' ')
    const score = _.intersection(nounsVerbs, flickrTitle)
    tweet.flickr.score = score.length

    return tweet
  })

  scoredTweets.sort((a: TweetModel, b: TweetModel) => {
    return b.flickr.score - a.flickr.score
  })

  return scoredTweets
}

function createTweet(tweetModels: TweetModel[] = []) {
  if(tweetModels.length) {
    const tweetWithBestScore: TweetModel = tweetModels[0]
    const twitterPost = new Promise((resolve, reject) => {
      tp.update({
        status: tweetWithBestScore.text.original,
        media: request(tweetWithBestScore.flickr.url)
      }, (err: Error) => {
        if (!err) {
          console.log('Successfully posted to Twitter')
          console.log(tweetWithBestScore)
          resolve()
        } else {
          console.log('Error posting to Twitter', err)
          reject()
        }
      })
    })

    return twitterPost
    } else {
    console.log('No Flickr images found. No tweet composed.')
  }
}

function rateLimitCheck() {
  console.log('\n---------------------------')
  t.get('application/rate_limit_status', { resources: 'search' }, function (err: Error, data: twitterRateLimitData) {
    if (!err) {
      const dataRoot = data.resources.search['/search/tweets']
      const limit = dataRoot.limit
      const remaining = dataRoot.remaining
      const resetTime: number = dataRoot.reset * 1000
      const currentTime: number = (new Date).getTime()
      const msRemaining: number = (resetTime - currentTime)
      const totalSecsRemaining = Math.floor(msRemaining / 1000)
      const minRemaining = Math.floor(totalSecsRemaining / 60)
      const secRemaining: number = totalSecsRemaining % 60

      let formattedSecRemaining: string = secRemaining.toString()
      if (secRemaining < 10) {
        formattedSecRemaining = "0" + secRemaining.toString()
      }

      const timeUntilReset = new Date(0);
      timeUntilReset.setUTCSeconds(dataRoot.reset)

      let hour: number = timeUntilReset.getHours()
      if (hour > 12) { hour = hour - 12; }

      const min: number = timeUntilReset.getMinutes()
      let formattedMin: string = min.toString()
      if (min < 10) { formattedMin = "0" + min; }

      const sec: number = timeUntilReset.getSeconds()
      let formattedSec: string = sec.toString()
      if (sec < 10) { formattedSec = "0" + sec; }

      console.log("Rate limit: " + remaining + "/" + limit);
      console.log("Next reset at: " + hour + ":" + formattedMin + ":" + formattedSec + " in " + minRemaining + ":" + formattedSecRemaining)
      console.log('---------------------------')
    }
  });
}

module.exports = {
  t,
  tp,
  desire,
  getRawTweetStatuses,
  filterByEntities,
  filterByEmoji,
  filterByWordfilter,
  filterByLyrics,
  filterByPattern,
  extractWordsFromTweet,
  extractNounsFromWords,
  getFlickrIDTitle,
  getAllFlickrIDTitle,
  getFlickrURL,
  getAllFlickrURLs,
  scoreTweets,
  createTweet
}
