// Database migration example
// In production, use a proper migration tool like Prisma Migrate or Knex

export const migration001 = {
  up: async (db: any) => {
    // Create escrows table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS escrows (
        id VARCHAR(255) PRIMARY KEY,
        buyer VARCHAR(255) NOT NULL,
        seller VARCHAR(255) NOT NULL,
        amount VARCHAR(100) NOT NULL,
        status VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Create splits table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS splits (
        id VARCHAR(255) PRIMARY KEY,
        owner VARCHAR(255) NOT NULL,
        total_distributed VARCHAR(100) DEFAULT '0',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Create split_recipients table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS split_recipients (
        id INT AUTO_INCREMENT PRIMARY KEY,
        split_id VARCHAR(255) NOT NULL,
        address VARCHAR(255) NOT NULL,
        percentage INT NOT NULL,
        FOREIGN KEY (split_id) REFERENCES splits(id) ON DELETE CASCADE
      )
    `);

    // Create custody_transactions table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS custody_transactions (
        hash VARCHAR(255) PRIMARY KEY,
        from_address VARCHAR(255) NOT NULL,
        to_address VARCHAR(255) NOT NULL,
        amount VARCHAR(100) NOT NULL,
        token VARCHAR(255),
        status VARCHAR(50) NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log("Migration 001: Initial schema created");
  },

  down: async (db: any) => {
    await db.execute("DROP TABLE IF EXISTS custody_transactions");
    await db.execute("DROP TABLE IF EXISTS split_recipients");
    await db.execute("DROP TABLE IF EXISTS splits");
    await db.execute("DROP TABLE IF EXISTS escrows");

    console.log("Migration 001: Schema dropped");
  },
};

