var loader = setInterval(function () {
  if (document.readyState !== "complete") return;
  clearInterval(loader);
  document.querySelector(".spinner-wrapper").style.display = "none";
}, 400);

const searchSimilarProducts = async (e) => {
  e.preventDefault();
  try {
    const productName = document.querySelector(
      ".search-similar-products-input"
    ).value;
    const url = `http://localhost:5000/get-similar-products?name=${productName}`;
    const response = await fetch(url);
    const data = await response.json();

    const similarProducts = data.shopping_results;

    document.getElementById("Others").innerHTML = "Some Others: ";

    var index = 0;
    var highest = -99999999999999;
    var original_rating;
    for (var i = 0; i < 20; i++) {
      if (similarProducts[i].rating != undefined) {
        original_rating = parseFloat(similarProducts[i].rating);

        if (original_rating > highest) {
          highest = original_rating;
          index = i;
        }
      }
    }

    //Best rated
    document.getElementById("best_output").innerHTML =
      "Best rated: " + "</br>" + similarProducts[index].title;
    document.getElementById("best_output").href = similarProducts[index].link;

    document.getElementById("bestRated_price").innerHTML =
      "Price: " + similarProducts[index].price;

    document.getElementById("best_rating").innerHTML =
      "Best Rating: " + similarProducts[index].rating;

    document.getElementById("bestRated_show").src =
      similarProducts[index].thumbnail;
    document.getElementById("bestRated_show").style.display = "block";

    var index1 = 0;
    var lowest = 999999999999999;
    var original_price = 0;
    for (var i = 0; i < 20; i++) {
      if (similarProducts[i].price != undefined) {
        original_price = parseFloat(
          similarProducts[i].price.replace(/\D/g, "")
        );

        if (original_price < lowest) {
          lowest = original_price;
          index1 = i;
        }
      }
    }

    //Lowest Price
    document.getElementById("lowprice_output").innerHTML =
      "Lowest price: " + "</br>" + similarProducts[index1].title;
    document.getElementById("lowprice_output").href =
      similarProducts[index1].link;

    document.getElementById("low_price").innerHTML =
      "Lowest Price: " + similarProducts[index1].price;

    document.getElementById("lowprice_rating").innerHTML =
      "Rating: " + similarProducts[index1].rating;

    document.getElementById("lowprice_show").src =
      similarProducts[index1].thumbnail;
    document.getElementById("lowprice_show").style.display = "block";

    // First Item
    document.getElementById("output1").innerHTML =
      "Title: " + similarProducts[0].title;
    document.getElementById("output1").href = similarProducts[0].link;

    document.getElementById("price1").innerHTML =
      "Price: " + similarProducts[0].price;

    document.getElementById("rating1").innerHTML =
      "Rating: " + similarProducts[0].rating;

    document.getElementById("show1").src = similarProducts[0].thumbnail;
    document.getElementById("show1").style.display = "block";

    // Second Item
    document.getElementById("output2").innerHTML =
      "Title: " + similarProducts[1].title;
    document.getElementById("output2").href = similarProducts[1].link;

    document.getElementById("price2").innerHTML =
      "Price: " + similarProducts[1].price;

    document.getElementById("rating2").innerHTML =
      "Rating: " + similarProducts[1].rating;

    document.getElementById("show2").src = similarProducts[1].thumbnail;
    document.getElementById("show2").style.display = "block";

    // Third Item
    document.getElementById("output3").innerHTML =
      "Title: " + similarProducts[2].title;
    document.getElementById("output3").href = similarProducts[2].link;

    document.getElementById("price3").innerHTML =
      "Price: " + similarProducts[2].price;

    document.getElementById("rating3").innerHTML =
      "Rating: " + similarProducts[2].rating;

    document.getElementById("show3").src = similarProducts[2].thumbnail;
    document.getElementById("show3").style.display = "block";

    // Fourth Item
    document.getElementById("output4").innerHTML =
      "Title: " + similarProducts[3].title;
    document.getElementById("output4").href = similarProducts[3].link;

    document.getElementById("price4").innerHTML =
      "Price: " + similarProducts[3].price;

    document.getElementById("rating4").innerHTML =
      "Rating: " + similarProducts[3].rating;

    document.getElementById("show4").src = similarProducts[3].thumbnail;
    document.getElementById("show4").style.display = "block";
  } catch (error) {
    console.error(error);
  }
};

const trackStockArrival = (e) => {
  e.preventDefault();
  try {
    const url = `http://localhost:5000/track-stock-arrival`;
    chrome.tabs.getSelected(null, async (tab) => {
      const website_url = tab.url;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: document.querySelector("#stock-user-email").value,
          unavailable_keyword: document.querySelector(
            "#stock-unavailable-keyword"
          ).value,
          website_url,
        }),
      });
      const data = await response.json();
      console.log(data);
      // TODO: show success message
    });
  } catch (error) {
    console.error(error);
  }
};

const trackPriceReduction = (e) => {
  e.preventDefault();
  try {
    chrome.tabs.getSelected(null, async (tab) => {
      const website_url = tab.url;
      const response = await fetch(
        `http://localhost:5000/track-price-reduction`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: document.querySelector("#price-user-email").value,
            css_path_to_price: document.querySelector(
              "#price-css-selector-input"
            ).value,
            website_url: website_url,
          }),
        }
      );
      const data = await response.json();
      console.log(data);
      // TODO: show success message
    });
  } catch (error) {
    console.error(error);
  }
};

document
  .querySelector("#searchSimilarProductsForm")
  .addEventListener("submit", searchSimilarProducts);

document
  .querySelector("#trackStockArrivalForm")
  .addEventListener("submit", trackStockArrival);

document
  .querySelector("#price-reduce-form")
  .addEventListener("submit", trackPriceReduction);
