"use strict";
var TweetModel = /** @class */ (function () {
    function TweetModel(tweetData) {
        var user = tweetData.user || {};
        var twitterId = tweetData.id_str;
        var originalText = tweetData.text || '';
        var lowercase = originalText.toLowerCase();
        this.tweet = {
            id: twitterId,
            url: "https://twitter.com/" + user['screen_name'] + "/status/" + twitterId,
        };
        this.author = {
            id: user.id,
            name: user.name,
            screenName: user['screen_name'],
            profileImageURL: user['profile_image_url_https'],
        };
        this.text = {
            original: originalText,
            lowercase: lowercase,
            words: [],
            nounsVerbs: [],
        };
        this.flickr = {
            id: '',
            title: '',
            url: '',
            score: 0,
        };
    }
    return TweetModel;
}());
module.exports = TweetModel;
