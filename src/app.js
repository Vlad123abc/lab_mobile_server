const Koa = require("koa");
const app = new Koa();
const server = require("http").createServer(app.callback());
const WebSocket = require("ws");
const wss = new WebSocket.Server({ server });
const Router = require("koa-router");
const cors = require("koa-cors");
const bodyparser = require("koa-bodyparser");
const jwt = require("jsonwebtoken");
const sqlite3 = require("sqlite3").verbose();
const { open } = require("sqlite");
const config = require('../config'); // Adjust the path as necessary
const SECRET = "shhhhh";
const environment = process.env.NODE_ENV || 'development';
const { connectionString } = config[environment];
console.log("conn string is:", connectionString);
app.use(bodyparser());
app.use(cors());

// Initialize SQLite database
let db;
(async () => {
  db = await open({
    filename: connectionString,
    driver: sqlite3.Database,
  });
    
  // Create table if not exists
  await db.exec(`
    CREATE TABLE IF NOT EXISTS cars (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      brand TEXT NOT NULL,
      date TEXT NOT NULL,
      is_new INTEGER NOT NULL
    )
  `);
})();

// JWT Verification Middleware
const verifyJwtMiddleware = async (ctx, next) => {
  const authHeader = ctx.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    ctx.response.status = 401;
    ctx.response.body = { message: "Authorization token required" };
    return;
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, SECRET);
    ctx.state.user = decoded.principal; // Store decoded user information in context
    await next();
  } catch (err) {
    ctx.response.status = 403;
    ctx.response.body = { message: "Invalid or expired token" };
  }
};

// Error Handling Middleware
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    ctx.response.body = { message: err.message || "Unexpected error" };
    ctx.response.status = 500;
  }
});

// Users and JWT Token Utilities
const users = [
  { name: "vlad", pass: "1234" },
  { name: "gigel", pass: "1111" },
];

const checkLogin = (user) =>
  users.some((u) => u.name === user.name && u.pass === user.pass);

const createJwt = (name) => jwt.sign({ principal: name }, SECRET);

// Broadcasting Function
const clients = new Map();
const broadcast = (data) => {
  clients.forEach((client, key) => {
    if (data.user && data.user === key) {
      client.forEach((oneClient) => {
        oneClient.send(JSON.stringify(data));
      });
    }
  });
};

wss.on("connection", (ws, req) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const username1 = url.searchParams.get("username");

  ws.once("message", (data) => {
    const token = data.toString();
    const decoded = jwt.verify(token, SECRET);
    if (decoded && decoded.principal) {
      const username = decoded.principal;
      if (!clients.has(username)) {
        clients.set(username, []);
      }
      clients.get(username).push(ws);
    }
  });

  ws.on("close", () => {
    const userConnections = clients.get(username1);
    if (userConnections) {
      const index = userConnections.indexOf(ws);
      if (index !== -1) {
        userConnections.splice(index, 1);
        if (userConnections.length === 0) {
          clients.delete(username1);
        }
      }
    }
  });
});

// Routes
const router = new Router();

// Login Route
router.post("/login", async (ctx) => {
  const { name, pass } = ctx.request.body;
  if (!name || !pass) {
    ctx.response.status = 400;
    ctx.response.body = { message: "Name and password are required" };
  } else if (checkLogin({ name, pass })) {
    ctx.response.status = 200;
    ctx.response.body = { token: createJwt(name) };
  } else {
    ctx.response.status = 400;
    ctx.response.body = { message: "Invalid credentials" };
  }
});

// Fetch all cars
router.get("/car", verifyJwtMiddleware, async (ctx) => {
  try {
    const rows = await db.all("SELECT * FROM cars");
    ctx.response.body = rows;
    ctx.response.status = 200;
  } catch (err) {
    ctx.response.status = 500;
    ctx.response.body = { message: "Error fetching cars" };
  }
});

// Add a new car
router.post("/car", verifyJwtMiddleware, async (ctx) => {
    const { brand, is_new } = ctx.request.body;
  if (!brand) {
    ctx.response.status = 400;
    ctx.response.body = { message: "Brand is required" };
    return;
  }

  try {
    const date = new Date().toISOString();
    const result = await db.run(
      "INSERT INTO cars (brand, date, is_new) VALUES (?, ?, ?)",
      [brand, date, is_new ? 1 : 0]
    );
    const newCar = { id: result.lastID, brand, date, is_new };
    ctx.response.body = newCar;
    ctx.response.status = 201;
    broadcast({ event: "created", user: ctx.state.user, payload: newCar });
  } catch (err) {
    ctx.response.status = 500;
    ctx.response.body = { message: "Error adding car" };
  }
});

// Fetch a specific car
router.get("/car/:id", verifyJwtMiddleware, async (ctx) => {
    const { id } = ctx.params;
    console.log("looking for car with id: ", id);

  try {
    const car = await db.get("SELECT * FROM cars WHERE id = ?", [id]);
    if (car) {
      ctx.response.body = car;
        ctx.response.status = 200;
    console.log("found car: ", id);        
    } else {
      ctx.response.status = 404;
        ctx.response.body = { message: `Car with id ${id} not found` };
        console.log("no car: ", id);        
        
    }
  } catch (err) {
    ctx.response.status = 500;
    ctx.response.body = { message: "Error fetching car" };
  }
});

// Update a car
router.put("/car/:id", verifyJwtMiddleware, async (ctx) => {
  const { id } = ctx.params;
  const { brand, is_new } = ctx.request.body;

  try {
    const car = await db.get("SELECT * FROM cars WHERE id = ?", [id]);
    if (!car) {
      ctx.response.status = 404;
      ctx.response.body = { message: `Car with id ${id} not found` };
      return;
    }

    const updatedCar = {
      ...car,
      brand: brand || car.brand,
      is_new: is_new !== undefined ? (is_new ? 1 : 0) : car.is_new,
    };

    await db.run(
      "UPDATE cars SET brand = ?, is_new = ? WHERE id = ?",
      [updatedCar.brand, updatedCar.is_new, id]
    );

    ctx.response.body = updatedCar;
    ctx.response.status = 200;
    broadcast({ event: "updated", user: ctx.state.user, payload: updatedCar });
  } catch (err) {
    ctx.response.status = 500;
    ctx.response.body = { message: "Error updating car" };
  }
});

// Delete a car
router.del("/car/:id", verifyJwtMiddleware, async (ctx) => {
  const { id } = ctx.params;
  try {
    const car = await db.get("SELECT * FROM cars WHERE id = ?", [id]);
    if (!car) {
      ctx.response.status = 404;
      ctx.response.body = { message: `Car with id ${id} not found` };
      return;
    }

    await db.run("DELETE FROM cars WHERE id = ?", [id]);
    ctx.response.status = 204;
    broadcast({ event: "deleted", user: ctx.state.user, payload: car });
  } catch (err) {
    ctx.response.status = 500;
    ctx.response.body = { message: "Error deleting car" };
  }
});

app.use(router.routes());
app.use(router.allowedMethods());
module.exports = server;
