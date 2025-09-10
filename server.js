require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const crypto = require('crypto');
const ShortUrl = require('./models/ShortUrl');

const app = express();

const baseUrl = process.env.BASE_URL;
const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("Connected to MongoDB Atlas"))
.catch((error) => console.log("MongoDB connection error:", error));

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));

const BASE62_CHARS = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

function base62Encode(num) {
  let str = '';
  while(num > 0) {
    str = BASE62_CHARS[num % 62] + str;
    num = Math.floor(num / 62);
  }
  return str || '0';
}

function generateShortCode(fullUrl) {
  const hash = crypto.createHash('sha256').update(fullUrl).digest('hex');
  const slice = hash.slice(0, 8);
  const dec = parseInt(slice, 16);
  return base62Encode(dec);
}

app.get('/', async (req, res) => {
  const shortUrls = await ShortUrl.find();
  res.render('index', { shortUrls, baseUrl });
});

app.post('/shortUrls', async (req, res) => {
  const fullUrl = req.body.fullUrl;
  const expireDays = req.body.expireDays;

  let existing = await ShortUrl.findOne({ full: fullUrl });
  if (existing) {
    return res.redirect('/');
  }

  let expireAt = undefined;
  if (expireDays) {
    expireAt = new Date();
    expireAt.setDate(expireAt.getDate() + parseInt(expireDays));
  }

  let shortCode = generateShortCode(fullUrl);
  let collision = await ShortUrl.findOne({ short: shortCode });
  let suffix = 1;
  let baseShortCode = shortCode;

  while (collision) {
    shortCode = baseShortCode + suffix;
    collision = await ShortUrl.findOne({ short: shortCode });
    suffix++;
  }

  try {
    await ShortUrl.create({ full: fullUrl, short: shortCode, expireAt });
    res.redirect('/');
  } catch (err) {
    res.status(500).send('Error creating short URL');
  }
});

app.get('/:shortUrl', async (req, res) => {
  const shortUrl = await ShortUrl.findOne({ short: req.params.shortUrl });
  if (shortUrl) {
    shortUrl.clicks++;
    await shortUrl.save();
    return res.redirect(shortUrl.full);
  }
  return res.status(404).send('Short URL not found or expired');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
