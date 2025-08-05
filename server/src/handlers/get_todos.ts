
import { db } from '../db';
import { todosTable } from '../db/schema';
import { desc } from 'drizzle-orm';
import { type Todo } from '../schema';

export const getTodos = async (): Promise<Todo[]> => {
  try {
    const results = await db.select()
      .from(todosTable)
      .orderBy(desc(todosTable.created_at))
      .execute();

    // Convert date strings to Date objects and ensure proper types
    return results.map(todo => ({
      ...todo,
      due_date: todo.due_date ? new Date(todo.due_date) : null,
      created_at: new Date(todo.created_at),
      updated_at: new Date(todo.updated_at)
    }));
  } catch (error) {
    console.error('Failed to fetch todos:', error);
    throw error;
  }
};
