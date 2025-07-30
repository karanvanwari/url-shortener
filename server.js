const express = require('express');
const mongoose = require('mongoose');
const shortid = require('shortid');

const app = express();

mongoose.connect('mongodb://localhost:27017/urlShortener', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Define the model once only
const shortUrlSchema = new mongoose.Schema({
  full: {
    type: String,
    required: true
  },
  short: {
    type: String,
    required: true,
    default: () => shortid.generate()
  },
  clicks: {
    type: Number,
    required: true,
    default: 0
  }
});
const ShortUrl = mongoose.model('ShortUrl', shortUrlSchema);

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));

// GET route: fetch all short URLs and render index
app.get('/', async (req, res) => {
  const shortUrls = await ShortUrl.find();
  res.render('index', { shortUrls }); // pass shortUrls to EJS template
});

// POST route: create a new short URL
app.post('/shortUrls', async (req, res) => {
  try {
    await ShortUrl.create({ full: req.body.fullUrl }); // use req.body.fullUrl to match form input name
    res.redirect('/');
  } catch (err) {
    res.status(500).send('Error creating short URL');
  }
});

// Redirect short URL to original full URL and track clicks
app.get('/:shortUrl', async (req, res) => {
  const shortUrl = await ShortUrl.findOne({ short: req.params.shortUrl });
  if (shortUrl) {
    shortUrl.clicks++;
    await shortUrl.save();
    return res.redirect(shortUrl.full);
  }
  return res.status(404).send('Short URL not found');
});

app.listen(5000, () => {
  console.log('Server is running on port 5000');
});
