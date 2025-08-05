
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type GetTodoInput, type Todo } from '../schema';
import { eq } from 'drizzle-orm';

export const getTodo = async (input: GetTodoInput): Promise<Todo | null> => {
  try {
    const result = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, input.id))
      .execute();

    if (result.length === 0) {
      return null;
    }

    const todo = result[0];
    
    // Convert date string to Date object to match schema expectations
    return {
      ...todo,
      due_date: todo.due_date ? new Date(todo.due_date) : null
    };
  } catch (error) {
    console.error('Get todo failed:', error);
    throw error;
  }
};
