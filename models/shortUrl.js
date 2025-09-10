const mongoose = require('mongoose');

const shortUrlSchema = new mongoose.Schema({
  full: {
    type: String,
    required: true,
    index: true
  },
  short: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  clicks: {
    type: Number,
    required: true,
    default: 0
  },
  expireAt: {
    type: Date,
    expires: 0
  }
});

module.exports = mongoose.model('ShortUrl', shortUrlSchema);
