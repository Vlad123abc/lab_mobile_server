const Koa = require('koa');
const app = new Koa();
const server = require('http').createServer(app.callback());
const WebSocket = require('ws');
const wss = new WebSocket.Server({ server });
const Router = require('koa-router');
const cors = require('koa-cors');
const bodyparser = require('koa-bodyparser');
const jwt = require('jsonwebtoken');

app.use(bodyparser());
app.use(cors());

const SECRET = 'shhhhh';

// JWT Verification Middleware
const verifyJwtMiddleware = async (ctx, next) => {
  const authHeader = ctx.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    ctx.response.status = 401;
    ctx.response.body = { message: 'Authorization token required' };
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, SECRET);
    ctx.state.user = decoded.principal; // Store decoded user information in context
    await next();
  } catch (err) {
    ctx.response.status = 403;
    ctx.response.body = { message: 'Invalid or expired token' };
  }
};

// Error Handling Middleware
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    ctx.response.body = { message: err.message || 'Unexpected error' };
    ctx.response.status = 500;
  }
});

// Classes for User and Car
class Car {
  constructor({ id, brand, date, is_new }) {
    this.id = id;
    this.brand = brand;
    this.date = date;
    this.is_new = is_new;
  }
}

class User {
  constructor(name, pass) {
    this.name = name;
    this.pass = pass;
  }
}

const carsByUser = {};  // Object storing cars per user: { username: [Car, Car, ...] }
const users = [new User("vlad", "1234"), new User("gigel", "1111")];
let lastId = 0;

// Broadcasting Function
const broadcast = data =>
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });

const router= new Router();

wss.once('message', (data) => {
    console.log("Init message received")
    const token = data.toString(); // Assume first message is the JWT token
    const decoded = verifyJwt(token);

    if (decoded && decoded.principal) {
      username = decoded.principal;

      // If the user already has connections, add this WebSocket to the existing array
      if (!clients.has(username)) {
        clients.set(username, []);
      }
      clients.get(username)
        .push(ws); // Store the WebSocket connection in the array
      console.log(`Client authenticated: ${username}`);
    }
  })
wss.on('close', () => {
  console.log(`Client disconnected: ${username}`);
  // Remove this WebSocket from the client's list of connections
  const userConnections = clients.get(username);
  const index = userConnections.indexOf(ws);
  if (index !== -1) {
    userConnections.splice(index, 1);
    if (userConnections.length === 0) {
      clients.delete(username); // Remove the user from the map if no connections left
    }
  }
})

const checkLogin = (user) => {
  return users.some(u => u.name === user.name && u.pass === user.pass);
}

router.post('/login', async (ctx) => {
  const { name, pass } = ctx.request.body;
  if (!name || !pass) {
    ctx.response.status = 400;
    ctx.response.body = { message: "Name and password are required" };
  } else if (checkLogin(new User(name, pass))) {
    ctx.response.status = 200;
    ctx.response.body = { token: createJwt(name) };
  } else {
    ctx.response.status = 400;
    ctx.response.body = { message: "Invalid credentials" };
  }
});

const createJwt = (name) => {
  return jwt.sign({ principal: name }, SECRET);
};

// Routes

// Fetch all cars for the authenticated user
router.get('/car', verifyJwtMiddleware, ctx => {
  const user = ctx.state.user;
  ctx.response.body = carsByUser[user] || []; // Return an empty array if no cars
  ctx.response.status = 200;
});

const createItem = async (ctx) => {
  const item = ctx.request.body;
  if (!item.brand) {
    ctx.response.body = { message: 'Brand is missing' };
    ctx.response.status = 400;
    return;
  }

  const user = ctx.state.user;
  item.id = `${++lastId}`;
  item.date = new Date();

  // Initialize the array if it doesn't exist for the user
  if (!carsByUser[user]) {
    carsByUser[user] = [];
  }

  carsByUser[user].push(item); // Add car to the user's list
  ctx.response.body = item;
  ctx.response.status = 201;
  console.log("Car addeed")
  broadcast({ event: 'created', payload: { item } });
};

router.post('/car', verifyJwtMiddleware, async (ctx) => {
  await createItem(ctx);
});

// Fetch a specific car for the authenticated user
router.get('/car/:id', verifyJwtMiddleware, async (ctx) => {
  const user = ctx.state.user;
  const carId = ctx.params.id;
  const car = (carsByUser[user] || []).find(car => car.id === carId);
  if (car) {
    ctx.response.body = car;
    ctx.response.status = 200;
  } else {
    ctx.response.body = { message: `Car with id ${carId} not found` };
    ctx.response.status = 404;
  }
});

// Update a car for the authenticated user
router.put('/car/:id', verifyJwtMiddleware, async (ctx) => {
  const user = ctx.state.user;
  const id = ctx.params.id;
  const item = ctx.request.body;
  const cars = carsByUser[user] || [];
  const index = cars.findIndex(car => car.id === id);

  if (index === -1) {
    ctx.response.body = { message: `Car with id ${id} not found` };
    ctx.response.status = 404;
    return;
  }

  cars[index] = { ...cars[index], ...item };
  ctx.response.body = cars[index];
  ctx.response.status = 200;
  broadcast({ event: 'updated', payload: { item } });
});

// Delete a car for the authenticated user
router.del('/car/:id', verifyJwtMiddleware, ctx => {
  const user = ctx.state.user;
  const id = ctx.params.id;
  const cars = carsByUser[user] || [];
  const index = cars.findIndex(car => car.id === id);

  if (index !== -1) {
    const item = cars[index];
    cars.splice(index, 1);
    broadcast({ event: 'deleted', payload: { item } });
    ctx.response.status = 204;
  } else {
    ctx.response.body = { message: `Car with id ${id} not found` };
    ctx.response.status = 404;
  }
});

app.use(router.routes());
app.use(router.allowedMethods());

server.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
