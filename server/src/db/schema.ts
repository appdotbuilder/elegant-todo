
import { serial, text, pgTable, timestamp, boolean, pgEnum, date } from 'drizzle-orm/pg-core';

// Define priority enum for database
export const priorityEnum = pgEnum('priority', ['Low', 'Medium', 'High']);

export const todosTable = pgTable('todos', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'), // Nullable by default
  completed: boolean('completed').notNull().default(false),
  due_date: date('due_date'), // Nullable by default, using date type for due dates
  priority: priorityEnum('priority').notNull().default('Medium'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// TypeScript types for the table schema
export type Todo = typeof todosTable.$inferSelect; // For SELECT operations
export type NewTodo = typeof todosTable.$inferInsert; // For INSERT operations

// Important: Export all tables for proper query building
export const tables = { todos: todosTable };
