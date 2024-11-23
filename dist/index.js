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
})({"app.js":[function(require,module,exports) {
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
const Koa = require("koa");
const app = new Koa();
const server = require("http").createServer(app.callback());
const WebSocket = require("ws");
const wss = new WebSocket.Server({
  server
});
const Router = require("koa-router");
const cors = require("koa-cors");
const bodyparser = require("koa-bodyparser");
const jwt = require("jsonwebtoken");
const sqlite3 = require("sqlite3").verbose();
const {
  open
} = require("sqlite");
const SECRET = "shhhhh";
app.use(bodyparser());
app.use(cors());

// Initialize SQLite database
let db;
(async () => {
  db = await open({
    filename: "./cars.db",
    driver: sqlite3.Database
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
    ctx.response.body = {
      message: "Authorization token required"
    };
    return;
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, SECRET);
    ctx.state.user = decoded.principal; // Store decoded user information in context
    await next();
  } catch (err) {
    ctx.response.status = 403;
    ctx.response.body = {
      message: "Invalid or expired token"
    };
  }
};

// Error Handling Middleware
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    ctx.response.body = {
      message: err.message || "Unexpected error"
    };
    ctx.response.status = 500;
  }
});

// Users and JWT Token Utilities
const users = [{
  name: "vlad",
  pass: "1234"
}, {
  name: "gigel",
  pass: "1111"
}];
const checkLogin = user => users.some(u => u.name === user.name && u.pass === user.pass);
const createJwt = name => jwt.sign({
  principal: name
}, SECRET);

// Broadcasting Function
const clients = new Map();
const broadcast = data => {
  clients.forEach((client, key) => {
    if (data.user && data.user === key) {
      client.forEach(oneClient => {
        oneClient.send(JSON.stringify(data));
      });
    }
  });
};
wss.on("connection", (ws, req) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const username1 = url.searchParams.get("username");
  ws.once("message", data => {
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
router.post("/login", async ctx => {
  const {
    name,
    pass
  } = ctx.request.body;
  if (!name || !pass) {
    ctx.response.status = 400;
    ctx.response.body = {
      message: "Name and password are required"
    };
  } else if (checkLogin({
    name,
    pass
  })) {
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

// Fetch all cars
router.get("/car", verifyJwtMiddleware, async ctx => {
  try {
    const rows = await db.all("SELECT * FROM cars");
    ctx.response.body = rows;
    ctx.response.status = 200;
  } catch (err) {
    ctx.response.status = 500;
    ctx.response.body = {
      message: "Error fetching cars"
    };
  }
});

// Add a new car
router.post("/car", verifyJwtMiddleware, async ctx => {
  const {
    brand,
    is_new
  } = ctx.request.body;
  if (!brand) {
    ctx.response.status = 400;
    ctx.response.body = {
      message: "Brand is required"
    };
    return;
  }
  try {
    const date = new Date().toISOString();
    const result = await db.run("INSERT INTO cars (brand, date, is_new) VALUES (?, ?, ?)", [brand, date, is_new ? 1 : 0]);
    const newCar = {
      id: result.lastID,
      brand,
      date,
      is_new
    };
    ctx.response.body = newCar;
    ctx.response.status = 201;
    broadcast({
      event: "created",
      user: ctx.state.user,
      payload: newCar
    });
  } catch (err) {
    ctx.response.status = 500;
    ctx.response.body = {
      message: "Error adding car"
    };
  }
});

// Fetch a specific car
router.get("/car/:id", verifyJwtMiddleware, async ctx => {
  const {
    id
  } = ctx.params;
  try {
    const car = await db.get("SELECT * FROM cars WHERE id = ?", [id]);
    if (car) {
      ctx.response.body = car;
      ctx.response.status = 200;
    } else {
      ctx.response.status = 404;
      ctx.response.body = {
        message: `Car with id ${id} not found`
      };
    }
  } catch (err) {
    ctx.response.status = 500;
    ctx.response.body = {
      message: "Error fetching car"
    };
  }
});

// Update a car
router.put("/car/:id", verifyJwtMiddleware, async ctx => {
  const {
    id
  } = ctx.params;
  const {
    brand,
    is_new
  } = ctx.request.body;
  try {
    const car = await db.get("SELECT * FROM cars WHERE id = ?", [id]);
    if (!car) {
      ctx.response.status = 404;
      ctx.response.body = {
        message: `Car with id ${id} not found`
      };
      return;
    }
    const updatedCar = _objectSpread(_objectSpread({}, car), {}, {
      brand: brand || car.brand,
      is_new: is_new !== undefined ? is_new ? 1 : 0 : car.is_new
    });
    await db.run("UPDATE cars SET brand = ?, is_new = ? WHERE id = ?", [updatedCar.brand, updatedCar.is_new, id]);
    ctx.response.body = updatedCar;
    ctx.response.status = 200;
    broadcast({
      event: "updated",
      user: ctx.state.user,
      payload: updatedCar
    });
  } catch (err) {
    ctx.response.status = 500;
    ctx.response.body = {
      message: "Error updating car"
    };
  }
});

// Delete a car
router.del("/car/:id", verifyJwtMiddleware, async ctx => {
  const {
    id
  } = ctx.params;
  try {
    const car = await db.get("SELECT * FROM cars WHERE id = ?", [id]);
    if (!car) {
      ctx.response.status = 404;
      ctx.response.body = {
        message: `Car with id ${id} not found`
      };
      return;
    }
    await db.run("DELETE FROM cars WHERE id = ?", [id]);
    ctx.response.status = 204;
    broadcast({
      event: "deleted",
      user: ctx.state.user,
      payload: car
    });
  } catch (err) {
    ctx.response.status = 500;
    ctx.response.body = {
      message: "Error deleting car"
    };
  }
});
app.use(router.routes());
app.use(router.allowedMethods());
module.exports = server;
},{}],"index.js":[function(require,module,exports) {
const server = require("./app");
server.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
},{"./app":"app.js"}]},{},["index.js"], null)
//# sourceMappingURL=/index.js.map