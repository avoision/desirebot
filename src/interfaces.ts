interface TweetModel {
  tweet: object
  author: object
  text: {
    original: string
    lowercase: string
    words: string[]
    nounsVerbs: string[]
  }
  flickr: {
    id: string,
    title: string
    url: string,
    score: number
  }
}

interface rawTweetData {
  entities: {
    hashtags: object[]
    symbols: object[]
    user_mentions: object[]
    urls: object[]
  }
  user: {
    id: number
    name: string,
    screen_name: string
    profile_image_url_https: string
  }
  id_str: number
  text: string
}

interface twitterSearchResults {
  data: {
    statuses: object[]
  }
}

interface twitterRateLimitData {
  resources: {
    search: {
      '/search/tweets': {
        limit: number
        remaining: number
        reset: number
      }
    }
  }
}

interface flickrPhotoSearchResults {
  photos: {
    photo: [{
      id: string,
      title: string
    }]
  }
}

interface flickrPhotoSizeResults {
  sizes: {
    size: [
      {
        label: string,
        width: number,
        height: number,
        source: string,
        url: string,
        media: string
      }
    ]
  }
}