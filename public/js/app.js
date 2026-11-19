const API = "https://shopease-backend-qqm6.onrender.com";

let currentUser = JSON.parse(localStorage.getItem("shopEaseUser")) || null;
let products = [];
let cart = [];
let wishlist = [];

function getUserId() {
    return currentUser?.id || currentUser?._id;
}

// PAGE NAVIGATION
function showAuth() {
    document.getElementById("authPage").classList.remove("hidden");
    document.getElementById("welcomePage").classList.add("hidden");
    document.getElementById("shopPage").classList.add("hidden");
}

function showWelcome() {
    document.getElementById("authPage").classList.add("hidden");
    document.getElementById("welcomePage").classList.remove("hidden");
    document.getElementById("shopPage").classList.add("hidden");

    document.getElementById("welcomeName").textContent =
        `Hello, ${currentUser.name}!`;
}

function showShop() {
    document.getElementById("authPage").classList.add("hidden");
    document.getElementById("welcomePage").classList.add("hidden");
    document.getElementById("shopPage").classList.remove("hidden");

    showPage("homePage");
    loadProducts();
    loadCart();
    loadWishlist();
}

function showPage(pageId) {
    document.querySelectorAll("#shopPage .page").forEach(page => {
        page.classList.add("hidden");
    });

    document.getElementById(pageId).classList.remove("hidden");

    if (pageId === "cartPage") loadCart();
    if (pageId === "productsPage") loadProducts();
    if (pageId === "ordersPage") loadOrders();
    if (pageId === "accountPage") showAccount();
    if (pageId === "wishlistPage") loadWishlist();
}

// PROCEED TO CHECKOUT BUTTON
document.getElementById("checkoutBtn").addEventListener("click", () => {
    if (cart.length === 0) {
        alert("Your cart is empty!");
        return;
    }

    showPage("checkoutPage");
});

// SWITCH BETWEEN REGISTER AND LOGIN

document.getElementById("showLogin").addEventListener("click", (e) => {
    e.preventDefault();

    document.getElementById("registerForm").classList.add("hidden");
    document.getElementById("loginForm").classList.remove("hidden");
});

document.getElementById("showRegister").addEventListener("click", (e) => {
    e.preventDefault();

    document.getElementById("loginForm").classList.add("hidden");
    document.getElementById("registerForm").classList.remove("hidden");
});

// NAVIGATION BUTTONS
document.querySelectorAll("[data-page]").forEach(button => {
    button.addEventListener("click", () => {
        showPage(button.dataset.page);
    });
});

// REGISTER
document.getElementById("registerForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("regName").value.trim();
    const email = document.getElementById("regEmail").value.trim();
    const password = document.getElementById("regPassword").value;

    const message = document.getElementById("registerMessage");

    try {
        message.textContent = "Creating your account...";

        const response = await fetch(`${API}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Registration failed");
        }

        // Automatically login after successful registration
        await loginUser(email, password);

    } catch (error) {
        message.textContent = error.message;
    }
});

// LOGIN FUNCTION
async function loginUser(email, password) {
    const response = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Login failed");
    }

    currentUser = data.user;

    localStorage.setItem("shopEaseUser", JSON.stringify(data.user));
    localStorage.setItem("shopEaseToken", data.token);

    showWelcome();
}

// LOGIN FORM
document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    const message = document.getElementById("loginMessage");

    try {
        message.textContent = "Logging in...";

        await loginUser(email, password);

    } catch (error) {
        message.textContent = error.message;
    }
});

// START SHOPPING
document.getElementById("startShoppingBtn").addEventListener("click", () => {
    showShop();
});

// LOAD PRODUCTS
async function loadProducts() {
    const container = document.getElementById("productList");

    try {
        const response = await fetch(`${API}/products`);

        if (!response.ok) {
            throw new Error("Unable to load products");
        }

        products = await response.json();
        displayProducts();

    } catch (error) {
        container.textContent = error.message;
    }
}

// DISPLAY AND FILTER PRODUCTS
function displayProducts() {
    const container = document.getElementById("productList");

    const searchText = document.getElementById("searchInput")
        .value.toLowerCase().trim();

    const selectedCategory = document.getElementById("categoryFilter").value;

    const filteredProducts = products.filter(product => {
        const matchesSearch =
            product.name.toLowerCase().includes(searchText);

        const matchesCategory =
            selectedCategory === "All" ||
            product.category === selectedCategory;

        return matchesSearch && matchesCategory;
    });

    container.innerHTML = "";

    if (filteredProducts.length === 0) {
        container.innerHTML = "<p>No products found.</p>";
        return;
    }

    filteredProducts.forEach(product => {
        container.innerHTML += `
            <div class="product-card">
                <img src="${product.image}" alt="${product.name}"
                     onerror="this.style.display='none'">

                <h3>${product.name}</h3>
                <p>${product.description}</p>
                <p class="price">₹${product.price}</p>
                <p>Available stock: ${product.stock}</p>

                <button onclick="addToWishlist('${product._id}')">
                    ❤️ Add to Wishlist
                </button>

                <button
                    onclick="addToCart('${product._id}')"
                    ${product.stock <= 0 ? "disabled" : ""}>
                    Add to Cart 🛒
                </button>
            </div>
        `;
    });
}

// SEARCH AND CATEGORY EVENTS
document.getElementById("searchInput").addEventListener("input", displayProducts);

document.getElementById("categoryFilter").addEventListener("change", displayProducts);


// ADD TO CART
async function addToCart(productId) {
    if (!currentUser) {
        alert("Please login first.");
        showAuth();
        return;
    }

    try {
        const response = await fetch(`${API}/cart/${getUserId()}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                productId,
                quantity: 1
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Could not add product");
        }

        alert("Product added to your cart! 💗");
        await loadCart();

    } catch (error) {
        alert(error.message);
    }
}

// UPDATE CART QUANTITY
async function updateCartQuantity(productId, quantity) {
    try {
        if (quantity < 1) {
            await removeCartItem(productId);
            return;
        }

        const response = await fetch(
            `${API}/cart/${getUserId()}/${productId}`,
            {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ quantity })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Unable to update quantity");
        }

        await loadCart();

    } catch (error) {
        alert(error.message);
    }
}

// REMOVE CART ITEM
async function removeCartItem(productId) {
    try {
        const response = await fetch(
            `${API}/cart/${getUserId()}/${productId}`,
            { method: "DELETE" }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Unable to remove product");
        }

        await loadCart();

    } catch (error) {
        alert(error.message);
    }
}

// LOAD CART
async function loadCart() {
    if (!currentUser) return;

    try {
        const response = await fetch(`${API}/cart/${getUserId()}`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Unable to load cart");
        }

        cart = data.items || [];
        displayCart();

    } catch (error) {
        console.error("Cart error:", error);
    }
}

// DISPLAY CART
function displayCart() {
    const container = document.getElementById("cartItems");
    const totalElement = document.getElementById("cartTotal");

    container.innerHTML = "";
    let total = 0;

    if (cart.length === 0) {
        container.textContent = "Your shopping cart is empty. 💜";
        totalElement.textContent = "Total: ₹0";
        return;
    }

    cart.forEach(item => {
        const product = item.product;

        if (!product) return;

        const subtotal = product.price * item.quantity;
        total += subtotal;

        container.innerHTML += `
            <div class="cart-item">
                <h3>${product.name}</h3>
                <p>Price: ₹${product.price}</p>

                <div class="quantity-controls">
                    <button onclick="updateCartQuantity('${product._id}', ${item.quantity - 1})">−</button>
                    <span>${item.quantity}</span>
                    <button onclick="updateCartQuantity('${product._id}', ${item.quantity + 1})">+</button>
                </div>

                <p>Subtotal: ₹${subtotal}</p>

                <button class="remove-btn"
                    onclick="removeCartItem('${product._id}')">
                    Remove
                </button>
            </div>
        `;
    });

    totalElement.textContent = `Total: ₹${total}`;
}

// PLACE ORDER
document.getElementById("checkoutForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!currentUser) return;

    try {
        await loadCart();

        if (cart.length === 0) {
            alert("Your cart is empty.");
            return;
        }

        const orderProducts = cart.map(item => ({
            product: item.product._id,
            quantity: item.quantity,
            price: item.product.price
        }));

        const totalAmount = cart.reduce((sum, item) => {
            return sum + item.product.price * item.quantity;
        }, 0);

        const response = await fetch(`${API}/orders`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                user: getUserId(),
                products: orderProducts,
                totalAmount,
                shippingAddress:
                    document.getElementById("shippingAddress").value,
                paymentMethod:
                    document.getElementById("paymentMethod").value
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Order failed");
        }

        document.getElementById("orderMessage").textContent =
            "🎉 Order placed successfully! Thank you for shopping with ShopEase.";

        document.getElementById("checkoutForm").reset();

// Clear cart after successful order
const clearResponse = await fetch(`${API}/cart/${getUserId()}`, {
    method: "DELETE"
});

if (!clearResponse.ok) {
    alert("Order placed, but cart could not be cleared.");
}

cart = [];
displayCart();

await loadOrders();

    } catch (error) {
        document.getElementById("orderMessage").textContent = error.message;
    }
});

// LOAD ORDERS
async function loadOrders() {
    if (!currentUser) return;

    const container = document.getElementById("orderList");

    try {
        const response = await fetch(`${API}/orders/${getUserId()}`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Unable to load orders");
        }

        const orders = Array.isArray(data) ? data : [data];

        container.innerHTML = "";

        if (orders.length === 0) {
            container.textContent = "No orders yet. Start shopping! 💗";
            return;
        }

        orders.forEach(order => {
            container.innerHTML += `
                <div class="order-card">
                    <h3>📦 Order #${order._id}</h3>
                    <p>Total: ₹${order.totalAmount}</p>
                    <p>Payment: ${order.paymentMethod}</p>
                    <p>Status: ${order.orderStatus}</p>
                    <p>Address: ${order.shippingAddress}</p>
                </div>
            `;
        });

    } catch (error) {
        container.textContent = error.message;
    }
}

// REFRESH ORDERS
document.getElementById("loadOrdersBtn").addEventListener("click", loadOrders);

// ACCOUNT DETAILS
function showAccount() {
    const container = document.getElementById("accountDetails");

    container.innerHTML = `
        <h3>👋 ${currentUser.name}</h3>
        <p><strong>Email:</strong> ${currentUser.email}</p>
        <p><strong>Account:</strong> Active</p>
        <p>Thank you for being part of ShopEase! 💗</p>
    `;
}

// LOGOUT
document.getElementById("logoutBtn").addEventListener("click", () => {
    currentUser = null;
    cart = [];

    localStorage.removeItem("shopEaseUser");
    localStorage.removeItem("shopEaseToken");

    showAuth();
});

function getAuthHeaders() {
    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("shopEaseToken")}`
    };
}

// LOAD WISHLIST
async function loadWishlist() {
    try {
        const response = await fetch(`${API}/wishlist`, {
            headers: getAuthHeaders()
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Unable to load wishlist");
        }

        wishlist = data;
        displayProducts();

        const wishlistContainer = document.getElementById("wishlistItems");
        if (wishlistContainer) displayWishlist();

    } catch (error) {
        console.error("Wishlist error:", error);
    }
}

// ADD TO WISHLIST
async function addToWishlist(productId) {
    try {
        const response = await fetch(`${API}/wishlist/${productId}`, {
            method: "POST",
            headers: getAuthHeaders()
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Unable to add wishlist");
        }

        alert("Added to your wishlist! ❤️");
        await loadWishlist();

    } catch (error) {
        alert(error.message);
    }
}

// REMOVE FROM WISHLIST
async function removeFromWishlist(productId) {
    try {
        const response = await fetch(`${API}/wishlist/${productId}`, {
            method: "DELETE",
            headers: getAuthHeaders()
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Unable to remove item");
        }

        await loadWishlist();
    } catch (error) {
        alert(error.message);
    }
}

// DISPLAY WISHLIST
function displayWishlist() {
    const container = document.getElementById("wishlistItems");

    if (!container) return;

    container.innerHTML = "";

    if (wishlist.length === 0) {
        container.textContent = "Your wishlist is empty. ❤️";
        return;
    }

    wishlist.forEach(product => {
        if (!product) return;

        container.innerHTML += `
            <div class="product-card">
                <img src="${product.image}" alt="${product.name}"
                     onerror="this.style.display='none'">
                <h3>${product.name}</h3>
                <p>₹${product.price}</p>
                <button onclick="removeFromWishlist('${product._id}')">
                    Remove ❤️
                </button>
                <button onclick="addToCart('${product._id}')">
                    Add to Cart 🛒
                </button>
            </div>
        `;
    });
}

// INITIALIZE
if (currentUser) {
    showShop();
} else {
    showAuth();
}

// MAKE CART FUNCTIONS AVAILABLE TO HTML BUTTONS
window.updateCartQuantity = updateCartQuantity;
window.removeCartItem = removeCartItem;
window.addToCart = addToCart;