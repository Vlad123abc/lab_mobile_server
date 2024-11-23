const config = {
  development: {
    connectionString: './development_db.sqlite',
  },
  test: {
    connectionString: ':memory:',
  },
  production: {
    connectionString: './production_db.sqlite',
  },
};

module.exports = config;
