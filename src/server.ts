import 'dotenv/config';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db } from './db';
import app from './app';

async function main() {
  await migrate(db, { migrationsFolder: './drizzle' });
  app.listen(process.env.PORT ?? 8000, () => console.log('API running'));
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
