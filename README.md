# MiniMart

A backend e-commerce application built with Java 17, Spring Boot, Spring Data JPA, Spring Security, JWT, Bean Validation, springdoc-openapi, and MySQL. It includes customer and admin APIs for catalog management, cart, addresses, checkout, payments, order history, and order administration.

## Backend prerequisites

- Java 17 or newer
- Maven 3.6.3 or newer
- MySQL 8

Create the database first if your MySQL account cannot create it automatically:

```sql
CREATE DATABASE ministore CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
```

Create the local profile file from the committed example, then set your MySQL credentials and a private random JWT secret of at least 32 UTF-8 bytes:

```powershell
Copy-Item backend/src/main/resources/application-local.properties.example `
  backend/src/main/resources/application-local.properties
notepad backend/src/main/resources/application-local.properties
```

From the `backend` directory, start the API with the local profile:

```powershell
cd backend
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

On startup, `schema.sql` creates the tables and `data.sql` inserts the demo users, sample addresses, five categories, and twenty products. Hibernate validates its entity mappings against that schema. The local profile file is git-ignored.

Check `http://localhost:8080/api/health` for `{ "status": "UP" }`. Open Swagger at `http://localhost:8080/swagger-ui.html`. Use `POST /api/auth/login` in Swagger with one of the demo accounts below, copy the returned `token`, choose **Authorize**, and paste the token to call protected endpoints.

## Authentication API

Base URL: `http://localhost:8080`

### Register a user

```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Sam Example","email":"sam@example.com","password":"StrongPass123"}'
```

### Log in

Seeded demo accounts use the password `password` (local demo use only):

- Admin: `admin@minimart.local`
- User: `asha@example.com`
- User: `rohan@example.com`

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"asha@example.com","password":"password"}'
```

The response includes a bearer JWT and a safe user profile. Use its token to fetch the current profile:

```bash
curl http://localhost:8080/api/auth/me \
  -H "Authorization: Bearer <paste-token-here>"
```

Errors use a consistent JSON response. Validation errors also include a `fieldErrors` map:

```json
{
  "timestamp": "2026-10-23T12:00:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Request validation failed",
  "path": "/api/auth/register",
  "fieldErrors": { "password": "Password must contain between 8 and 72 characters" }
}
```

The API accepts browser requests from the Vite development origin `http://localhost:5173`. Use a private random JWT secret and replace the seeded demo accounts before deployment.

## Categories and products API

Public endpoints:

- `GET /api/categories` and `GET /api/categories/{id}`
- `GET /api/products` with `page`, `size`, `sortBy`, `sortDir`, `keyword`, `categoryId`, `minPrice`, `maxPrice`, and `inStock` query parameters
- `GET /api/products/{id}`

Admin endpoints require a bearer token for `ROLE_ADMIN`:

- `POST`, `PUT /{id}`, and `DELETE /{id}` under `/api/admin/categories`
- `GET`, `POST`, `PUT /{id}`, and `DELETE /{id}` under `/api/admin/products`
- `POST /api/admin/products/{id}/image` with multipart field `file` (jpg, jpeg, png, or webp; up to 2 MB)

Product list responses use `{content, page, size, totalElements, totalPages, last}`. Public listing and detail endpoints hide soft-deleted products. Uploaded images are stored under `app.upload.dir` (default `./uploads`) and served from `/uploads/**`.

## Cart, addresses, checkout and orders API

These endpoints require a bearer JWT for a `ROLE_USER`. The authenticated account is taken from the token; request bodies cannot select another user's cart, address, or orders.

- `GET /api/cart` returns line prices, quantities, line totals, grand total, and total units.
- `POST /api/cart/items` adds `{ "productId": 1, "quantity": 2 }`. Adding an existing product increases its quantity.
- `PUT /api/cart/items/{productId}` sets `{ "quantity": 3 }`; quantity `0` removes it.
- `DELETE /api/cart/items/{productId}` removes one line; `DELETE /api/cart` clears all lines.
- `POST /api/addresses` and `PUT /api/addresses/{id}` accept `fullName`, 10-digit `phone`, `line1`, optional `line2`, `city`, `state`, and 6-digit `pincode`.
- `GET /api/addresses`, `DELETE /api/addresses/{id}`, and `PUT /api/addresses/{id}/default` manage the current user's addresses. The first address is the default; an address used by an order cannot be deleted.
- `POST /api/orders` accepts `{ "addressId": 1 }`. The server locks and checks product rows, calculates prices and totals, reduces stock, records an address snapshot, and clears the cart in one transaction.
- `GET /api/orders?page=0&size=10`, `GET /api/orders/{id}`, and `PUT /api/orders/{id}/cancel` provide the current user's order history and cancellation. Cancellation is limited to `PLACED` orders and restores stock.
- `POST /api/payments/mock` accepts `{ "orderId": 1, "method": "CARD", "cardNumber": "4111111111110000" }`. CARD numbers ending in `0000` simulate failure; another CARD or UPI succeeds; COD stays pending until delivery. Card data is never saved or logged.

Insufficient stock returns HTTP 409 with the available quantity. Validation and invalid state changes return HTTP 400. A different user's address or order is reported as HTTP 404.

## Admin orders and dashboard

These endpoints require a bearer JWT for `ROLE_ADMIN`:

- `GET /api/admin/orders?page=0&size=10&status=PLACED` lists newest orders; omit `status` to show all.
- `GET /api/admin/orders/{id}` returns full order data and customer name/email.
- `PUT /api/admin/orders/{id}/status` accepts `{ "status": "SHIPPED" }` or `{ "status": "DELIVERED" }`.
- `GET /api/admin/dashboard` returns customer/order counts, successful non-cancelled revenue, counts for every status, and active products with fewer than five units.

Online payments set an order to `PAID`; the admin can move it from `PAID` to `SHIPPED`, then `DELIVERED`. COD orders follow `PLACED` to `SHIPPED` to `DELIVERED`, and COD payment becomes successful on delivery.

## End-to-end API example (PowerShell with `curl.exe`)

Run each section in one PowerShell window while the backend is running. Demo passwords are `password`.

```powershell
# User login
$userLogin = curl.exe -sS -X POST http://localhost:8080/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"asha@example.com","password":"password"}' | ConvertFrom-Json
$userToken = $userLogin.token

# Add product 1 to the cart and view the server-calculated totals
$cartBody = @{ productId = 1; quantity = 2 } | ConvertTo-Json -Compress
curl.exe -sS -X POST http://localhost:8080/api/cart/items `
  -H "Authorization: Bearer $userToken" -H "Content-Type: application/json" -d $cartBody
curl.exe -sS http://localhost:8080/api/cart -H "Authorization: Bearer $userToken"

# Create an address and keep the returned ID
$addressBody = @{
  fullName = "Asha Sharma"; phone = "9876543210"; line1 = "12 MG Road"; line2 = "Near City Park"
  city = "Bengaluru"; state = "Karnataka"; pincode = "560001"
} | ConvertTo-Json -Compress
$address = curl.exe -sS -X POST http://localhost:8080/api/addresses `
  -H "Authorization: Bearer $userToken" -H "Content-Type: application/json" -d $addressBody | ConvertFrom-Json
$addressId = $address.id

# Place the first order, then complete it with UPI
$placeBody = @{ addressId = $addressId } | ConvertTo-Json -Compress
$paidOrder = curl.exe -sS -X POST http://localhost:8080/api/orders `
  -H "Authorization: Bearer $userToken" -H "Content-Type: application/json" -d $placeBody | ConvertFrom-Json
$upiBody = @{ orderId = $paidOrder.id; method = "UPI" } | ConvertTo-Json -Compress
curl.exe -sS -X POST http://localhost:8080/api/payments/mock `
  -H "Authorization: Bearer $userToken" -H "Content-Type: application/json" -d $upiBody

# Place another order; simulate a card failure, then retry successfully
$cartBody = @{ productId = 1; quantity = 1 } | ConvertTo-Json -Compress
curl.exe -sS -X POST http://localhost:8080/api/cart/items `
  -H "Authorization: Bearer $userToken" -H "Content-Type: application/json" -d $cartBody
$retryOrder = curl.exe -sS -X POST http://localhost:8080/api/orders `
  -H "Authorization: Bearer $userToken" -H "Content-Type: application/json" -d $placeBody | ConvertFrom-Json
$failedCard = @{ orderId = $retryOrder.id; method = "CARD"; cardNumber = "4111111111110000" } | ConvertTo-Json -Compress
curl.exe -sS -X POST http://localhost:8080/api/payments/mock `
  -H "Authorization: Bearer $userToken" -H "Content-Type: application/json" -d $failedCard
$retryCard = @{ orderId = $retryOrder.id; method = "CARD"; cardNumber = "4111111111111111" } | ConvertTo-Json -Compress
curl.exe -sS -X POST http://localhost:8080/api/payments/mock `
  -H "Authorization: Bearer $userToken" -H "Content-Type: application/json" -d $retryCard
curl.exe -sS "http://localhost:8080/api/orders?page=0&size=10" -H "Authorization: Bearer $userToken"

# Place a third order and cancel it before payment; stock is restored on cancellation
$beforeStock = (curl.exe -sS http://localhost:8080/api/products/2 | ConvertFrom-Json).stockQuantity
$cartBody = @{ productId = 2; quantity = 1 } | ConvertTo-Json -Compress
curl.exe -sS -X POST http://localhost:8080/api/cart/items `
  -H "Authorization: Bearer $userToken" -H "Content-Type: application/json" -d $cartBody
$cancelOrder = curl.exe -sS -X POST http://localhost:8080/api/orders `
  -H "Authorization: Bearer $userToken" -H "Content-Type: application/json" -d $placeBody | ConvertFrom-Json
curl.exe -sS -X PUT "http://localhost:8080/api/orders/$($cancelOrder.id)/cancel" `
  -H "Authorization: Bearer $userToken"
$afterStock = (curl.exe -sS http://localhost:8080/api/products/2 | ConvertFrom-Json).stockQuantity
"Stock before=$beforeStock after cancellation=$afterStock"

# Admin login, view orders, ship and deliver the paid online order, then view dashboard
$adminLogin = curl.exe -sS -X POST http://localhost:8080/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"admin@minimart.local","password":"password"}' | ConvertFrom-Json
$adminToken = $adminLogin.token
curl.exe -sS "http://localhost:8080/api/admin/orders?page=0&size=10" -H "Authorization: Bearer $adminToken"
$shipBody = @{ status = "SHIPPED" } | ConvertTo-Json -Compress
curl.exe -sS -X PUT "http://localhost:8080/api/admin/orders/$($paidOrder.id)/status" `
  -H "Authorization: Bearer $adminToken" -H "Content-Type: application/json" -d $shipBody
$deliverBody = @{ status = "DELIVERED" } | ConvertTo-Json -Compress
curl.exe -sS -X PUT "http://localhost:8080/api/admin/orders/$($paidOrder.id)/status" `
  -H "Authorization: Bearer $adminToken" -H "Content-Type: application/json" -d $deliverBody
curl.exe -sS http://localhost:8080/api/admin/dashboard -H "Authorization: Bearer $adminToken"
```

## Features

- JWT registration, login, session restoration, and `ROLE_USER` / `ROLE_ADMIN` authorization.
- Product and category browsing with search, filters, sorting, pagination, details, and responsive layouts.
- Customer cart, address book, checkout, and mock CARD, UPI, and COD payments.
- Server-calculated order totals, stock checks, order history, order details, cancellation, and stock restoration.
- Admin dashboard, product and image management, category management, and order status administration.
- Bean Validation, consistent JSON errors, Swagger/OpenAPI with bearer authentication, and a public health endpoint.
- MySQL persistence, database transactions for checkout and stock changes, and local environment configuration.

## Technology stack

- Backend: Java 17, Spring Boot, Spring MVC, Spring Data JPA, Spring Security, JWT, Bean Validation, springdoc-openapi.
- Database: MySQL 8.
- Frontend: React, Vite, React Router, Axios, Bootstrap, and React Toastify.
- Build tools: Maven and npm.

## Backend tests

The service unit tests use JUnit 5 and Mockito. The two controller tests use MockMvc. The test suite does not require a running MySQL server. Run it from the `backend` directory:

```powershell
mvn clean verify
```

## Frontend

The frontend uses React, Vite, React Router, Axios, Bootstrap, and React Toastify. Start the backend first, then run the frontend from a separate PowerShell window:

```powershell
Set-Location 'frontend'
Copy-Item .env.example .env
npm.cmd install
npm.cmd run dev
```

The Vite development server is available at `http://localhost:5173`. The local environment file contains the API origin:

```dotenv
VITE_API_URL=http://localhost:8080
```

Change `VITE_API_URL` in `frontend/.env` if the backend uses another origin, then restart Vite. The environment file is ignored by Git; `.env.example` is committed as a template.

The customer area includes public product browsing, search and filters, registration and login, cart management, address management, checkout with mock CARD/UPI/COD payment, order history, and order details. The admin area includes the dashboard, product and image management, category management, and order status administration. Admin pages require the seeded admin account; customers are redirected away from `/admin`.

Frontend source layout:

```text
frontend/src/
  api/          Axios API modules
  components/   Shared navigation, forms, badges, pagination, and product UI
  context/      Authentication and cart state
  pages/        Customer and admin routes
  utils/        API errors, currency, image URLs, and navigation helpers
```

For local demo sign-in, use `admin@minimart.local` for admin screens, or `asha@example.com` and `rohan@example.com` for customer screens. Each seeded account uses the demo password `password`. Use customer accounts for cart, checkout, addresses, and order routes.

## Screenshots

Add screenshots of the customer catalog, checkout, admin dashboard, and product management to `docs/screenshots/` when available.

- Admin dashboard placeholder: `docs/screenshots/admin-dashboard.png`
- Product management placeholder: `docs/screenshots/admin-products.png`
- Customer checkout placeholder: `docs/screenshots/customer-checkout.png`

Create a manual test database with the steps in [MANUAL_TEST_CHECKLIST.md](MANUAL_TEST_CHECKLIST.md).
