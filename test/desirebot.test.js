const desirebot = require('../src/desirebot.ts')
const wordfilter = require('wordfilter')
const rp = require('request-promise')

describe('desirebot', () => {
  describe('#getRawTweetStatuses', () => {
    test('returns statuses', async() => {
      const statusData = [1, 2, 3, 4, 5]

      desirebot.t.get = jest.fn().mockResolvedValue({
        data: {
          statuses: statusData
        }
      })

      const result = await desirebot.getRawTweetStatuses()
      expect(result).toEqual(statusData)
    })

    test('returns an error if no statuses', async () => {
      const statusData = []

      desirebot.t.get = jest.fn().mockResolvedValue({
        data: {
          statuses: statusData
        }
      })

      const result = desirebot.getRawTweetStatuses()
      await expect(result).rejects.toThrow('No statuses found')
    })


    test('returns an error', async() => {
      desirebot.t.get = jest.fn().mockReturnValue(Promise.reject(new Error('some error')))

      const result = desirebot.getRawTweetStatuses()
      await expect(result).rejects.toThrow('some error')
    })
  })

  describe('#filterByEntities', () => {
    let tweetData

    beforeEach(() => {
      tweetData = [
        {
          "text": "Tweet 1",
          entities: {}
        },
        {
          "text": "Tweet 2",
          entities: {}
        },
        {
          "text": "Tweet 3",
          entities: {}
        },
        {
          "text": "Tweet 4",
          entities: {}
        },
        {
          "text": "Tweet 5",
          entities: {}
        }
      ]
    })

    test('excludes tweets with hashtags', () => {
      tweetData[2].entities.hashtags = ['exists']

      const result = desirebot.filterByEntities(tweetData)
      expect(result.length).toBe(4)
    })

    test('excludes tweets with symbols', () => {
      tweetData[2].entities.symbols = ['exists']
      tweetData[4].entities.symbols = ['exists']

      const result = desirebot.filterByEntities(tweetData)
      expect(result.length).toBe(3)
    })

    test('excludes tweets with mentions', () => {
      tweetData[3].entities.user_mentions = ['exists']

      const result = desirebot.filterByEntities(tweetData)
      expect(result.length).toBe(4)
    })

    test('excludes tweets with URLs', () => {
      tweetData[0].entities.urls = ['exists']
      tweetData[3].entities.urls = ['exists']

      const result = desirebot.filterByEntities(tweetData)
      expect(result.length).toBe(3)
    })
  })

  describe('#filterByEmoji', () => {
    const tweetData = [
      {
        text: {
          lowercase: 'i have an emoji 😩'
        }
      },
      {
        text: {
          lowercase: 'i have nothing'
        }
      },
      {
        text: {
          lowercase: 'neither do I'
        }
      },
    ]

    test('excludes emoji', () => {
      const result = desirebot.filterByEmoji(tweetData)
      expect(result.length).toBe(2)
    })
  })

  describe('#filterByWordfilter', () => {
    const tweetData = [
      {
        text: {
          lowercase: 'some text'
        }
      }
    ]

    test('excludes by wordfilter', () => {
      wordfilter.blacklisted = jest.fn().mockReturnValue(true)

      const result = desirebot.filterByWordfilter(tweetData)
      expect(result.length).toBe(0)
    })

    test('allows by wordfilter', () => {
      wordfilter.blacklisted = jest.fn().mockReturnValue(false)

      const result = desirebot.filterByWordfilter(tweetData)
      expect(result.length).toBe(1)
    })
  })

  describe('#filterByLyrics', () => {
    test('excludes Drake', () => {
      const tweetData = [
        {
          text: {
            lowercase: 'just want some head'
          }
        },
      ]
      const result = desirebot.filterByLyrics(tweetData)
      expect(result.length).toBe(0)
    })

    test('exculdes Peewee', () => {
      const tweetData = [
        {
          text: {
            lowercase: 'just want the money'
          }
        },
      ]
      const result = desirebot.filterByLyrics(tweetData)
      expect(result.length).toBe(0)
    })

    test('excludes Goo Goo Dolls', () => {
      const tweetData = [
        {
          text: {
            lowercase: 'just want you to know who i am'
          }
        },
      ]
      const result = desirebot.filterByLyrics(tweetData)
      expect(result.length).toBe(0)
    })

    test('allows something not annoying', () => {
      const tweetData = [
        {
          text: {
            lowercase: 'just want to avoid annoying lyrics'
          }
        },
      ]
      const result = desirebot.filterByLyrics(tweetData)
      expect(result.length).toBe(1)
    })
  })

  describe('#filterByPattern', () => {
    test('includes if pattern found', () => {
      const tweetData = [{ text: { lowercase: 'i just want some text' }}]

      const result = desirebot.filterByPattern(tweetData)
      expect(result.length).toBe(1)
    })

    test('excludes if pattern not found', () => {
      const tweetData = [{ text: { lowercase: 'some text' }}]
      const result = desirebot.filterByPattern(tweetData)
      expect(result.length).toBe(0)
    })
  })

  describe('#extractWordsFromTweet', () => {
    test('excludes urls', () => {
      const tweetData = [{ text: { lowercase: "my favorite web site is https://google.com"} }]
      const result = desirebot.extractWordsFromTweet(tweetData)
      const resultWords = result[0].text.words
      const expectedWords = ['favorite', 'web', 'site']

      expect(resultWords).toEqual(expectedWords)
    })

    test('excludes short words', () => {
      const tweetData = [{ text: { lowercase: "my long words remain" } }]
      const result = desirebot.extractWordsFromTweet(tweetData)
      const resultWords = result[0].text.words
      const expectedWords = ['long', 'words', 'remain']

      expect(resultWords).toEqual(expectedWords)
    })

    test('excludes Twitter handles', () => {
      const tweetData = [{ text: { lowercase: "calling for @avoision" } }]
      const result = desirebot.extractWordsFromTweet(tweetData)
      const resultWords = result[0].text.words
      const expectedWords = ['calling', 'for']

      expect(resultWords).toEqual(expectedWords)
    })

    test('excludes annoying words', () => {
      const tweetData = [{ text: { lowercase: "don bed leave sleep them out" } }]
      const result = desirebot.extractWordsFromTweet(tweetData)
      const resultWords = result[0].text.words
      const expectedWords = ['leave', 'them', 'out']

      expect(resultWords).toEqual(expectedWords)
    })
  })

  describe('#extractNounsFromWords', () => {
    test('retains nouns', () => {
      const tweetData = [{ text: { words: ['world', 'amazing', 'tree'] } }]
      const result = desirebot.extractNounsFromWords(tweetData)
      const resultNounVerbs = result[0].text.nounsVerbs
      const expectedNounVerbs = ['world', 'tree']

      expect(resultNounVerbs).toEqual(expectedNounVerbs)
    })

    test('retains verbs', () => {
      const tweetData = [{ text: { words: ['grow', 'fast', 'blossoming'] } }]
      const result = desirebot.extractNounsFromWords(tweetData)
      const resultNounVerbs = result[0].text.nounsVerbs
      const expectedNounVerbs = ['grow', 'blossoming']

      expect(resultNounVerbs).toEqual(expectedNounVerbs)
    })

    test('filters out models with no nouns', () => {
      const tweetData = [
        { text: { words: ['grow', 'fast', 'blossoming'] } },
        { text: { words: ['fast', 'slow'] } }
      ]
      const result = desirebot.extractNounsFromWords(tweetData)
      expect(result.length).toBe(1)
    })
  })

  describe('#getFlickrIDTitle', () => {
    test('populates model with Flickr ID and Title', async() => {
      const sampleFlickrResponse = {
        photos: {
          photo: [
            {
              id: '15629549896',
              owner: '36971271@N08',
              secret: 'b133c4b462',
              server: '3932',
              farm: 4,
              title: 'Did some hoodrat things with my friends yesterday.',
              ispublic: 1,
              isfriend: 0,
              isfamily: 0
            }
          ]
        }
      }
      rp.get = jest.fn().mockResolvedValue(sampleFlickrResponse)

      const tweetModel = {
        text: { nounsVerbs: ['friends', 'yesterday'] },
        flickr: {id: 0, title: ''}
      }

      const result = await desirebot.getFlickrIDTitle(tweetModel)
      const param = rp.get.mock.calls[0][0]
      const uri = param.uri

      expect(uri.includes('friends%20yesterday')).toBe(true)
      expect(result.flickr.id).toBe('15629549896')
      expect(result.flickr.title).toBe('Did some hoodrat things with my friends yesterday.')
    })
  })

  describe('#getAllFlickrIDTitle', () => {
    test('populates array of models with Flickr ID and Title', async() => {
      rp.get = jest.fn()
        .mockResolvedValueOnce({
          photos: {
            photo: [
              {
                id: '1',
                title: 'my title',
              }
            ]
          }})
        .mockResolvedValueOnce({
          photos: {
            photo: [
              {
                id: '2',
                title: 'my other title',
              }
            ]
          }})

      const tweetData = [
        {
          text: { nounsVerbs: ['friends', 'yesterday'] },
          flickr: { id: 0, title: '' }
        },
        {
          text: { nounsVerbs: ['enemies', 'tomorrow'] },
          flickr: { id: 0, title: '' }
        }
      ]

      const result = await desirebot.getAllFlickrIDTitle(tweetData)
      expect(result[0].flickr.id).toBe('1')
      expect(result[0].flickr.title).toBe('my title')
      expect(result[1].flickr.id).toBe('2')
      expect(result[1].flickr.title).toBe('my other title')
    })
  })

  describe('#getFlickrURL', () => {
    test('populates model with Flickr URL', async () => {
      const sampleFlickrSizeResponse = {
        sizes: {
          size: [
            {
              "label": "Small 400",
              "width": 400,
              "height": 331,
              "source": "some-small-url-source",
              "url": "some-small-url",
            },
            {
              "label": "Medium",
              "width": 500,
              "height": 331,
              "source": "some-medium-url-source",
              "url": "some-medium-url",
            },
            {
              "label": "Large",
              "width": 1024,
              "height": 678,
              "source": "some-large-url-source",
              "url": "some-large-url",
            },
            {
              "label": "Original",
              "width": 2000,
              "height": 600,
              "source": "some-overly-large-url-source",
              "url": "some-overly-large-url",
            }
          ]
        }
      }
      rp.get = jest.fn().mockResolvedValue(sampleFlickrSizeResponse)

      const tweetModel = {
        text: { nounsVerbs: ['friends', 'yesterday'] },
        flickr: { url: '', id: '12345' }
      }

      const result = await desirebot.getFlickrURL(tweetModel)
      const param = rp.get.mock.calls[0][0]
      const uri = param.uri

      expect(uri.includes('photo_id=12345')).toBe(true)
      expect(result.flickr.url).toBe('some-large-url-source')
    })
  })

  describe('#getAllFlickrURLs', () => {
    test('populates array of models with Flickr url', async() => {
      rp.get = jest.fn()
        .mockResolvedValueOnce({
          sizes: {
            size: [
              {
                "label": "Medium",
                "width": 500,
                "height": 331,
                "source": "some-url-source",
                "url": "some-url",
                "media": "photo"
              }
            ]
          }
        })
        .mockResolvedValueOnce({
          sizes: {
            size: [
              {
                "label": "Original",
                "width": 1061,
                "height": 702,
                "source": "some-too-large-url-source",
                "url": "some--too-large-url",
                "media": "photo"
              }
            ]
          }
        })

      const tweetData = [
        {
          flickr: { id: 100 }
        },
        {
          flickr: { id: 200 }
        }
      ]

      const result = await desirebot.getAllFlickrURLs(tweetData)
      expect(rp.get).toHaveBeenCalledTimes(2)
      expect(result.length).toBe(1)
      expect(result[0].flickr.url).toBe('some-url-source')
    })
  })

  describe('#scoreTweets', () => {
    test('scores and sorts tweets', () => {
      const tweetData = [
        {
          text: { nounsVerbs: ['friends', 'yesterday'] },
          flickr: { title: 'we were friends' }
        },
        {
          text: { nounsVerbs: ['enemy', 'tomorrow', 'sunrise'] },
          flickr: { title: 'meeting the enemy tomorrow at sunrise' }
        },
      ]

      const result = desirebot.scoreTweets(tweetData)
      expect(result[0].flickr.score).toBe(3)
      expect(result[1].flickr.score).toBe(1)
    })
  })

  describe('#createTweet', () => {
    test('calls tp update', async() => {
      const tweetData = [{
        text: {
          original: 'original text'
        },
        flickr: {
          url: 'some url'
        }
      }]

      desirebot.tp.update = jest.fn()
      desirebot.createTweet(tweetData)
      const param = desirebot.tp.update.mock.calls[0][0]

      expect(desirebot.tp.update).toHaveBeenCalledTimes(1)
      expect(param.status).toBe('original text')
    })
  })
})
