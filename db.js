const Sequelize = require('sequelize');
const jwt = require('jsonwebtoken');
const { STRING } = Sequelize;
const config = {
  logging: false,
};
const bcrypt = require('bcrypt');

const SECRET_KEY = process.env.JWT;

// process.env.JWT = 'ourSecretKey'

if (process.env.LOGGING) {
  delete config.logging;
}
const conn = new Sequelize(
  process.env.DATABASE_URL || 'postgres://localhost/acme_db',
  config
);

// const conn = new Sequelize('postgres://mahfouzbasith@localhost:5432/acme_db');

const User = conn.define('user', {
  username: STRING,
  password: STRING,
});

// const token = jwt.sign({userId: 2}, SECRET_KEY)
// const token_Lucy = jwt.sign({userId: 1}, SECRET_KEY)
// const verifyGood = jwt.verify(token, SECRET_KEY)

User.byToken = async (token) => {
  try {
    // const user = await User.findByPk(token); //
    const verify = await jwt.verify(token, SECRET_KEY);
    if (verify) {
      return await User.findByPk(verify.userId);
    }
    const error = Error('bad credentials');
    error.status = 401;
    throw error;
  } catch (ex) {
    const error = Error('bad credentials');
    error.status = 401;
    throw error;
  }
};

User.authenticate = async ({ username, password }) => {
  const user = await User.findOne({
    where: {
      username,
      // password,
    },
  });

  const isValid = await bcrypt.compare(password, user.password )

  if (isValid) {
    return await jwt.sign({ userId: user.id }, SECRET_KEY); //create a token for the 'session'
  }
  const error = Error('bad credentials');
  error.status = 401;
  throw error;
};

User.beforeCreate(async (user) => {
  const SALT_COUNT = 5;
  const hashedPwd = await bcrypt.hash(user.password, SALT_COUNT);
  user.password = hashedPwd;
});

const syncAndSeed = async () => {
  await conn.sync({ force: true });
  const credentials = [
    { username: 'lucy', password: 'lucy_pw' },
    { username: 'moe', password: 'moe_pw' },
    { username: 'larry', password: 'larry_pw' },
  ];

  const [lucy, moe, larry] = await Promise.all(
    credentials.map((credential) => User.create(credential))
  );
  return {
    users: {
      lucy,
      moe,
      larry,
    },
  };
};

module.exports = {
  syncAndSeed,
  models: {
    User,
  },
};
