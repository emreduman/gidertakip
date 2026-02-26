try { require("dotenv").config(); } catch (e) { }
module.exports = { schema: 'prisma/schema.prisma', migrations: { path: 'prisma/migrations' }, datasource: { url: process.env.DATABASE_URL } };