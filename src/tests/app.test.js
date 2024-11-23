const request = require("supertest");
const app = require("../app"); // Adjust the path to your Express app

const fucking_auth =
  "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwcmluY2lwYWwiOiJ2bGFkIiwiaWF0IjoxNzMyMzY2MzIzfQ.0cBtSsHHJAJt2Tf0Fy_v4oKYfrYBuf_itTDE9f_78DU";

beforeAll((done) => {
  server = app.listen(3000, done); // Start the server before tests
});

afterAll((done) => {
  server.close(done); // Close the server after tests
});

describe("GET /car/1", () => {
  it("should respond 404", async () => {
    const response = await request(app)
      .get("/car/1")
      .set("Authorization", fucking_auth);
    expect(response.statusCode).toBe(404);
    expect(response.text).toBe( "{\"message\":\"Car with id 1 not found\"}");
  });
});

describe("POST /car", () => {
  it("should return OK", async () => {
    const newCar = { brand: "Toyota", is_new: true };
    const response = await request(app)
      .post("/car")
      .set("Authorization", fucking_auth)
      .send(newCar);
    expect(response.statusCode).toBe(201);
  });
});

describe("GET /car/1", () => {
  it("should respond 200 now that the bloody thing is there", async () => {
    const response = await request(app)
      .get("/car/1")
      .set("Authorization", fucking_auth);
    expect(response.statusCode).toBe(200);
  });
});

describe("GET /car", () => {
  it("should return one fucking car", async () => {
    const response = await request(app)
      .get("/car")
      .set("Authorization", fucking_auth);
      expect(response.statusCode).toBe(200);
      car_list = response.body;
      expect(car_list.length).toBe(1); 
  });
});

// add a new car
describe("POST /car", () => {
  it("should return OK", async () => {
    const newCar = { brand: "Ford", is_new: true };
    const response = await request(app)
      .post("/car")
      .set("Authorization", fucking_auth)
      .send(newCar);
    expect(response.statusCode).toBe(201);
  });
});

// now we have 2 cars omfg lol
describe("GET /car", () => {
  it("should return one fucking car", async () => {
    const response = await request(app)
      .get("/car")
      .set("Authorization", fucking_auth);
      expect(response.statusCode).toBe(200);
      car_list = response.body;
      expect(car_list.length).toBe(2); 
  });
});
