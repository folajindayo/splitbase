import { DatabaseClient } from "./client";

export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export abstract class Repository<T extends BaseEntity> {
  constructor(
    protected db: DatabaseClient,
    protected tableName: string
  ) {}

  async findById(id: string): Promise<T | null> {
    const sql = `SELECT * FROM ${this.tableName} WHERE id = $1`;
    return await this.db.queryOne<T>(sql, [id]);
  }

  async findAll(limit: number = 100, offset: number = 0): Promise<T[]> {
    const sql = `SELECT * FROM ${this.tableName} LIMIT $1 OFFSET $2`;
    return await this.db.query<T>(sql, [limit, offset]);
  }

  async findWhere(conditions: Partial<T>): Promise<T[]> {
    const keys = Object.keys(conditions);
    const values = Object.values(conditions);

    if (keys.length === 0) {
      return await this.findAll();
    }

    const whereClauses = keys.map((key, i) => `${key} = $${i + 1}`).join(" AND ");
    const sql = `SELECT * FROM ${this.tableName} WHERE ${whereClauses}`;

    return await this.db.query<T>(sql, values);
  }

  async create(data: Omit<T, "id" | "createdAt" | "updatedAt">): Promise<T> {
    const now = new Date().toISOString();
    const id = this.generateId();

    const entity = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    } as T;

    const keys = Object.keys(entity);
    const values = Object.values(entity);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ");

    const sql = `
      INSERT INTO ${this.tableName} (${keys.join(", ")})
      VALUES (${placeholders})
      RETURNING *
    `;

    const result = await this.db.queryOne<T>(sql, values);
    return result || entity;
  }

  async update(id: string, data: Partial<Omit<T, "id" | "createdAt">>): Promise<T | null> {
    const updateData = {
      ...data,
      updatedAt: new Date().toISOString(),
    };

    const keys = Object.keys(updateData);
    const values = Object.values(updateData);

    const setClauses = keys.map((key, i) => `${key} = $${i + 1}`).join(", ");
    const sql = `
      UPDATE ${this.tableName}
      SET ${setClauses}
      WHERE id = $${keys.length + 1}
      RETURNING *
    `;

    return await this.db.queryOne<T>(sql, [...values, id]);
  }

  async delete(id: string): Promise<boolean> {
    const sql = `DELETE FROM ${this.tableName} WHERE id = $1`;
    const result = await this.db.execute(sql, [id]);
    return result.affectedRows > 0;
  }

  async count(conditions?: Partial<T>): Promise<number> {
    let sql = `SELECT COUNT(*) as count FROM ${this.tableName}`;
    let values: any[] = [];

    if (conditions) {
      const keys = Object.keys(conditions);
      values = Object.values(conditions);

      if (keys.length > 0) {
        const whereClauses = keys.map((key, i) => `${key} = $${i + 1}`).join(" AND ");
        sql += ` WHERE ${whereClauses}`;
      }
    }

    const result = await this.db.queryOne<{ count: number }>(sql, values);
    return result?.count || 0;
  }

  protected generateId(): string {
    return `${this.tableName}_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }
}

