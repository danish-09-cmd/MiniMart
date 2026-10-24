# MiniMart Manual Test Checklist

Run the backend with the local profile and the frontend at `http://localhost:5173`. Use a customer demo account (`asha@example.com` or `rohan@example.com`, password `password`) unless a step calls for a second customer account.

## Account and catalog

- [ ] Register a new customer with valid details and confirm the app returns to the intended page after registration.
- [ ] Log out, sign in again, and refresh the browser. Confirm the session is restored and the account remains signed in.
- [ ] Try invalid registration and login input; confirm validation and backend errors are visible.
- [ ] Search products, select a category, change price and stock filters, and change sorting.
- [ ] Confirm the filters and page are encoded in the URL, survive refresh, and respond to browser Back/Forward navigation.
- [ ] Open a product detail page and use its Back to products link.

## Cart and addresses

- [ ] Add a product from a card and from its detail page. Confirm the Navbar count and cart total update.
- [ ] Change cart quantities, remove one item, clear the cart, and confirm the empty state and Continue shopping link.
- [ ] Try to increase a cart quantity beyond available stock. Confirm the backend message is shown and the cart remains consistent.
- [ ] Open Addresses and submit an empty form. Confirm required fields are shown under their inputs.
- [ ] Enter an invalid phone number or PIN code and confirm client validation; then add a valid first address and verify its Default badge.
- [ ] Add a second address, edit it, set it as default, and verify the list reloads with the new default.
- [ ] Try deleting an address already used by an order and confirm the backend message is shown.

## Checkout and payments

- [ ] Open Checkout with an empty cart and confirm it redirects to Cart.
- [ ] Place an order using CARD with a valid 12-19 digit mock number that does not end in `0000`. Confirm success, order ID, total, and View order link.
- [ ] Place another order using a card number ending in `0000`. Confirm payment failure, then retry with another valid number. Confirm the retry uses the original order ID and does not create a second order.
- [ ] Place an order with UPI and confirm payment succeeds.
- [ ] Place an order with COD and confirm the page says “Order placed, pay on delivery” and payment remains pending.
- [ ] Confirm the card input is cleared after submission and the full card number is not in the URL, browser storage, or order details.

## Orders and isolation

- [ ] Open Order history and confirm the newest orders appear first with order and payment badges.
- [ ] If there are more than 10 orders, use pagination and confirm the URL page changes.
- [ ] Open an order detail page and confirm purchase price, line totals, total, address snapshot, payment method, and statuses.
- [ ] Cancel a PLACED order and confirm its status changes to CANCELLED and the affected product stock is restored.
- [ ] Sign in as the other customer and open the first customer's order URL. Confirm the page shows “Order not found”.
- [ ] Open an unknown route and confirm the friendly Not Found page appears.

## Admin

Sign in as `admin@minimart.local` with password `password` for these checks.

- [ ] Sign in as a customer and open `/admin`. Confirm access is blocked, a toast explains the restriction, and the app returns to Home.
- [ ] Sign in as the admin and open Dashboard, Products, Categories, and Orders from the admin navigation.
- [ ] Compare dashboard user count, order count, revenue, and order status counts with the records in the local database/API.
- [ ] Create a product with a valid category and a JPG, PNG, or WebP image under 2 MB. Confirm the new product and preview appear in the admin list.
- [ ] Try an invalid product price, negative stock, unsupported image type, and image over 2 MB. Confirm client validation blocks submission.
- [ ] Deactivate a product, then search for it in the public catalog. Confirm it has an Inactive badge in admin and is hidden publicly.
- [ ] Create and edit a category. Try to delete a category that still has products and confirm the backend message appears; delete an unused category successfully.
- [ ] Open an order in Admin Orders and confirm customer name/email, items, address snapshot, totals, and statuses are shown.
- [ ] Move a PLACED order to SHIPPED, then to DELIVERED. Move a PAID order to SHIPPED. Confirm the list refreshes and COD payment becomes successful when delivered.
- [ ] Try to request an invalid order status transition (for example DELIVERED back to SHIPPED) through the API or Swagger. Confirm the backend rejects it and the UI surfaces the message when a transition is rejected.
- [ ] Confirm DELIVERED and CANCELLED orders show no further status options.
