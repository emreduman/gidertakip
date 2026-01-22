export default {
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL ?? "postgresql://dummy:dummy@localhost:5432/dummy"
  },
};

