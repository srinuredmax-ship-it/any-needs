import { PrismaClient } from '@prisma/client';
const models = ['user', 'product', 'address', 'order', 'orderItem', 'orderStatusEvent', 'otpCode'];
const tables = ['User', 'Product', 'Address', 'Order', 'OrderItem', 'OrderStatusEvent', 'OtpCode'];
export async function transferDatabase(sourceUrl, targetUrl) {
  if (sourceUrl === targetUrl) throw new Error('Transfer requires distinct databases');
  const source = new PrismaClient({ datasourceUrl: sourceUrl });
  const target = new PrismaClient({ datasourceUrl: targetUrl });
  try {
    await source.$transaction(async old => {
      // Block concurrent changes while taking the final snapshot.
      await old.$executeRawUnsafe(`LOCK TABLE ${tables.map(t => '"' + t + '"').join(', ')} IN EXCLUSIVE MODE`);
      const rows = {};
      for (const model of models) rows[model] = await old[model].findMany({ orderBy: { id: 'asc' } });
      await target.$transaction(async next => {
        const counts = await Promise.all(models.map(model => next[model].count()));
        if (counts.some(n => n > 0)) {
          // A retry is permitted only when every saved row matches exactly.
          for (const model of models) {
            const existing = await next[model].findMany({ orderBy: { id: 'asc' } });
            if (JSON.stringify(existing) !== JSON.stringify(rows[model])) throw new Error('Destination contains different data; transfer stopped');
          }
        } else {
          for (const model of models) {
            for (let offset = 0; offset < rows[model].length; offset += 100) {
              await next[model].createMany({ data: rows[model].slice(offset, offset + 100) });
            }
          }
          for (const model of models) {
            const copied = await next[model].findMany({ orderBy: { id: 'asc' } });
            if (JSON.stringify(copied) !== JSON.stringify(rows[model])) throw new Error('Transfer verification failed');
          }
        }
      }, { timeout: 120000 });
      // Keep the retired database readable, preventing writes to the old deployment.
      await old.$executeRawUnsafe(`CREATE OR REPLACE FUNCTION any_needs_retired_database() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Database moved; please reload the website'; END $$`);
      for (const table of tables) {
        await old.$executeRawUnsafe(`DROP TRIGGER IF EXISTS any_needs_retired ON "${table}"`);
        await old.$executeRawUnsafe(`CREATE TRIGGER any_needs_retired BEFORE INSERT OR UPDATE OR DELETE ON "${table}" FOR EACH STATEMENT EXECUTE FUNCTION any_needs_retired_database()`);
      }
      console.log('Database transfer verified:', models.map(model => `${model}=${rows[model].length}`).join(', '));
    }, { timeout: 180000 });
  } finally {
    await source.$disconnect();
    await target.$disconnect();
  }
}
