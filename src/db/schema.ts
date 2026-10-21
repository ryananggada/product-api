import {
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  password_hash: text('password_hash').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  price: numeric('price', {
    precision: 12,
    scale: 2,
    mode: 'number',
  }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 100 }).notNull(),
  images: text('images').array().notNull(),
  created_at: timestamp('created_at', { mode: 'string' })
    .defaultNow()
    .notNull(),
  created_by: varchar('created_by', { length: 50 }).notNull(),
  created_by_id: integer('created_by_id')
    .references(() => users.id)
    .notNull(),
  updated_at: timestamp('updated_at', { mode: 'string' })
    .defaultNow()
    .notNull(),
  updated_by: varchar('updated_by', { length: 50 }).notNull(),
  updated_by_id: integer('updated_by_id')
    .references(() => users.id)
    .notNull(),
});
