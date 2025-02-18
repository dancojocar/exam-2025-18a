const Koa = require("koa");
const app = (module.exports = new Koa());
const server = require("http").createServer(app.callback());
const WebSocket = require("ws");
const wss = new WebSocket.Server({ server });
const Router = require("koa-router");
const cors = require("@koa/cors");
const bodyParser = require("koa-bodyparser");

app.use(bodyParser());
app.use(cors());
app.use(middleware);

function middleware(ctx, next) {
  const start = new Date();
  return next()
    .catch((err) => {
      console.error(
        `[ERROR] ${start.toLocaleTimeString()} ${err.status || 500} ${
          ctx.request.method
        } ${ctx.request.url} - ${err.message}`
      );
      ctx.status = err.status || 500;
      ctx.body = { error: err.message };
    })
    .then(() => {
      const ms = new Date() - start;
      console.log(
        `${start.toLocaleTimeString()} ${ctx.status} ${ctx.request.method} ${
          ctx.request.url
        } - ${ms}ms`
      );
    });
}

const inventory = [
  {
    id: 1,
    name: "Laptop",
    status: "available",
    quantity: 10,
    category: "Electronics",
    supplier: "Tech Corp",
    weight: 2.5,
  },
  {
    id: 2,
    name: "Desk Chair",
    status: "reserved",
    quantity: 5,
    category: "Furniture",
    supplier: "Office Supply Co.",
    weight: 15.0,
  },
  {
    id: 3,
    name: "Printer Paper",
    status: "available",
    quantity: 100,
    category: "Office Supplies",
    supplier: "Paper Goods Ltd.",
    weight: 1.0,
  },
  {
    id: 4,
    name: "Smartphone",
    status: "out of stock",
    quantity: 0,
    category: "Electronics",
    supplier: "Mobile World",
    weight: 0.3,
  },
  {
    id: 5,
    name: "Drill Machine",
    status: "available",
    quantity: 7,
    category: "Tools",
    supplier: "Hardware Inc.",
    weight: 3.2,
  },
  {
    id: 6,
    name: "Refrigerator",
    status: "reserved",
    quantity: 3,
    category: "Appliances",
    supplier: "Home Essentials",
    weight: 60.0,
  },
  {
    id: 7,
    name: "Cooking Oil",
    status: "available",
    quantity: 50,
    category: "Groceries",
    supplier: "Food Distributors",
    weight: 0.9,
  },
  {
    id: 8,
    name: "T-Shirts",
    status: "available",
    quantity: 80,
    category: "Clothing",
    supplier: "Fashion House",
    weight: 0.2,
  },
  {
    id: 9,
    name: "LED Bulb",
    status: "available",
    quantity: 30,
    category: "Lighting",
    supplier: "Bright Lights",
    weight: 0.15,
  },
  {
    id: 10,
    name: "Sofa Set",
    status: "reserved",
    quantity: 2,
    category: "Furniture",
    supplier: "Living Space",
    weight: 45.0,
  },
];

const router = new Router();

router.get("/items", async (ctx) => {
  try {
    ctx.body = inventory;
    ctx.status = 200;
  } catch (err) {
    ctx.throw(500, "Server error retrieving inventory");
  }
});

router.get("/all", async (ctx) => {
  try {
    ctx.body = inventory;
    ctx.status = 200;
  } catch (err) {
    ctx.throw(500, "Server error retrieving inventory");
  }
});

router.get("/item/:id", async (ctx) => {
  try {
    const item = inventory.find((i) => i.id == ctx.params.id);
    if (!item) ctx.throw(404, "Item not found");
    ctx.body = item;
  } catch (err) {
    ctx.throw(err.status || 500, err.message);
  }
});

router.post("/item", async (ctx) => {
  try {
    const { name, status, quantity, category, supplier, weight } =
      ctx.request.body;

    if (
      !name ||
      !status ||
      !category ||
      !supplier ||
      quantity === undefined ||
      weight === undefined
    ) {
      console.log(
        `Missing or invalid fields, name: ${name} status: ${status} quantity: ${quantity} category: ${category} supplier: ${supplier} weight: ${weight}`
      );
      ctx.throw(400, "Missing required fields");
    }

    const newItem = {
      id: Math.max(...inventory.map((i) => i.id)) + 1,
      name,
      status,
      quantity: parseInt(quantity),
      category,
      supplier,
      weight: parseFloat(weight),
    };

    inventory.push(newItem);
    broadcastNotification(newItem);
    ctx.body = newItem;
    ctx.status = 201;
  } catch (err) {
    ctx.throw(err.status || 500, err.message);
  }
});

router.get("/categories", async (ctx) => {
  try {
    const categories = [...new Set(inventory.map((item) => item.category))];
    ctx.body = categories;
  } catch (err) {
    ctx.throw(500, "Server error retrieving categories");
  }
});

router.get("/byCategory", async (ctx) => {
  try {
    const { category } = ctx.query;
    const items = category
      ? inventory.filter((i) => i.category === category)
      : inventory;
    ctx.body = items;
  } catch (err) {
    ctx.throw(500, "Server error filtering items");
  }
});

router.del("/item/:id", async (ctx) => {
  try {
    const id = parseInt(ctx.params.id);
    const index = inventory.findIndex((i) => i.id === id);
    if (index === -1) ctx.throw(404, "Item not found");
    const item = inventory.splice(index, 1)[0];
    ctx.body = item;
    ctx.status = 200;
  } catch (err) {
    ctx.throw(err.status || 500, err.message);
  }
});

router.get("/supplier-items", async (ctx) => {
  try {
    const { supplier } = ctx.query;
    if (!supplier) ctx.throw(400, "Supplier parameter required");

    const items = inventory.filter((i) => i.supplier === supplier);
    ctx.body = items;
  } catch (err) {
    ctx.throw(err.status || 500, err.message);
  }
});

const broadcastNotification = (data) => {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
};

app.use(router.routes());
app.use(router.allowedMethods());

const port = 2518;
server.listen(port, () => {
  console.log(`Server running on port ${port}... 🚀`);
});
