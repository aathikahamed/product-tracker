const express = require("express");
const cors = require("cors");
const axios = require("axios");
const Sequelize = require("sequelize-cockroachdb");
const sgMail = require("@sendgrid/mail");
const cheerio = require("cheerio");
require("dotenv").config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// For secure connection:
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

const app = express();

app.use(express.json());
app.use(cors());

// Connect to CockroachDB through Sequelize.
var sequelize = new Sequelize({
  dialect: "postgres",
  username: "aathik",
  password: "a1wAEyyu6zjMuegP",
  host: "free-tier5.gcp-europe-west1.cockroachlabs.cloud",
  port: 26257,
  database: "spry-tapir-2541.defaultdb",
  dialectOptions: {
    ssl: {
      // For secure connection:
      ca: fs.readFileSync("root.crt").toString(),
    },
  },
  logging: false,
});

// Define the StockArrives model for the "stock_arrives" table.
const StockArrives = sequelize.define("stock_arrives", {
  id: {
    type: Sequelize.STRING,
    primaryKey: true,
  },
  website_url: {
    type: Sequelize.STRING,
  },
  unavailable_keyword: {
    type: Sequelize.STRING,
  },
  email: {
    type: Sequelize.STRING,
  },
});

// Define the PriceReduced model for the "price_reduced" table.
const PriceReduced = sequelize.define("price_reduced", {
  id: {
    type: Sequelize.STRING,
    primaryKey: true,
  },
  website_url: {
    type: Sequelize.STRING,
  },
  css_path_to_price: {
    type: Sequelize.STRING,
  },
  initial_price: {
    type: Sequelize.STRING,
  },
  email: {
    type: Sequelize.STRING,
  },
});

// Create the "stock_arrives" table.
StockArrives.sync();
// Create the "price_reduced" table.
PriceReduced.sync();

const getPriceFromCssSelector = async (website_url, css_path_to_price) => {
  const response = await axios.get(website_url);
  const $ = cheerio.load(response.data);
  const price = $("body").find(css_path_to_price).text();
  return price.slice(1);
};

app.get("/price-history", async (req, res) => {
  // const { amazon_url } = req.query;
  // // console.log(amazon_url);
  // const options = {
  //   method: "GET",
  //   url: "https://amazon-historical-price.p.rapidapi.com/api/sc/amazon/historical_price",
  //   params: { item_url: amazon_url },
  //   headers: {
  //     "x-rapidapi-host": "amazon-historical-price.p.rapidapi.com",
  //     "x-rapidapi-key": process.env.RAPID_API_KEY,
  //   },
  // };
  // const { data } = await axios.request(options);
  // console.log(data);
  res.json({
    code: 200,
    msg: "success",
    data: {
      price_detail: {
        price_max: 16900,
        price_max_timestamp: 1638288000,
        price_min: 15900,
        price_min_timestamp: 1640448000,
        price_current: 15900,
        trend: "down",
        trend_detail: [
          {
            x: 1634832000,
            y: 16900,
          },
          {
            x: 1638288000,
            y: 16900,
          },
          {
            x: 1638374400,
            y: 15900,
          },
          {
            x: 1640448000,
            y: 15900,
          },
        ],
        period: 360,
      },
      item_info: {
        title: "New Apple AirPods (3rd generation)",
        url: "https://www.amazon.co.uk/dp/B09JQQDLXF/",
        main_img:
          "https://m.media-amazon.com/images/I/61Z5J-fq7KL._AC_UL320_.jpg",
      },
    },
  });
});

app.post("/track-stock-arrival", async (req, res) => {
  const { website_url, unavailable_keyword, email } = req.body;
  await StockArrives.create({
    id: uuidv4(),
    website_url,
    unavailable_keyword,
    email,
  });
  res.json({ website_url, unavailable_keyword, email });
});

app.post("/track-price-reduction", async (req, res) => {
  const { website_url, css_path_to_price, email } = req.body;
  const initial_price = await getPriceFromCssSelector(
    website_url,
    css_path_to_price
  );
  await PriceReduced.create({
    id: uuidv4(),
    website_url,
    css_path_to_price,
    initial_price,
    email,
  });
  res.json({ website_url, css_path_to_price, initial_price });
});

app.get("/get-similar-products", async (req, res) => {
  const productName = req.query.name;
  const url = `https://serpapi.com/search.json?q=${productName}&tbm=shop&location=Dallas&hl=en&gl=us&api_key=a32ef37e4aad3158c0becc19b77aae1424925db9eb806c063abc8edb4114298a`;
  const { data } = await axios(url);
  res.json(data);
});

app.listen(5000, async () => {
  console.log("Server is running on port 5000");

  // Ping websites to check if they are back in stock.
  setInterval(async () => {
    const websites = await StockArrives.findAll();
    websites.forEach(async (website) => {
      const { website_url, unavailable_keyword } = website;
      const { data } = await axios(website_url);
      if (data.indexOf(unavailable_keyword) === -1) {
        console.log("keyword not found, item back in stock, sending email");
        const msg = {
          to: website.email,
          from: "hello@aathik.com",
          subject: "Your product is available!",
          text: `Your product is back in stock. Visit ${website_url}`,
        };
        sgMail
          .send(msg)
          .then(() => {
            console.log("Email sent!");
            StockArrives.destroy({ where: { id: website.id } });
          })
          .catch((error) => {
            console.error(error);
          });
      } else {
        console.log("keyword found, item not in stock yet");
      }
    });
  }, 1000 * 60 * 60); // Check every hour.

  setInterval(async () => {
    // Check if prices have changed.
    const websites = await PriceReduced.findAll();
    websites.forEach(async (website) => {
      const { website_url, css_path_to_price, initial_price } = website;
      const newPrice = await getPriceFromCssSelector(
        website_url,
        css_path_to_price
      );
      console.log(newPrice, initial_price);
      if (newPrice < initial_price) {
        console.log("price has decreased, sending email");
        const msg = {
          to: website.email,
          from: "hello@aathik.com",
          subject: "The price has decreased!",
          text: `The price has decreased. Visit ${website_url}`,
        };
        sgMail
          .send(msg)
          .then(() => {
            console.log("Email sent!");
            PriceReduced.destroy({ where: { id: website.id } });
          })
          .catch((error) => {
            console.error(error);
          });
      } else {
        console.log("price has not decreased");
      }
    });
  }, 1000 * 60 * 60); // Check every hour.
});
