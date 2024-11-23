// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles
parcelRequire = (function (modules, cache, entry, globalName) {
  // Save the require from previous bundle to this closure if any
  var previousRequire = typeof parcelRequire === 'function' && parcelRequire;
  var nodeRequire = typeof require === 'function' && require;

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire = typeof parcelRequire === 'function' && parcelRequire;
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error('Cannot find module \'' + name + '\'');
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;
      localRequire.cache = {};

      var module = cache[name] = new newRequire.Module(name);

      modules[name][0].call(module.exports, localRequire, module, module.exports, this);
    }

    return cache[name].exports;

    function localRequire(x){
      return newRequire(localRequire.resolve(x));
    }

    function resolve(x){
      return modules[name][1][x] || x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;
  newRequire.register = function (id, exports) {
    modules[id] = [function (require, module) {
      module.exports = exports;
    }, {}];
  };

  var error;
  for (var i = 0; i < entry.length; i++) {
    try {
      newRequire(entry[i]);
    } catch (e) {
      // Save first error but execute all entries
      if (!error) {
        error = e;
      }
    }
  }

  if (entry.length) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(entry[entry.length - 1]);

    // CommonJS
    if (typeof exports === "object" && typeof module !== "undefined") {
      module.exports = mainExports;

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
     define(function () {
       return mainExports;
     });

    // <script>
    } else if (globalName) {
      this[globalName] = mainExports;
    }
  }

  // Override the current require with this new one
  parcelRequire = newRequire;

  if (error) {
    // throw error from earlier, _after updating parcelRequire_
    throw error;
  }

  return newRequire;
})({"index.js":[function(require,module,exports) {
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
const Koa = require('koa');
const app = new Koa();
const server = require('http').createServer(app.callback());
const WebSocket = require('ws');
const wss = new WebSocket.Server({
  server
});
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
    ctx.response.body = {
      message: 'Authorization token required'
    };
    return;
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, SECRET);
    ctx.state.user = decoded.principal; // Store decoded user information in context
    await next();
  } catch (err) {
    ctx.response.status = 403;
    ctx.response.body = {
      message: 'Invalid or expired token'
    };
  }
};

// Error Handling Middleware
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    ctx.response.body = {
      message: err.message || 'Unexpected error'
    };
    ctx.response.status = 500;
  }
});

// Classes for User and Car
class Car {
  constructor({
    id,
    brand,
    date,
    is_new
  }) {
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
const carsByUser = {}; // Object storing cars per user: { username: [Car, Car, ...] }
const users = [new User("vlad", "1234"), new User("gigel", "1111")];
let lastId = 0;

// Broadcasting Function
const broadcast = data => wss.clients.forEach(client => {
  if (client.readyState === WebSocket.OPEN) {
    client.send(JSON.stringify(data));
  }
});
const router = new Router();
wss.once('message', data => {
  console.log("Init message received");
  const token = data.toString(); // Assume first message is the JWT token
  const decoded = verifyJwt(token);
  if (decoded && decoded.principal) {
    username = decoded.principal;

    // If the user already has connections, add this WebSocket to the existing array
    if (!clients.has(username)) {
      clients.set(username, []);
    }
    clients.get(username).push(ws); // Store the WebSocket connection in the array
    console.log(`Client authenticated: ${username}`);
  }
});
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
});
const checkLogin = user => {
  return users.some(u => u.name === user.name && u.pass === user.pass);
};
router.post('/login', async ctx => {
  const {
    name,
    pass
  } = ctx.request.body;
  if (!name || !pass) {
    ctx.response.status = 400;
    ctx.response.body = {
      message: "Name and password are required"
    };
  } else if (checkLogin(new User(name, pass))) {
    ctx.response.status = 200;
    ctx.response.body = {
      token: createJwt(name)
    };
  } else {
    ctx.response.status = 400;
    ctx.response.body = {
      message: "Invalid credentials"
    };
  }
});
const createJwt = name => {
  return jwt.sign({
    principal: name
  }, SECRET);
};

// Routes

// Fetch all cars for the authenticated user
router.get('/car', verifyJwtMiddleware, ctx => {
  const user = ctx.state.user;
  ctx.response.body = carsByUser[user] || []; // Return an empty array if no cars
  ctx.response.status = 200;
});
const createItem = async ctx => {
  const item = ctx.request.body;
  if (!item.brand) {
    ctx.response.body = {
      message: 'Brand is missing'
    };
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
  console.log("Car addeed");
  broadcast({
    event: 'created',
    payload: {
      item
    }
  });
};
router.post('/car', verifyJwtMiddleware, async ctx => {
  await createItem(ctx);
});

// Fetch a specific car for the authenticated user
router.get('/car/:id', verifyJwtMiddleware, async ctx => {
  const user = ctx.state.user;
  const carId = ctx.params.id;
  const car = (carsByUser[user] || []).find(car => car.id === carId);
  if (car) {
    ctx.response.body = car;
    ctx.response.status = 200;
  } else {
    ctx.response.body = {
      message: `Car with id ${carId} not found`
    };
    ctx.response.status = 404;
  }
});

// Update a car for the authenticated user
router.put('/car/:id', verifyJwtMiddleware, async ctx => {
  const user = ctx.state.user;
  const id = ctx.params.id;
  const item = ctx.request.body;
  const cars = carsByUser[user] || [];
  const index = cars.findIndex(car => car.id === id);
  if (index === -1) {
    ctx.response.body = {
      message: `Car with id ${id} not found`
    };
    ctx.response.status = 404;
    return;
  }
  cars[index] = _objectSpread(_objectSpread({}, cars[index]), item);
  ctx.response.body = cars[index];
  ctx.response.status = 200;
  broadcast({
    event: 'updated',
    payload: {
      item
    }
  });
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
    broadcast({
      event: 'deleted',
      payload: {
        item
      }
    });
    ctx.response.status = 204;
  } else {
    ctx.response.body = {
      message: `Car with id ${id} not found`
    };
    ctx.response.status = 404;
  }
});
app.use(router.routes());
app.use(router.allowedMethods());
server.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
},{}]},{},["index.js"], null)
//# sourceMappingURL=/index.js.map
