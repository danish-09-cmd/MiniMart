-- Demo-only account password for every seeded user: password
-- Replace these accounts and credentials before deploying the application.
INSERT IGNORE INTO users (id, name, email, password, role) VALUES
(1, 'MiniMart Admin', 'admin@minimart.local', '$2a$10$r0JbadM3023oNM0HjZgGxONX.KdxJ0JJiEY0ZX.clAsXKxxkEFKhq', 'ROLE_ADMIN'),
(2, 'Asha Sharma', 'asha@example.com', '$2a$10$r0JbadM3023oNM0HjZgGxONX.KdxJ0JJiEY0ZX.clAsXKxxkEFKhq', 'ROLE_USER'),
(3, 'Rohan Mehta', 'rohan@example.com', '$2a$10$r0JbadM3023oNM0HjZgGxONX.KdxJ0JJiEY0ZX.clAsXKxxkEFKhq', 'ROLE_USER');

INSERT IGNORE INTO addresses (id, user_id, full_name, phone, line1, line2, city, state, pincode, is_default) VALUES
(1, 2, 'Asha Sharma', '9876543210', '12 MG Road', 'Near City Park', 'Bengaluru', 'Karnataka', '560001', TRUE),
(2, 2, 'Asha Sharma', '9876543210', '8 Lake View', NULL, 'Bengaluru', 'Karnataka', '560034', FALSE),
(3, 3, 'Rohan Mehta', '9876501234', '44 Park Street', NULL, 'Kolkata', 'West Bengal', '700016', TRUE);

INSERT IGNORE INTO categories (id, name, description) VALUES
(1, 'Groceries', 'Everyday pantry and household essentials.'),
(2, 'Electronics', 'Useful electronics and accessories.'),
(3, 'Home & Kitchen', 'Practical products for home and kitchen.'),
(4, 'Books', 'Books for learning and leisure.'),
(5, 'Fashion', 'Comfortable everyday clothing and accessories.');

INSERT IGNORE INTO products (id, name, description, price, stock_quantity, image_url, category_id, active) VALUES
(1, 'Basmati Rice 5kg', 'Long-grain basmati rice for everyday meals.', 649.00, 24, '/product-images/basmati-rice-5kg.jpg', 1, TRUE),
(2, 'Cold Pressed Sunflower Oil 1L', 'Light cooking oil in a convenient one-litre bottle.', 189.00, 32, '/product-images/sunflower-oil-1l.jpg', 1, TRUE),
(3, 'Assorted Tea Bags 100ct', 'A balanced assortment of black and green tea bags.', 299.00, 18, '/product-images/assorted-tea-bags-100ct.jpg', 1, TRUE),
(4, 'Rolled Oats 1kg', 'Whole-grain rolled oats for breakfast and baking.', 220.00, 15, '/product-images/organic-rolled-oats-1kg.jpg', 1, TRUE),
(5, 'Arabica Coffee 250g', 'Medium-roast ground Arabica coffee.', 399.00, 11, '/product-images/arabica-coffee-250g.jpg', 1, TRUE),
(6, 'Wireless Mouse', 'Compact wireless mouse with adjustable sensitivity.', 799.00, 20, '/product-images/wireless-mouse.jpg', 2, TRUE),
(7, 'USB-C Fast Charger', '30W USB-C wall charger for compatible devices.', 1199.00, 14, '/product-images/usb-c-fast-charger.jpg', 2, TRUE),
(8, 'Bluetooth Headphones', 'Over-ear headphones with cushioned ear pads.', 2499.00, 9, '/product-images/bluetooth-headphones.jpg', 2, TRUE),
(9, 'Portable Bluetooth Speaker', 'Small rechargeable speaker for home or travel.', 1799.00, 7, '/product-images/portable-bluetooth-speaker.jpg', 2, TRUE),
(10, 'USB-C Hub 6-in-1', 'Multiport hub with HDMI, USB, and card reader ports.', 2199.00, 4, '/product-images/usb-c-hub-6-in-1.jpg', 2, TRUE),
(11, 'Stainless Steel Water Bottle', 'Reusable insulated bottle with a leak-resistant lid.', 549.00, 28, '/product-images/water-bottle.jpg', 3, TRUE),
(12, 'Ceramic Dinner Set', 'Six-piece glazed ceramic dinner set.', 1499.00, 8, '/product-images/ceramic-dinner-set.jpg', 3, TRUE),
(13, 'Cotton Kitchen Towels 4-Pack', 'Absorbent cotton towels for everyday kitchen use.', 399.00, 21, '/product-images/cotton-kitchen-towels-4-pack.jpg', 3, TRUE),
(14, 'Non-stick Frying Pan', '26 cm non-stick pan with a heat-resistant handle.', 899.00, 12, '/product-images/non-stick-frying-pan.jpg', 3, TRUE),
(15, 'LED Desk Lamp', 'Dimmable LED desk lamp with a flexible neck.', 1299.00, 3, '/product-images/led-desk-lamp.jpg', 3, TRUE),
(16, 'Java Guide', 'A beginner-friendly introduction to modern Java programming.', 499.00, 16, '/product-images/everyday-java-guide.jpg', 4, TRUE),
(17, 'The Pocket Cookbook', 'Simple recipes for quick home-cooked meals.', 350.00, 19, '/product-images/pocket-cookbook.jpg', 4, TRUE),
(18, 'Cotton T-Shirt', 'Soft cotton crew-neck T-shirt for daily wear.', 599.00, 25, '/product-images/classic-cotton-t-shirt.jpg', 5, TRUE),
(19, 'Canvas Travel Backpack', 'Lightweight backpack with a padded laptop sleeve.', 1899.00, 6, '/product-images/canvas-travel-backpack.jpg', 5, TRUE),
(20, 'Baseball Cap', 'Adjustable cotton cap with a curved brim.', 449.00, 13, '/product-images/everyday-baseball-cap.jpg', 5, TRUE);

-- Migrate only the old seed illustrations or external placeholders; preserve custom uploads.
UPDATE products SET image_url = CASE id
    WHEN 1 THEN '/product-images/basmati-rice-5kg.jpg'
    WHEN 2 THEN '/product-images/sunflower-oil-1l.jpg'
    WHEN 3 THEN '/product-images/assorted-tea-bags-100ct.jpg'
    WHEN 4 THEN '/product-images/organic-rolled-oats-1kg.jpg'
    WHEN 5 THEN '/product-images/arabica-coffee-250g.jpg'
    WHEN 6 THEN '/product-images/wireless-mouse.jpg'
    WHEN 7 THEN '/product-images/usb-c-fast-charger.jpg'
    WHEN 8 THEN '/product-images/bluetooth-headphones.jpg'
    WHEN 9 THEN '/product-images/portable-bluetooth-speaker.jpg'
    WHEN 10 THEN '/product-images/usb-c-hub-6-in-1.jpg'
    WHEN 11 THEN '/product-images/water-bottle.jpg'
    WHEN 12 THEN '/product-images/ceramic-dinner-set.jpg'
    WHEN 13 THEN '/product-images/cotton-kitchen-towels-4-pack.jpg'
    WHEN 14 THEN '/product-images/non-stick-frying-pan.jpg'
    WHEN 15 THEN '/product-images/led-desk-lamp.jpg'
    WHEN 16 THEN '/product-images/everyday-java-guide.jpg'
    WHEN 17 THEN '/product-images/pocket-cookbook.jpg'
    WHEN 18 THEN '/product-images/classic-cotton-t-shirt.jpg'
    WHEN 19 THEN '/product-images/canvas-travel-backpack.jpg'
    WHEN 20 THEN '/product-images/everyday-baseball-cap.jpg'
END
WHERE id BETWEEN 1 AND 20
  AND (image_url LIKE '/seed-images/%.svg' OR image_url LIKE 'https://placehold.co/%');
