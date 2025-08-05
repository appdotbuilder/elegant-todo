
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type CreateTodoInput, type Todo } from '../schema';

export const createTodo = async (input: CreateTodoInput): Promise<Todo> => {
  try {
    // Insert todo record
    const result = await db.insert(todosTable)
      .values({
        title: input.title,
        description: input.description || null,
        due_date: input.due_date ? input.due_date.toISOString().split('T')[0] : null, // Convert Date to string format
        priority: input.priority, // Zod default 'Medium' is already applied
        completed: false, // Default for new todos
      })
      .returning()
      .execute();

    // Return the created todo
    const todo = result[0];
    return {
      ...todo,
      // Convert date fields to proper Date objects
      due_date: todo.due_date ? new Date(todo.due_date) : null,
      created_at: new Date(todo.created_at),
      updated_at: new Date(todo.updated_at)
    };
  } catch (error) {
    console.error('Todo creation failed:', error);
    throw error;
  }
};
