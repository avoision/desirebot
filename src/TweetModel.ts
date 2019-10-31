class TweetModel {
  constructor(tweetData: rawTweetData) {
    const user = tweetData.user || {}
    const twitterId = tweetData.id_str

    const originalText = tweetData.text || ''
    const lowercase = originalText.toLowerCase()

    this.tweet = {
      id: twitterId,
      url: `https://twitter.com/${user['screen_name']}/status/${twitterId}`,
    }

    this.author = {
      id: user.id,
      name: user.name,
      screenName: user['screen_name'],
      profileImageURL: user['profile_image_url_https'],
    }

    this.text = {
      original: originalText,
      lowercase: lowercase,
      words: [],
      nounsVerbs: [],
    }

    this.flickr = {
      id: '',
      title: '',
      url: '',
      score: 0,
    }
  }
}

module.exports = TweetModel