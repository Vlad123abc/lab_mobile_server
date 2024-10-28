const Koa = require('koa');
const app = new Koa();
const server = require('http').createServer(app.callback());
const WebSocket = require('ws');
const wss = new WebSocket.Server({ server });
const Router = require('koa-router');
const cors = require('koa-cors');
const bodyparser = require('koa-bodyparser');

app.use(bodyparser());
app.use(cors());

// Logging: Logs the request method, URL, status, and response time.
app.use(async (ctx, next) => {
  const start = new Date();
  await next();
  const ms = new Date() - start;
  console.log(`${ctx.method} ${ctx.url} ${ctx.response.status} - ${ms}ms`);
});

// Artificial Delay: Adds a 2-second delay to responses.
app.use(async (ctx, next) => {
  await new Promise(resolve => setTimeout(resolve, 2000));
  await next();
});

// Error Handling: Catches and handles any errors that occur during request processing.
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    ctx.response.body = { message: err.message || 'Unexpected error' };
    ctx.response.status = 500;
  }
});

class Car {
  constructor({ id, brand, date, is_new }) {
    this.id = id;
    this.brand = brand;
    this.date = date;
    this.is_new = is_new;
  }
}

const cars = [];
for (let i = 0; i < 3; i++) {
  cars.push(new Car({ id: `${i}`, brand: `car ${i}`, date: new Date(Date.now() + i), is_new: true }));
}
let lastUpdated = cars[cars.length - 1].date;
let lastId = cars[cars.length - 1].id;
const pageSize = 10;

// Broadcasting Function: Sends data to all connected WebSocket clients.
const broadcast = data =>
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });

const router = new Router();

router.get('/car', ctx => {
  ctx.response.body = cars;
  ctx.response.status = 200;
});

router.get('/car/:id', async (ctx) => {
  const carId = ctx.request.params.id;
  const car = cars.find(car => carId === car.id);
  if (car) {
    ctx.response.body = car;
    ctx.response.status = 200; // ok
  } else {
    ctx.response.body = { message: `car with id ${carId} not found` };
    ctx.response.status = 404; // NOT FOUND (if you know the resource was deleted, then return 410 GONE)
  }
});

const createItem = async (ctx) => {
  const item = ctx.request.body;
  console.log(`Received brand is: ${JSON.stringify(item)}`)
  if (!item.brand) { // validation
    ctx.response.body = { message: 'Brand is missing' };
    ctx.response.status = 400; //  BAD REQUEST
    return;
  }
  item.id = `${parseInt(lastId) + 1}`;
  lastId = item.id;
  item.date = new Date();
  item.is_new = 1;
  cars.push(item);
  ctx.response.body = item;
  ctx.response.status = 201; // CREATED
  broadcast({ event: 'created', payload: { item } });
};

router.post('/car', async (ctx) => {
  await createItem(ctx);
});

router.put('/car/:id', async (ctx) => {
  const id = ctx.params.id;
  const item = ctx.request.body;
  console.log("PUT received: " + JSON.stringify(item))
  const itemId = item.id;
  if (itemId && id !== item.id) {
    ctx.response.body = { message: `Param id and body id should be the same` };
    ctx.response.status = 400; // BAD REQUEST
    return;
  }
  if (!itemId) {
    await createItem(ctx);
    return;
  }
  const index = cars.findIndex(item => item.id === id);
  if (index === -1) {
    ctx.response.body = { message: `car with id ${id} not found` };
    ctx.response.status = 400; // BAD REQUEST
    return;
  }
  cars[index] = item;
  console.log("PUT saved: " + JSON.stringify(item))

  lastUpdated = new Date();
  ctx.response.body = item;
  ctx.response.status = 200; // OK
  broadcast({ event: 'updated', payload: { item } });
});

router.del('/car/:id', ctx => {
  const id = ctx.params.id;
  const index = cars.findIndex(item => id === item.id);
  if (index !== -1) {
    const item = cars[index];
    cars.splice(index, 1);
    lastUpdated = new Date();
    broadcast({ event: 'deleted', payload: { item } });
  }
  ctx.response.status = 204; // no content
});

app.use(router.routes());
app.use(router.allowedMethods());

server.listen(3000); // start server
