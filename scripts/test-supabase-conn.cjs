const fs = require("fs");
const { PrismaClient } = require("@prisma/client");

function getEnvValue(content, key) {
  const m = content.match(new RegExp(`^${key}="([^"]+)"`, "m"));
  return m ? m[1] : null;
}

(async () => {
  const env = fs.readFileSync(".env", "utf8");
  const dbUrl = getEnvValue(env, "DATABASE_URL");
  const directUrl = getEnvValue(env, "DIRECT_URL");

  if (!dbUrl || !directUrl) {
    console.log("missing env urls");
    process.exit(1);
  }

  const sessionCandidate = dbUrl
    .replace(":6543/", ":5432/")
    .replace(/[?&]pgbouncer=true/, "")
    .replace("?&", "?")
    .replace(/\?$/, "");

  const urls = [
    ["transaction-6543", dbUrl],
    ["session-5432", sessionCandidate],
    ["direct-5432", directUrl]
  ];

  for (const [name, url] of urls) {
    const prisma = new PrismaClient({ datasources: { db: { url } } });
    try {
      await prisma.$queryRawUnsafe("SELECT 1");
      console.log(`${name}: ok`);
    } catch (e) {
      const raw = (e && e.message ? e.message : String(e));
      const tail = raw.split("\n").filter(Boolean).slice(-2).join(" | ");
      console.log(`${name}: fail -> ${tail}`);
    } finally {
      await prisma.$disconnect();
    }
  }
})();
