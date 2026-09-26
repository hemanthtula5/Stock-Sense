# StockSense IMS

This project follows the supplied StockSense specification: HTML5 + Bootstrap 5 + Vanilla JavaScript frontend, Node.js + Express REST backend, MySQL database, authentication, dashboard KPIs, products, receipts, deliveries, transfers, adjustments and stock ledger. See the supplied specification for the full requirements. 

## Setup
1. Install Node.js and MySQL.
2. Run `database/schema.sql` in MySQL Workbench.
3. Copy `.env.example` to `.env` and set DB_PASSWORD and JWT_SECRET.
4. Run `npm install`.
5. Run `npm start`.
6. Open `http://localhost:5000/login.html`.
7. Create an account and demonstrate: Receipt -> Transfer -> Delivery -> Adjustment -> Ledger.

## Important
Stock changes happen in backend MySQL transactions. Delivery/transfer operations reject insufficient stock. Dashboard values are loaded from REST APIs rather than hardcoded.
