
// variables
const cartBtn = document.querySelector(".cart-btn");
const closeCartBtn = document.querySelector(".close-cart");
const cartDOM = document.querySelector(".cart");
const cartOverlay = document.querySelector(".cart-overlay");
const cartItems = document.querySelector(".cart-items");
const cartTotal = document.querySelector(".cart-total");
const productsDOM = document.querySelector(".cart-articles");
const totalDOM = document.querySelector(".order-box");
const couponDOM = document.querySelector(".coupon-box");
const priceadjuster = new Intl.NumberFormat('es-MX',
				{ style: 'currency', currency: 'MXN',
				  minimumFractionDigits: 2 });

let cart = [];
let coupons = [];
let buttonsDOM = [];
let activeCoupon = [];
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

	async getCoupons() {

		try {
			let result = await fetch("coupons.json");
			let data = await result.json();
			/* let contentful = await client.getEntries({
				content_type: "comfyHouseProducts"
			}); */
			//console.log(contentful.items);

			let coupon = data.items;
			coupon = coupon.map(item => {
				const couponCode = item.couponCode;
				const type = item.type;
				const discount  = item.discount;
				const idProducts = item.idProducts;
				return { couponCode, type, discount, idProducts };
			});
			return coupon;
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
                //console.log(event.target);
				let addAmount = event.target;
                let id = addAmount.dataset.id;
				let tempItem = cart.find(item => item.id === id);

				if (event.target.value == 0)
				{
					productsDOM.removeChild(addAmount.parentElement.parentElement);
					this.removeItem(id);
				}
				else
				{
					tempItem.amount = event.target.value;
					Storage.saveCart(cart);
					this.setCartValues(cart);
					//console.log(cart);
					addAmount.parentElement.nextElementSibling.innerText = priceadjuster.format(event.target.value *  tempItem.price);
				}
                //console.log(addAmount.parentElement.nextElementSibling.innerText)
			} 
			this.updateTotals(cart);
		});

		couponDOM.addEventListener("click", event => {

			if (event.target.classList.contains("btn")) {
                this.addCoupon(event.target.parentElement.previousElementSibling.value);
			}
			this.updateTotals(cart);
			//console.log(event.target);
		});
		

	}

	addCoupon(id)
	{
		activeCoupon = coupons.filter(item => item.couponCode == id);
		//in case you want to add some behavior like "invalid coupon" or something 
		if (activeCoupon.length)
		{
			console.log("Found");
		}
		else{
			console.log("NF");
		}
		
	}


	removeItem(id) {
        
        cart = cart.filter(item => item.id !== id);
        console.log(cart)
        this.setCartValues(cart);
		Storage.saveCart(cart);
	
	}
	getSingleButton(id) {
		return buttonsDOM.find(button => button.dataset.id === id);
	}

	updateTotals(cart) {
		let subTotal = 0;
		let discount = "0"; //is there any discount option?
		let discountCoupon = 0.0; 
		let discountType = "";
		let discountArticles = [];
		let shippingCost = ""; //150 unless the total is >600
		let ogPrice = 0;
		let grandTotal = 0;

		let localCart = JSON.parse(JSON.stringify(cart));

		activeCoupon.map(item => 
			{
				discountType = item.type;
				discountCoupon = parseFloat(item.discount);
				discountArticles = item.idProducts;
			});

		cart.map(item => {
			subTotal += item.price * item.amount;
			//console.log(subTotal);
		});
		ogPrice = subTotal;

		if (discountType == "product_percentage")
		{
			subTotal = 0;
			localCart.map(item => {
				if (discountArticles.includes(item.id))
				{
					item.price = item.price*(1-discountCoupon/100);
				}
				//console.log(subTotal);
			});

			localCart.map(item => {
				subTotal += item.price * item.amount;
			});
		}
		console.log(cart);
		console.log(localCart);

		let grandTotal_noship = subTotal - parseFloat(discount);

		if (discountType == "total_percentage")
		{
			grandTotal_noship = grandTotal_noship*(1-discountCoupon/100);
		}

		if (discountType == "total_fix")
		{
			grandTotal_noship = grandTotal_noship-discountCoupon;
		}

		if (grandTotal_noship >= 600 || grandTotal_noship == 0 || discountType == "free_shipping")
		{
			shippingCost = "0" ;
		}
		else
		{
			shippingCost = "150";
		}

		let discount_amount = ogPrice  - grandTotal_noship ;

		grandTotal = grandTotal_noship + parseFloat(shippingCost) - parseFloat(discount);
		
		Storage.saveCheckout({ subTotal: ogPrice, discount: discount ,coupon: discount_amount, shipping: shippingCost, total: grandTotal });


		let result = `<h3>Resumen del pedido</h3>
		<div class="d-flex">
			<h4>Subtotal</h4>
			<div class="ml-auto font-weight-bold"> ${priceadjuster.format(ogPrice)} </div>
		</div>
		<div class="d-flex">
			<h4>Descuento</h4>
			<div class="ml-auto font-weight-bold"> ${priceadjuster.format(discount)} </div>
		</div>
		<hr class="my-1">
		<div class="d-flex">
			<h4>Cupón</h4>
			<div class="ml-auto font-weight-bold"> - ${priceadjuster.format(discount_amount)} </div>
		</div>

		<div class="d-flex">
			<h4>Envío</h4>
			<div class="ml-auto font-weight-bold"> ${priceadjuster.format(shippingCost)} </div>
		</div>
		<hr>
		<div class="d-flex gr-total">
			<h5>Total</h5>
			<div class="ml-auto h5"> ${priceadjuster.format(grandTotal)} </div>
		</div>
		<hr>
		`;
		totalDOM.innerHTML = result;
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
	static saveCheckout(cart) {
		localStorage.setItem("checkout", JSON.stringify(cart));
	}
	static getCart() {
		return localStorage.getItem("cart")
			? JSON.parse(localStorage.getItem("cart"))
			: [];
	}

}


	// async function getCoupons() {

	// 	try {
	// 		let result = await fetch("coupons.json");
	// 		let data = await result.json();
	// 		/* let contentful = await client.getEntries({
	// 			content_type: "comfyHouseProducts"
	// 		}); */
	// 		//console.log(contentful.items);

	// 		let coupon = data.items;
	// 		coupon = coupon.map(item => {
	// 			const couponCode = item.couponCode;
	// 			const type = item.type;
	// 			const discount  = item.discount;
	// 			const idProducts = item.idProducts;
	// 			return { couponCode, type, discount, idProducts };
	// 		});
	// 		return coupon;
	// 	} catch (error) {
	// 		console.log(error);
	// 	}
	// }


document.addEventListener("DOMContentLoaded", () => {
	const ui = new UI();
	const products = new Products();
	ui.setupAPP();

	// get all products
	products
		.getProducts(cart)
		.then(products => {
			ui.displayProducts(products);
			ui.updateTotals(products);
			//this.getCoupons();
			//Storage.saveProducts(products);
		})
		.then(() => {
			ui.cartLogic();
		});

	products
		.getCoupons()
		.then(coupos => {
			coupons = coupos;
			//console.log(coupons);
		})
	
		//console.log(couponBox);
});

