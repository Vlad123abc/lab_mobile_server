const request = require("supertest");
const app = require("../app"); // Adjust the path to your Express app

beforeAll((done) => {
  server = app.listen(3000, done); // Start the server before tests
});

afterAll((done) => {
  server.close(done); // Close the server after tests
});

describe("GET /car/1", () => {
  it("should respond 404", async () => {
    const response = await request(app).get("/car/1");
    expect(response.statusCode).toBe(404);
    expect(response.text).toBe("Not Found");
  });
});

describe("POST /car", () => {
  it("should return OK", async () => {
    const newCar = { brand: "Toyota", is_new: true };
    const response = await request(app).post("/car").send(newCar);
    expect(response.statusCode).toBe(200);
  });
});
