import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function testConnection() {
  try {
    console.log('🔌 Testing DigitalOcean PostgreSQL connection...\n');
    
    const client = await pool.connect();
    console.log('✅ Connected successfully!');
    
    // Test query
    const result = await client.query('SELECT NOW(), version()');
    console.log('\n📅 Server time:', result.rows[0].now);
    console.log('🗄️  PostgreSQL version:', result.rows[0].version.split(' ')[0], result.rows[0].version.split(' ')[1]);
    
    // Check if tables exist
    const tables = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);
    
    console.log('\n📋 Existing tables:');
    if (tables.rows.length === 0) {
      console.log('  No tables found. Run "npm run db:create" to create tables.');
    } else {
      tables.rows.forEach(row => {
        console.log(`  - ${row.tablename}`);
      });
    }
    
    client.release();
    await pool.end();
    
    console.log('\n🎉 Connection test successful!');
    
  } catch (error) {
    console.error('\n❌ Connection failed:', error);
    console.error('\n💡 Make sure:');
    console.error('  1. DATABASE_URL is set in .env.local');
    console.error('  2. Your IP is whitelisted in DigitalOcean');
    console.error('  3. Database is running');
    process.exit(1);
  }
}

testConnection();