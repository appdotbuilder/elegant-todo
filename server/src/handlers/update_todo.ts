
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type UpdateTodoInput, type Todo } from '../schema';
import { eq } from 'drizzle-orm';

export const updateTodo = async (input: UpdateTodoInput): Promise<Todo> => {
  try {
    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date() // Always update the timestamp
    };

    if (input.title !== undefined) {
      updateData.title = input.title;
    }
    
    if (input.description !== undefined) {
      updateData.description = input.description;
    }
    
    if (input.completed !== undefined) {
      updateData.completed = input.completed;
    }
    
    if (input.due_date !== undefined) {
      // Convert Date to string for database storage (date column type)
      updateData.due_date = input.due_date ? input.due_date.toISOString().split('T')[0] : null;
    }
    
    if (input.priority !== undefined) {
      updateData.priority = input.priority;
    }

    // Update the todo
    const result = await db.update(todosTable)
      .set(updateData)
      .where(eq(todosTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Todo with id ${input.id} not found`);
    }

    // Convert database result to match Todo schema (string dates back to Date objects)
    const todo = result[0];
    return {
      ...todo,
      due_date: todo.due_date ? new Date(todo.due_date) : null
    };
  } catch (error) {
    console.error('Todo update failed:', error);
    throw error;
  }
};
