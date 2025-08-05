
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type DeleteTodoInput } from '../schema';
import { deleteTodo } from '../handlers/delete_todo';
import { eq } from 'drizzle-orm';

describe('deleteTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing todo', async () => {
    // Create a test todo first
    const insertedTodos = await db.insert(todosTable)
      .values({
        title: 'Test Todo',
        description: 'A todo for testing deletion',
        completed: false,
        due_date: '2024-12-31',
        priority: 'Medium'
      })
      .returning()
      .execute();

    const todoId = insertedTodos[0].id;
    const deleteInput: DeleteTodoInput = { id: todoId };

    // Delete the todo
    const result = await deleteTodo(deleteInput);

    // Verify success response
    expect(result.success).toBe(true);

    // Verify todo was actually deleted from database
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, todoId))
      .execute();

    expect(todos).toHaveLength(0);
  });

  it('should throw error when todo does not exist', async () => {
    const nonExistentId = 999;
    const deleteInput: DeleteTodoInput = { id: nonExistentId };

    // Attempt to delete non-existent todo should throw error
    await expect(deleteTodo(deleteInput)).rejects.toThrow(/not found/i);
  });

  it('should only delete the specified todo', async () => {
    // Create multiple test todos
    const insertedTodos = await db.insert(todosTable)
      .values([
        {
          title: 'Todo 1',
          description: 'First todo',
          completed: false,
          priority: 'Low'
        },
        {
          title: 'Todo 2', 
          description: 'Second todo',
          completed: true,
          priority: 'High'
        }
      ])
      .returning()
      .execute();

    const firstTodoId = insertedTodos[0].id;
    const secondTodoId = insertedTodos[1].id;

    // Delete only the first todo
    const deleteInput: DeleteTodoInput = { id: firstTodoId };
    const result = await deleteTodo(deleteInput);

    expect(result.success).toBe(true);

    // Verify first todo is deleted
    const firstTodos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, firstTodoId))
      .execute();
    expect(firstTodos).toHaveLength(0);

    // Verify second todo still exists
    const secondTodos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, secondTodoId))
      .execute();
    expect(secondTodos).toHaveLength(1);
    expect(secondTodos[0].title).toEqual('Todo 2');
  });
});
