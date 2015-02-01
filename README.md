# Desire Bot
Last updated: January 31, 2015

## Description
Twitter bot that reposts tweets that begin with "I just want..." 

Tweets containing @usernames, #hashtags, or URLs are rejected. Words from the original tweet are broken down, and sent to Wordnik for analysis. Words identified as nouns are kept, and used as a Flickr search string. Any Flickr image that has tags matching all keywords are kept.

This is my first Twitter bot, and I was fortunate to find a most excellent tutorial by [Sarah Kuehnle](https://github.com/ursooperduper) entitled [Creating a Twitter Bot with Node.js](https://ursooperduper.github.io/2014/10/27/twitter-bot-with-node-js-part-1.html), which provided a foundation for me to build upon. 

Twitter: https://twitter.com/thedesirebot