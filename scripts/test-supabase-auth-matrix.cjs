const fs = require("fs");
const { PrismaClient } = require("@prisma/client");

function envVal(key) {
  const env = fs.readFileSync(".env", "utf8");
  const m = env.match(new RegExp(`^${key}="([^"]+)"`, "m"));
  return m ? m[1] : null;
}

function passwordFromUrl(url) {
  const m = url.match(/^postgresql:\/\/[^:]+:([^@]+)@/);
  if (!m) throw new Error("password parse failed");
  return m[1];
}

(async () => {
  const dbUrl = envVal("DATABASE_URL");
  if (!dbUrl) throw new Error("DATABASE_URL missing");

  const encodedPass = passwordFromUrl(dbUrl);
  const hostBase = "aws-1-ap-south-1.pooler.supabase.com";
  const users = ["postgres.kfznceflzsvwtsztheyz", "postgres"];
  const ports = [6543, 5432];

  for (const user of users) {
    for (const port of ports) {
      const q = port === 6543 ? "pgbouncer=true&connection_limit=1&sslmode=require" : "sslmode=require";
      const url = `postgresql://${user}:${encodedPass}@${hostBase}:${port}/postgres?${q}`;
      const prisma = new PrismaClient({ datasources: { db: { url } } });
      try {
        await prisma.$queryRawUnsafe("SELECT 1");
        console.log(`${user}@${port}: ok`);
      } catch (e) {
        const msg = String(e?.message || e).split("\n").slice(-2).join(" | ");
        console.log(`${user}@${port}: fail -> ${msg}`);
      } finally {
        await prisma.$disconnect();
      }
    }
  }
})();
