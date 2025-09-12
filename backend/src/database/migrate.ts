import { readFileSync } from 'fs';
import { join } from 'path';
import { query } from './connection';

async function runMigrations() {
  try {
    console.log('🔄 Starting database migration...');

    // Read the schema file
    const schemaPath = join(__dirname, 'schema.sql');
    const schema = readFileSync(schemaPath, 'utf8');

    // Execute the schema
    await query(schema);

    console.log('✅ Database migration completed successfully');

    // Verify tables were created
    const result = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    console.log('📊 Created tables:');
    result.rows.forEach((row: any) => {
      console.log(`  - ${row.table_name}`);
    });

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('🎉 Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration script failed:', error);
      process.exit(1);
    });
}

export { runMigrations };
