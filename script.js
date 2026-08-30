```javascript
/*
  KenaKata
  Supabase-connected product + cart system
*/


// =====================================================
// GLOBAL DATA
// =====================================================

let products = [];

let cart = JSON.parse(
  localStorage.getItem("kenakata-cart") || "[]"
);


// =====================================================
// DOM ELEMENTS
// =====================================================

const grid =
  document.getElementById("productGrid");

const search =
  document.getElementById("searchInput");

const statusBox =
  document.getElementById("productStatus");

const sortSelect =
  document.getElementById("sortSelect");


// =====================================================
// MONEY FORMAT
// =====================================================

function money(value) {

  return "৳" + Number(value || 0)
    .toLocaleString("en-BD");

}


// =====================================================
// LOAD PRODUCTS FROM SUPABASE
// =====================================================

async function loadProducts() {

  statusBox.textContent =
    "Supabase থেকে পণ্য লোড হচ্ছে...";

  try {

    const {
      data,
      error
    } = await supabaseClient

      .from("products")

      .select(
        "id,name,price,description,image_url,category,stock,created_at"
      )

      .order(
        "created_at",
        {
          ascending: false
        }
      );


    if (error) {
      throw error;
    }


    products = data || [];


    if (!products.length) {

      statusBox.textContent =
        "এখনো কোনো product যোগ করা হয়নি।";

      grid.innerHTML = "";

      return;
    }


    statusBox.textContent = "";

    render(products);


  } catch (error) {

    console.error(
      "Supabase product error:",
      error
    );

    statusBox.innerHTML = `
      <div>
        <b>Product load করা যাচ্ছে না।</b>
        <br>
        <small>
          Supabase connection অথবা RLS policy check করুন।
        </small>
      </div>
    `;

  }

}


// =====================================================
// RENDER PRODUCTS
// =====================================================

function render(list = products) {

  if (!list.length) {

    grid.innerHTML = `
      <div style="
        grid-column:1/-1;
        text-align:center;
        padding:40px;
        color:#777;
      ">
        😔 কোনো product পাওয়া যায়নি।
      </div>
    `;

    return;
  }


  grid.innerHTML = list.map(product => {

    const id =
      Number(product.id);

    const name =
      escapeHTML(product.name || "Unnamed Product");

    const description =
      escapeHTML(product.description || "");

    const category =
      escapeHTML(product.category || "Product");

    const price =
      Number(product.price || 0);

    const stock =
      Number(product.stock || 0);


    const imageHTML =
      product.image_url

        ? `
          <img
            src="${escapeAttribute(product.image_url)}"
            alt="${escapeAttribute(product.name || "Product")}"
            loading="lazy"
            style="
              width:100%;
              height:100%;
              object-fit:cover;
              display:block;
            "
          >
        `

        : `
          <div style="
            font-size:55px;
            display:flex;
            align-items:center;
            justify-content:center;
            width:100%;
            height:100%;
          ">
            🛍️
          </div>
        `;


    const stockText =
      stock > 0
        ? `Stock: ${stock}`
        : "Out of Stock";


    const disabled =
      stock <= 0
        ? "disabled"
        : "";


    return `

      <article class="product-card">

        <div
          class="product-image"
          style="overflow:hidden;"
        >

          <span class="badge">
            ${stock > 0 ? "NEW" : "SOLD OUT"}
          </span>

          ${imageHTML}

        </div>


        <div class="product-info">

          <small
            style="
              opacity:.65;
              text-transform:capitalize;
            "
          >
            ${category}
          </small>


          <h3>
            ${name}
          </h3>


          <div class="stars">
            ★★★★★
            <small>
              (${stockText})
            </small>
          </div>


          <div class="price">
            ${money(price)}
          </div>


          ${
            description
              ? `
                <p style="
                  font-size:13px;
                  opacity:.7;
                  margin:7px 0;
                ">
                  ${description}
                </p>
              `
              : ""
          }


          <button
            class="add-btn"
            onclick="addToCart(${id})"
            ${disabled}
          >
            ${
              stock > 0
                ? "+ Add to Cart"
                : "Out of Stock"
            }
          </button>

        </div>

      </article>

    `;

  }).join("");

}


// =====================================================
// ADD TO CART
// =====================================================

function addToCart(id) {

  const product =
    products.find(
      item => Number(item.id) === Number(id)
    );


  if (!product) {

    alert("Product পাওয়া যায়নি।");

    return;
  }


  if (Number(product.stock || 0) <= 0) {

    alert("এই product বর্তমানে stock-out.");

    return;
  }


  const item =
    cart.find(
      item => Number(item.id) === Number(id)
    );


  if (item) {

    if (
      item.qty >=
      Number(product.stock)
    ) {

      alert(
        `শুধু ${product.stock}টি stock available.`
      );

      return;
    }


    item.qty++;

  } else {

    cart.push({

      ...product,

      qty: 1

    });

  }


  saveCart();

  openCart();

}


// =====================================================
// REMOVE FROM CART
// =====================================================

function removeFromCart(id) {

  cart =
    cart.filter(
      item =>
        Number(item.id) !== Number(id)
    );


  saveCart();

}


// =====================================================
// SAVE CART
// =====================================================

function saveCart() {

  localStorage.setItem(
    "kenakata-cart",
    JSON.stringify(cart)
  );

  renderCart();

}


// =====================================================
// RENDER CART
// =====================================================

function renderCart() {

  const cartCount =
    document.getElementById("cartCount");

  const cartItems =
    document.getElementById("cartItems");

  const cartTotal =
    document.getElementById("cartTotal");


  const totalQuantity =
    cart.reduce(
      (total, item) =>
        total + Number(item.qty || 0),
      0
    );


  const totalPrice =
    cart.reduce(
      (total, item) =>
        total +
        Number(item.price || 0) *
        Number(item.qty || 0),
      0
    );


  cartCount.textContent =
    totalQuantity;


  cartTotal.textContent =
    money(totalPrice);


  if (!cart.length) {

    cartItems.innerHTML = `
      <div style="
        padding:45px 20px;
        text-align:center;
        color:#777;
      ">
        🛒
        <br><br>
        আপনার cart এখনো খালি।
      </div>
    `;

    return;
  }


  cartItems.innerHTML =
    cart.map(item => {

      const image =
        item.image_url

          ? `
            <img
              src="${escapeAttribute(item.image_url)}"
              alt=""
              style="
                width:55px;
                height:55px;
                object-fit:cover;
                border-radius:8px;
              "
            >
          `

          : "🛍️";


      return `

        <div class="cart-item">

          <div class="thumb">
            ${image}
          </div>


          <div>

            <h4>
              ${escapeHTML(item.name)}
            </h4>

            <p>
              ${money(item.price)}
              ×
              ${item.qty}
            </p>

          </div>


          <button
            class="remove"
            onclick="removeFromCart(${Number(item.id)})"
          >
            ✕
          </button>

        </div>

      `;

    }).join("");

}


// =====================================================
// OPEN CART
// =====================================================

function openCart() {

  document
    .getElementById("cartPanel")
    .classList.add("show");


  document
    .getElementById("overlay")
    .classList.add("show");

}


// =====================================================
// CLOSE CART
// =====================================================

function closeCart() {

  document
    .getElementById("cartPanel")
    .classList.remove("show");


  document
    .getElementById("overlay")
    .classList.remove("show");

}


// =====================================================
// SEARCH + FILTER
// =====================================================

function filterProducts() {

  const query =
    search.value
      .toLowerCase()
      .trim();


  const filtered =
    products.filter(product => {

      const name =
        String(product.name || "")
          .toLowerCase();


      const category =
        String(product.category || "")
          .toLowerCase();


      const description =
        String(product.description || "")
          .toLowerCase();


      return (
        name.includes(query) ||
        category.includes(query) ||
        description.includes(query)
      );

    });


  render(filtered);

}


// =====================================================
// SORT
// =====================================================

function sortProducts(value) {

  const sorted =
    [...products];


  if (value === "low") {

    sorted.sort(
      (a, b) =>
        Number(a.price || 0) -
        Number(b.price || 0)
    );

  }


  if (value === "high") {

    sorted.sort(
      (a, b) =>
        Number(b.price || 0) -
        Number(a.price || 0)
    );

  }


  render(sorted);

}


// =====================================================
// SAFE HTML HELPERS
// =====================================================

function escapeHTML(value) {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


function escapeAttribute(value) {

  return escapeHTML(value);

}


// =====================================================
// EVENTS
// =====================================================

document
  .getElementById("cartOpen")
  .addEventListener(
    "click",
    openCart
  );


document
  .getElementById("cartClose")
  .addEventListener(
    "click",
    closeCart
  );


document
  .getElementById("overlay")
  .addEventListener(
    "click",
    closeCart
  );


search.addEventListener(
  "input",
  filterProducts
);


document
  .getElementById("searchBtn")
  .addEventListener(
    "click",
    filterProducts
);


sortSelect.addEventListener(
  "change",
  event =>
    sortProducts(
      event.target.value
    )
);


// Category buttons

document
  .querySelectorAll(".category-card")
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        search.value =
          button.dataset.cat;

        filterProducts();

        document
          .getElementById("products")
          .scrollIntoView({
            behavior: "smooth"
          });

      }
    );

  });


// Checkout

document
  .getElementById("checkout")
  .addEventListener(
    "click",
    () => {

      if (!cart.length) {

        alert("আপনার cart খালি!");

        return;
      }


      // Later this will become checkout.html
      alert(
        "Cart ready! পরের ধাপে Checkout + Order Database connect করা হবে।"
      );

    }
  );


// Newsletter

document
  .getElementById("newsletter")
  .addEventListener(
    "submit",
    event => {

      event.preventDefault();

      alert(
        "ধন্যবাদ! Newsletter subscription demo সফল হয়েছে।"
      );

      event.target.reset();

    }
  );


// =====================================================
// INITIALIZE
// =====================================================

renderCart();

loadProducts();
```
