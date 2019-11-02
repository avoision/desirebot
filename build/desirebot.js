"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
var _ = require('lodash');
var Twit = require('twit');
var emojiRegex = require('emoji-regex/text.js');
var wordfilter = require('wordfilter');
var TwitterPic = require('twitter-pic');
var request = require('request');
var rp = require('request-promise');
var pos = require('pos');
var TweetModelObj = require('./TweetModel');
var t = new Twit({
    consumer_key: process.env.DESIREBOT_TWIT_CONSUMER_KEY,
    consumer_secret: process.env.DESIREBOT_TWIT_CONSUMER_SECRET,
    access_token: process.env.DESIREBOT_TWIT_ACCESS_TOKEN,
    access_token_secret: process.env.DESIREBOT_TWIT_ACCESS_TOKEN_SECRET
});
var tp = new TwitterPic({
    consumer_key: process.env.DESIREBOT_TWIT_CONSUMER_KEY,
    consumer_secret: process.env.DESIREBOT_TWIT_CONSUMER_SECRET,
    token: process.env.DESIREBOT_TWIT_ACCESS_TOKEN,
    token_secret: process.env.DESIREBOT_TWIT_ACCESS_TOKEN_SECRET
});
var flickrPrefix = "https://api.flickr.com/services/rest/?";
var flickrKey = process.env.DESIREBOT_FLICKR_KEY;
var twitterQuery = {
    q: '\"i%20just%20want\"',
    count: 40,
    result_type: 'recent',
    lang: 'en',
    include_entities: true,
};
wordfilter.addWords(['nigg', 'n!gg', 'sjw', 'social justice', 'pussies', 'semen']);
function desire() {
    return __awaiter(this, void 0, void 0, function () {
        var rawTweetStatuses, tweetGroupFilteredByEntities, tweetGroupConverted, tweetGroupFilteredByEmoji, tweetGroupFilteredByWordfilter, tweetGroupFilteredByLyrics, tweetGroupFilteredByPattern, tweetGroupWithWords, tweetGroupWithNouns, tweetGroupWithFlickrIDs, tweetGroupWithFlickrURLs, tweetGroupScored;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getRawTweetStatuses()];
                case 1:
                    rawTweetStatuses = _a.sent();
                    tweetGroupFilteredByEntities = filterByEntities(rawTweetStatuses);
                    tweetGroupConverted = convertTweets(tweetGroupFilteredByEntities);
                    tweetGroupFilteredByEmoji = filterByEmoji(tweetGroupConverted);
                    tweetGroupFilteredByWordfilter = filterByWordfilter(tweetGroupFilteredByEmoji);
                    tweetGroupFilteredByLyrics = filterByLyrics(tweetGroupFilteredByWordfilter);
                    tweetGroupFilteredByPattern = filterByPattern(tweetGroupFilteredByLyrics);
                    tweetGroupWithWords = extractWordsFromTweet(tweetGroupFilteredByPattern);
                    tweetGroupWithNouns = extractNounsFromWords(tweetGroupWithWords);
                    return [4 /*yield*/, getAllFlickrIDTitle(tweetGroupWithNouns)];
                case 2:
                    tweetGroupWithFlickrIDs = _a.sent();
                    return [4 /*yield*/, getAllFlickrURLs(tweetGroupWithFlickrIDs)];
                case 3:
                    tweetGroupWithFlickrURLs = _a.sent();
                    tweetGroupScored = scoreTweets(tweetGroupWithFlickrURLs);
                    return [4 /*yield*/, createTweet(tweetGroupScored)];
                case 4:
                    _a.sent();
                    rateLimitCheck();
                    return [2 /*return*/];
            }
        });
    });
}
function getRawTweetStatuses() {
    return t.get('search/tweets', twitterQuery)
        .then(function (result) {
        var resultData = result.data;
        var rawTweetStatuses = resultData.statuses;
        if (rawTweetStatuses.length) {
            return rawTweetStatuses;
        }
        else {
            return Promise.reject(new Error('No statuses found'));
        }
    })
        .catch(function (err) {
        return Promise.reject(err);
    });
}
function filterByEntities(tweetStatuses) {
    if (tweetStatuses === void 0) { tweetStatuses = []; }
    var filteredTweets = tweetStatuses.filter(function (tweet) {
        var entities = tweet.entities || {};
        var hasHashtags = (entities.hashtags || []).length > 0;
        var hasSymbols = (entities.symbols || []).length > 0;
        var hasMentions = (entities.user_mentions || []).length > 0;
        var hasURLs = (entities.urls || []).length > 0;
        return !hasHashtags && !hasSymbols && !hasMentions && !hasURLs;
    });
    return filteredTweets;
}
function convertTweets(tweetStatuses) {
    if (tweetStatuses === void 0) { tweetStatuses = []; }
    return tweetStatuses.map(function (status) { return new TweetModelObj(status); });
}
function filterByEmoji(tweetModels) {
    if (tweetModels === void 0) { tweetModels = []; }
    var emoRegex = emojiRegex();
    var filteredTweets = tweetModels.filter(function (model) {
        var text = model.text.lowercase;
        var hasEmoji = emoRegex.test(text);
        return !hasEmoji;
    });
    return filteredTweets;
}
function filterByWordfilter(tweetModels) {
    if (tweetModels === void 0) { tweetModels = []; }
    var filteredTweets = tweetModels.filter(function (model) {
        var text = model.text.lowercase;
        var blockedTweet = wordfilter.blacklisted(text);
        return !blockedTweet;
    });
    return filteredTweets;
}
function filterByLyrics(tweetModels) {
    if (tweetModels === void 0) { tweetModels = []; }
    var filteredTweets = tweetModels.filter(function (model) {
        var text = model.text.lowercase;
        var isDrake = text.includes('just want some head');
        var isPeewee = text.includes('just want the money');
        var isGooGooDolls = text.includes('just want you to know who i am');
        return !isDrake && !isPeewee && !isGooGooDolls;
    });
    return filteredTweets;
}
function filterByPattern(tweetModels) {
    if (tweetModels === void 0) { tweetModels = []; }
    var filteredTweets = tweetModels.filter(function (model) {
        var text = model.text.lowercase;
        var pattern = /i\ just\ want/;
        return pattern.test(text);
    });
    return filteredTweets;
}
function extractWordsFromTweet(tweetModels) {
    if (tweetModels === void 0) { tweetModels = []; }
    var excludeNonAlpha = /[^a-zA-Z]+/;
    var excludeURLs = /https?:\/\/[-a-zA-Z0-9@:%_\+.~#?&\/=]+/g;
    var excludeShortAlpha = /\b[a-z][a-z]?\b/g;
    var excludeHandles = /@[a-z0-9_-]+/g;
    var excludeWords = ['just', 'want', 'don', 'bed', 'sleep'];
    var excludePatterns = __spreadArrays([excludeURLs, excludeShortAlpha, excludeHandles], excludeWords);
    var extracted = tweetModels.map(function (model) {
        var replacedText = model.text.lowercase;
        _.each(excludePatterns, function (pattern) { return replacedText = replacedText.replace(pattern, ''); });
        var words = replacedText.split(excludeNonAlpha);
        var filteredWords = words.filter(function (word) { return word !== ''; });
        var uniqueWords = new Set(filteredWords);
        var allUniqueWords = Array.from(uniqueWords);
        model.text.words = allUniqueWords;
        return model;
    });
    return extracted;
}
function extractNounsFromWords(tweetModels) {
    if (tweetModels === void 0) { tweetModels = []; }
    var extracted = tweetModels.filter(function (model) {
        var wordSource = (model.text.words || []).toString();
        var allowedTags = ['NN', 'NNS', 'VB', 'VBG', 'VBP', 'VBZ'];
        var lexSource = new pos.Lexer().lex(wordSource);
        var tagger = new pos.Tagger();
        var taggedWords = tagger.tag(lexSource);
        var nounsOrVerbs = [];
        taggedWords.map(function (word) {
            var wordTag = word[1];
            if (allowedTags.includes(wordTag)) {
                nounsOrVerbs.push(word[0]);
            }
        });
        model.text.nounsVerbs = nounsOrVerbs;
        return model.text.nounsVerbs.length > 0;
    });
    return extracted;
}
function getFlickrIDTitle(model) {
    var searchString = (model.text.nounsVerbs || []).join('%20');
    var flickrSearchOptions = {
        method: "flickr.photos.search",
        format: "json"
    };
    var flickrURL = flickrPrefix
        + "method=" + flickrSearchOptions.method
        + "&api_key=" + flickrKey
        + "&safe_search=2"
        + "&content_type=4"
        + "&format=json"
        + "&sort=relevance"
        + "&content_type=4"
        + "&page=10"
        + "&nojsoncallback=1"
        + "&text=" + searchString;
    return rp.get({ uri: flickrURL, json: true })
        .then(function (data) {
        var flickrID = '';
        var title = '';
        var photos = (data.photos || {}).photo;
        if (photos.length) {
            var randomPos = Math.floor(Math.random() * photos.length);
            var randomPhoto = photos[randomPos];
            flickrID = randomPhoto.id;
            title = randomPhoto.title;
        }
        model.flickr.id = flickrID;
        model.flickr.title = title;
        return model;
    })
        .catch(function (err) {
        return Promise.reject(err);
    });
}
function getAllFlickrIDTitle(tweetModels) {
    if (tweetModels === void 0) { tweetModels = []; }
    return __awaiter(this, void 0, void 0, function () {
        var promises, tweetGroup, tweetGroupFiltered;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    promises = tweetModels.map(function (tweet) {
                        return getFlickrIDTitle(tweet);
                    });
                    return [4 /*yield*/, Promise.all(promises)];
                case 1:
                    tweetGroup = _a.sent();
                    tweetGroupFiltered = tweetGroup.filter(function (tweet) {
                        var hasID = tweet.flickr.id;
                        var hasTitle = tweet.flickr.title;
                        return hasID && hasTitle;
                    });
                    return [2 /*return*/, tweetGroupFiltered];
            }
        });
    });
}
function getFlickrURL(model) {
    var url = '';
    var id = model.flickr.id;
    var flickrGetSizesOptions = {
        method: "flickr.photos.getSizes",
        format: "json"
    };
    var flickrURL = flickrPrefix
        + "method=" + flickrGetSizesOptions.method
        + "&photo_id=" + id
        + "&api_key=" + flickrKey
        + "&format=json"
        + "&nojsoncallback=1";
    return rp.get({ uri: flickrURL, json: true })
        .then(function (data) {
        var allSizes = data.sizes.size;
        var possibleSizes = allSizes.filter(function (sizeData) {
            return sizeData.width >= 500 && sizeData.width < 1060;
        });
        if (possibleSizes.length) {
            var largestSize = possibleSizes[possibleSizes.length - 1];
            var largestSizeURL = largestSize.source;
            url = largestSizeURL;
        }
        model.flickr.url = url;
        return model;
    })
        .catch(function (err) {
        return Promise.reject(err);
    });
}
function getAllFlickrURLs(tweetModels) {
    if (tweetModels === void 0) { tweetModels = []; }
    return __awaiter(this, void 0, void 0, function () {
        var promises, tweetGroup, tweetGroupFiltered;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    promises = tweetModels.map(function (tweet) {
                        return getFlickrURL(tweet);
                    });
                    return [4 /*yield*/, Promise.all(promises)];
                case 1:
                    tweetGroup = _a.sent();
                    tweetGroupFiltered = tweetGroup.filter(function (tweet) {
                        var hasURL = tweet.flickr.url;
                        return !!hasURL;
                    });
                    return [2 /*return*/, tweetGroupFiltered];
            }
        });
    });
}
function scoreTweets(tweetModels) {
    if (tweetModels === void 0) { tweetModels = []; }
    var scoredTweets = tweetModels.map(function (tweet) {
        var nounsVerbs = tweet.text.nounsVerbs;
        var flickrTitle = tweet.flickr.title.toLowerCase().split(' ');
        var score = _.intersection(nounsVerbs, flickrTitle);
        tweet.flickr.score = score.length;
        return tweet;
    });
    scoredTweets.sort(function (a, b) {
        return b.flickr.score - a.flickr.score;
    });
    return scoredTweets;
}
function createTweet(tweetModels) {
    if (tweetModels === void 0) { tweetModels = []; }
    if (tweetModels.length) {
        var tweetWithBestScore_1 = tweetModels[0];
        var twitterPost = new Promise(function (resolve, reject) {
            tp.update({
                status: tweetWithBestScore_1.text.original,
                media: request(tweetWithBestScore_1.flickr.url)
            }, function (err) {
                if (!err) {
                    console.log('Successfully posted to Twitter');
                    console.log(tweetWithBestScore_1);
                    resolve();
                }
                else {
                    console.log('Error posting to Twitter', err);
                    reject();
                }
            });
        });
        return twitterPost;
    }
    else {
        console.log('No Flickr images found. No tweet composed.');
    }
}
function rateLimitCheck() {
    console.log('\n---------------------------');
    t.get('application/rate_limit_status', { resources: 'search' }, function (err, data) {
        if (!err) {
            var dataRoot = data.resources.search['/search/tweets'];
            var limit = dataRoot.limit;
            var remaining = dataRoot.remaining;
            var resetTime = dataRoot.reset * 1000;
            var currentTime = (new Date).getTime();
            var msRemaining = (resetTime - currentTime);
            var totalSecsRemaining = Math.floor(msRemaining / 1000);
            var minRemaining = Math.floor(totalSecsRemaining / 60);
            var secRemaining = totalSecsRemaining % 60;
            var formattedSecRemaining = secRemaining.toString();
            if (secRemaining < 10) {
                formattedSecRemaining = "0" + secRemaining.toString();
            }
            var timeUntilReset = new Date(0);
            timeUntilReset.setUTCSeconds(dataRoot.reset);
            var hour = timeUntilReset.getHours();
            if (hour > 12) {
                hour = hour - 12;
            }
            var min = timeUntilReset.getMinutes();
            var formattedMin = min.toString();
            if (min < 10) {
                formattedMin = "0" + min;
            }
            var sec = timeUntilReset.getSeconds();
            var formattedSec = sec.toString();
            if (sec < 10) {
                formattedSec = "0" + sec;
            }
            console.log("Rate limit: " + remaining + "/" + limit);
            console.log("Next reset at: " + hour + ":" + formattedMin + ":" + formattedSec + " in " + minRemaining + ":" + formattedSecRemaining);
            console.log('---------------------------');
        }
    });
}
module.exports = {
    t: t,
    tp: tp,
    desire: desire,
    getRawTweetStatuses: getRawTweetStatuses,
    filterByEntities: filterByEntities,
    filterByEmoji: filterByEmoji,
    filterByWordfilter: filterByWordfilter,
    filterByLyrics: filterByLyrics,
    filterByPattern: filterByPattern,
    extractWordsFromTweet: extractWordsFromTweet,
    extractNounsFromWords: extractNounsFromWords,
    getFlickrIDTitle: getFlickrIDTitle,
    getAllFlickrIDTitle: getAllFlickrIDTitle,
    getFlickrURL: getFlickrURL,
    getAllFlickrURLs: getAllFlickrURLs,
    scoreTweets: scoreTweets,
    createTweet: createTweet
};
