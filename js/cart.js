
// variables
const cartBtn = document.querySelector(".cart-btn");
const closeCartBtn = document.querySelector(".close-cart");
const cartDOM = document.querySelector(".cart");
const cartOverlay = document.querySelector(".cart-overlay");
const cartItems = document.querySelector(".cart-items");
const cartTotal = document.querySelector(".cart-total");
const productsDOM = document.querySelector(".cart-articles");
const priceadjuster = new Intl.NumberFormat('es-MX',
				{ style: 'currency', currency: 'MXN',
				  minimumFractionDigits: 2 });

let cart = [];
let buttonsDOM = [];
//syntactical sugar of writing constructor function

// products
class Products {
	async getProducts(data) {
		// always returns promise so we can add .then
		// we can use await until promised is settled and return result
		
		try {
            console.log(data);
			let products = data;
			products = products.map(item => {
				const title = item.title;
				const price = item.price;
				const id  = item.id;
                const image = item.image;
                const amount = item.amount;
				return { title, price, id, image, amount };
			});

			return products;
		} catch (error) {
			console.log(error);
		}
	}
}

// ui
class UI {
	displayProducts(products) {
		let result = "";
		products.forEach(product => {
			result += `
            <tr>
            <td class="thumbnail-img">
                <a href="#">
            <img class="img-fluid" src="${product.image}" alt="" />
        </a>
            </td>
            <td class="name-pr">
                <a href="#">
                ${product.title}
        </a>
            </td>
            <td class="price-pr">
                <p>${priceadjuster.format(product.price)}</p>
            </td>
            <td class="quantity-box"><input type="number" size="4" value="${product.amount}" min="0" step="1" class="c-input-text qty text" data-id=${product.id}></td>
            <td class="total-pr">
                <p>${priceadjuster.format(product.price*product.amount)}</p>
            </td>
            <td class="remover" >
                <a href="#">
            <i class="fas fa-times" data-id=${product.id} ></i>
        </a>
            </td>
        </tr>
	 `;
		});
		productsDOM.innerHTML = result;
	}

	setCartValues(cart) {
		let tempTotal = 0;
		let itemsTotal = 0;
		cart.map(item => {
			tempTotal += item.price * item.amount;
			itemsTotal += item.amount;
        });
        console.log("listen")
            // cartTotal.innerText = parseFloat(tempTotal.toFixed(2));
            // cartItems.innerText = itemsTotal;
	}

	setupAPP() {
        cart = Storage.getCart();
		//this.setCartValues(cart);
		//this.populateCart(cart);
		//cartBtn.addEventListener("click", this.showCart);
		//closeCartBtn.addEventListener("click", this.hideCart);
	}
	
	cartLogic() {
        //console.log("hai")
		productsDOM.addEventListener("click", event => {
            //console.log(event.target)
			if (event.target.classList.contains("fa-times")) {
                //console.log("TRIGGER");
				let removeItem = event.target;
                let id = removeItem.dataset.id;
                //console.log(id);
                productsDOM.removeChild(removeItem.parentElement.parentElement.parentElement);
                //console.log("removed")
				// remove item
				this.removeItem(id);
			} else if (event.target.classList.contains("c-input-text")) {
                console.log(event.target);
				let addAmount = event.target;
                let id = addAmount.dataset.id;
				let tempItem = cart.find(item => item.id === id);
				tempItem.amount = event.target.value;
                Storage.saveCart(cart);
                this.setCartValues(cart);
                //console.log(cart);
                addAmount.parentElement.nextElementSibling.innerText = priceadjuster.format(event.target.value *  tempItem.price);
                //console.log(addAmount.parentElement.nextElementSibling.innerText)
			} 
		});
	}

	removeItem(id) {
        
        cart = cart.filter(item => item.id !== id);
        console.log(cart)
        this.setCartValues(cart);
        console.log("tessr")
		Storage.saveCart(cart);
		let button = this.getSingleButton(id);
		button.disabled = false;
		button.innerHTML = `<i class="fas fa-shopping-cart"></i>add to bag`;
	}
	getSingleButton(id) {
		return buttonsDOM.find(button => button.dataset.id === id);
	}
}

class Storage {
	static saveProducts(products) {
		localStorage.setItem("products", JSON.stringify(products));
	}
	static getProduct(id) {
		let products = JSON.parse(localStorage.getItem("products"));
		return products.find(product => product.id === id);
	}
	static saveCart(cart) {
		localStorage.setItem("cart", JSON.stringify(cart));
	}
	static getCart() {
		return localStorage.getItem("cart")
			? JSON.parse(localStorage.getItem("cart"))
			: [];
	}
}

document.addEventListener("DOMContentLoaded", () => {
	const ui = new UI();
	const products = new Products();
	ui.setupAPP();

	// get all products
	products
		.getProducts(cart)
		.then(products => {
			ui.displayProducts(products);
			//Storage.saveProducts(products);
		})
		.then(() => {
			ui.cartLogic();
		});
});

