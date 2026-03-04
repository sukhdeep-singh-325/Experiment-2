// MongoDB Product Catalog - Nested Schema, Aggregation & Stock Management

// ─────────────────────────────────────────────
// 1. NESTED SCHEMA DEFINITION
// ─────────────────────────────────────────────
// Each product document has nested sub-documents for category, variants, and supplier.

db.createCollection("products", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "category", "price", "stock"],
      properties: {
        name:        { bsonType: "string",  description: "Product name" },
        description: { bsonType: "string",  description: "Product description" },
        price:       { bsonType: "double",  description: "Base price" },
        stock:       { bsonType: "int",     description: "Total stock quantity" },
        category: {
          bsonType: "object",
          required: ["name"],
          properties: {
            name:    { bsonType: "string" },
            subName: { bsonType: "string" }
          }
        },
        variants: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["sku", "color", "size", "stock"],
            properties: {
              sku:   { bsonType: "string" },
              color: { bsonType: "string" },
              size:  { bsonType: "string" },
              price: { bsonType: "double" },
              stock: { bsonType: "int"    }
            }
          }
        },
        supplier: {
          bsonType: "object",
          properties: {
            name:    { bsonType: "string" },
            contact: { bsonType: "string" },
            country: { bsonType: "string" }
          }
        },
        tags:      { bsonType: "array", items: { bsonType: "string" } },
        createdAt: { bsonType: "date" }
      }
    }
  }
});


// ─────────────────────────────────────────────
// 2. INSERT SAMPLE DATA
// ─────────────────────────────────────────────

db.products.insertMany([
  {
    name: "Running Shoes",
    description: "Lightweight running shoes for daily training",
    price: 79.99,
    stock: 150,
    category: { name: "Footwear", subName: "Sports" },
    variants: [
      { sku: "RS-RED-42",  color: "Red",   size: "42", price: 79.99, stock: 50 },
      { sku: "RS-BLUE-43", color: "Blue",  size: "43", price: 84.99, stock: 60 },
      { sku: "RS-BLK-44",  color: "Black", size: "44", price: 79.99, stock: 40 }
    ],
    supplier: { name: "SpeedGear Co.", contact: "info@speedgear.com", country: "Vietnam" },
    tags: ["running", "sports", "lightweight"],
    createdAt: new Date()
  },
  {
    name: "Wireless Headphones",
    description: "Noise-cancelling over-ear headphones",
    price: 199.99,
    stock: 80,
    category: { name: "Electronics", subName: "Audio" },
    variants: [
      { sku: "WH-BLK-ONE", color: "Black",  size: "One Size", price: 199.99, stock: 40 },
      { sku: "WH-WHT-ONE", color: "White",  size: "One Size", price: 209.99, stock: 40 }
    ],
    supplier: { name: "SoundTech Ltd.", contact: "sales@soundtech.com", country: "China" },
    tags: ["wireless", "noise-cancelling", "audio"],
    createdAt: new Date()
  },
  {
    name: "Yoga Mat",
    description: "Non-slip eco-friendly yoga mat",
    price: 29.99,
    stock: 200,
    category: { name: "Sports", subName: "Yoga" },
    variants: [
      { sku: "YM-GRN-STD", color: "Green",  size: "Standard", price: 29.99, stock: 100 },
      { sku: "YM-PRP-STD", color: "Purple", size: "Standard", price: 29.99, stock: 100 }
    ],
    supplier: { name: "EcoFlex Inc.", contact: "orders@ecoflex.com", country: "India" },
    tags: ["yoga", "fitness", "eco-friendly"],
    createdAt: new Date()
  },
  {
    name: "Laptop Stand",
    description: "Adjustable aluminium laptop stand",
    price: 45.00,
    stock: 5,
    category: { name: "Electronics", subName: "Accessories" },
    variants: [
      { sku: "LS-SLV-ONE", color: "Silver", size: "One Size", price: 45.00, stock: 5 }
    ],
    supplier: { name: "DeskPro Supplies", contact: "contact@deskpro.com", country: "Taiwan" },
    tags: ["laptop", "ergonomic", "desk"],
    createdAt: new Date()
  }
]);


// ─────────────────────────────────────────────
// 3. AGGREGATION PIPELINES
// ─────────────────────────────────────────────

// 3a. Total stock and average price grouped by category
db.products.aggregate([
  {
    $group: {
      _id: "$category.name",
      totalStock:   { $sum: "$stock" },
      avgPrice:     { $avg: "$price" },
      productCount: { $sum: 1 }
    }
  },
  { $sort: { totalStock: -1 } }
]);

// 3b. Unwind variants – stock per variant SKU
db.products.aggregate([
  { $unwind: "$variants" },
  {
    $project: {
      productName:  "$name",
      sku:   "$variants.sku",
      color: "$variants.color",
      size:  "$variants.size",
      variantStock: "$variants.stock",
      variantPrice: "$variants.price"
    }
  },
  { $sort: { variantStock: 1 } }
]);

// 3c. Low stock alert – products with total stock <= 10
db.products.aggregate([
  { $match: { stock: { $lte: 10 } } },
  {
    $project: {
      name: 1,
      stock: 1,
      category: "$category.name",
      supplier: "$supplier.name"
    }
  }
]);

// 3d. Revenue potential (price * stock) per product
db.products.aggregate([
  {
    $project: {
      name: 1,
      price: 1,
      stock: 1,
      revenuePotential: { $multiply: ["$price", "$stock"] }
    }
  },
  { $sort: { revenuePotential: -1 } }
]);

// 3e. Products grouped by supplier country with total inventory
db.products.aggregate([
  {
    $group: {
      _id: "$supplier.country",
      products:   { $push: "$name" },
      totalStock: { $sum: "$stock" }
    }
  }
]);


// ─────────────────────────────────────────────
// 4. STOCK MANAGEMENT OPERATIONS
// ─────────────────────────────────────────────

// 4a. Decrease stock on purchase (atomic update)
function purchaseProduct(productName, variantSku, quantity) {
  const result = db.products.updateOne(
    {
      name: productName,
      "variants.sku": variantSku,
      "variants.stock": { $gte: quantity }
    },
    {
      $inc: {
        stock: -quantity,
        "variants.$.stock": -quantity
      }
    }
  );
  if (result.modifiedCount === 0) {
    print("Purchase failed: insufficient stock or product not found.");
  } else {
    print(`Purchase successful: ${quantity} unit(s) of SKU ${variantSku} deducted.`);
  }
}

// Example: buy 2 units of Red Running Shoes size 42
purchaseProduct("Running Shoes", "RS-RED-42", 2);

// 4b. Restock a variant
function restockVariant(productName, variantSku, quantity) {
  db.products.updateOne(
    { name: productName, "variants.sku": variantSku },
    {
      $inc: {
        stock: quantity,
        "variants.$.stock": quantity
      }
    }
  );
  print(`Restocked ${quantity} unit(s) for SKU ${variantSku}.`);
}

// Example: restock Laptop Stand
restockVariant("Laptop Stand", "LS-SLV-ONE", 50);

// 4c. View current stock for all products
db.products.find({}, { name: 1, stock: 1, "category.name": 1, _id: 0 }).sort({ stock: 1 });

// 4d. Mark out-of-stock products
db.products.updateMany(
  { stock: { $lte: 0 } },
  { $set: { status: "out_of_stock" } }
);

// 4e. Add a new variant to an existing product
db.products.updateOne(
  { name: "Running Shoes" },
  {
    $push: {
      variants: { sku: "RS-GRN-41", color: "Green", size: "41", price: 74.99, stock: 30 }
    },
    $inc: { stock: 30 }
  }
);
