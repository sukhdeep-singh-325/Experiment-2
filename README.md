# Experiment-2: MongoDB Product Catalog

> **Nested Schema | Aggregation Pipelines | Stock Management**

## Objective

To create a nested schema for a product catalog and implement aggregation and stock management using MongoDB.

## Demo

Run the code live on **MongoDB Playground** (no installation needed):

[![Open in MongoDB Playground](https://img.shields.io/badge/Demo-MongoDB%20Playground-green?logo=mongodb)](https://mongoplayground.net/)

> Paste the contents of `product_catalog.js` into [MongoDB Playground](https://mongoplayground.net/) to run all queries interactively in your browser.

---

## Repository Structure

```
Experiment-2/
├── product_catalog.js   # Main file: schema, data, aggregation & stock ops
└── README.md
```

---

## Nested Schema Design

Each **product document** contains nested sub-documents:

| Field | Type | Description |
|-------|------|-------------|
| `name` | String | Product name |
| `price` | Double | Base price |
| `stock` | Int | Total stock count |
| `category` | Object | `{ name, subName }` |
| `variants` | Array | `[{ sku, color, size, price, stock }]` |
| `supplier` | Object | `{ name, contact, country }` |
| `tags` | Array | Search keywords |
| `createdAt` | Date | Timestamp |

---

## Aggregation Pipelines

| # | Pipeline | Description |
|---|----------|-------------|
| 3a | `$group` by category | Total stock & average price per category |
| 3b | `$unwind` variants | Per-variant stock breakdown |
| 3c | `$match` low stock | Low stock alert (stock ≤ 10) |
| 3d | `$project` revenue | Revenue potential = price × stock |
| 3e | `$group` by supplier country | Inventory grouped by country |

---

## Stock Management Operations

| # | Operation | Description |
|---|-----------|-------------|
| 4a | `purchaseProduct()` | Atomically deducts stock on purchase |
| 4b | `restockVariant()` | Adds stock to a specific variant |
| 4c | Find all | View current stock sorted ascending |
| 4d | `updateMany` | Marks zero-stock products as `out_of_stock` |
| 4e | `$push` variant | Adds a new variant to an existing product |

---

## How to Run

### Option 1 — MongoDB Playground (Browser, No Install)
1. Go to [https://mongoplayground.net/](https://mongoplayground.net/)
2. Paste the code from `product_catalog.js`
3. Click **Run**

### Option 2 — Local MongoDB Shell
```bash
# Start MongoDB
mongod

# Open shell
mongosh

# Switch to a test database
use productCatalogDB

# Run the script
load("product_catalog.js")
```

---

## Technologies Used

- **MongoDB** — NoSQL document database
- **MongoDB Shell / mongosh** — Query execution
- **JSON Schema Validation** (`$jsonSchema`) — Schema enforcement

---

## Author

**sukhdeep-singh-325**
