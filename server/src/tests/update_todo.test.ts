
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type UpdateTodoInput, type CreateTodoInput } from '../schema';
import { updateTodo } from '../handlers/update_todo';
import { eq } from 'drizzle-orm';

// Helper function to create a test todo
const createTestTodo = async (): Promise<number> => {
  const result = await db.insert(todosTable)
    .values({
      title: 'Original Todo',
      description: 'Original description',
      completed: false,
      due_date: '2024-12-31', // Store as string in database
      priority: 'Low'
    })
    .returning()
    .execute();
  
  return result[0].id;
};

describe('updateTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update a todo with all fields', async () => {
    const todoId = await createTestTodo();
    
    const updateInput: UpdateTodoInput = {
      id: todoId,
      title: 'Updated Todo Title',
      description: 'Updated description',
      completed: true,
      due_date: new Date('2025-01-15'),
      priority: 'High'
    };

    const result = await updateTodo(updateInput);

    expect(result.id).toEqual(todoId);
    expect(result.title).toEqual('Updated Todo Title');
    expect(result.description).toEqual('Updated description');
    expect(result.completed).toEqual(true);
    expect(result.due_date).toEqual(new Date('2025-01-15'));
    expect(result.priority).toEqual('High');
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update only provided fields', async () => {
    const todoId = await createTestTodo();
    
    const updateInput: UpdateTodoInput = {
      id: todoId,
      title: 'Partially Updated Title',
      completed: true
    };

    const result = await updateTodo(updateInput);

    expect(result.id).toEqual(todoId);
    expect(result.title).toEqual('Partially Updated Title');
    expect(result.description).toEqual('Original description'); // Should remain unchanged
    expect(result.completed).toEqual(true);
    expect(result.due_date).toEqual(new Date('2024-12-31')); // Should remain unchanged
    expect(result.priority).toEqual('Low'); // Should remain unchanged
  });

  it('should update description to null', async () => {
    const todoId = await createTestTodo();
    
    const updateInput: UpdateTodoInput = {
      id: todoId,
      description: null
    };

    const result = await updateTodo(updateInput);

    expect(result.id).toEqual(todoId);
    expect(result.description).toBeNull();
    expect(result.title).toEqual('Original Todo'); // Should remain unchanged
  });

  it('should update due_date to null', async () => {
    const todoId = await createTestTodo();
    
    const updateInput: UpdateTodoInput = {
      id: todoId,
      due_date: null
    };

    const result = await updateTodo(updateInput);

    expect(result.id).toEqual(todoId);
    expect(result.due_date).toBeNull();
    expect(result.title).toEqual('Original Todo'); // Should remain unchanged
  });

  it('should save updated todo to database', async () => {
    const todoId = await createTestTodo();
    
    const updateInput: UpdateTodoInput = {
      id: todoId,
      title: 'Database Updated Title',
      priority: 'High'
    };

    await updateTodo(updateInput);

    // Verify in database
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, todoId))
      .execute();

    expect(todos).toHaveLength(1);
    expect(todos[0].title).toEqual('Database Updated Title');
    expect(todos[0].priority).toEqual('High');
    expect(todos[0].description).toEqual('Original description'); // Unchanged
    expect(todos[0].updated_at).toBeInstanceOf(Date);
  });

  it('should always update the updated_at timestamp', async () => {
    const todoId = await createTestTodo();
    
    // Get original timestamp
    const originalTodo = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, todoId))
      .execute();
    
    const originalUpdatedAt = originalTodo[0].updated_at;
    
    // Wait a small amount to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const updateInput: UpdateTodoInput = {
      id: todoId,
      title: 'Timestamp Test'
    };

    const result = await updateTodo(updateInput);

    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });

  it('should handle date conversion correctly', async () => {
    const todoId = await createTestTodo();
    
    const testDate = new Date('2025-06-15');
    const updateInput: UpdateTodoInput = {
      id: todoId,
      due_date: testDate
    };

    const result = await updateTodo(updateInput);

    expect(result.due_date).toBeInstanceOf(Date);
    expect(result.due_date).toEqual(testDate);

    // Verify stored as string in database
    const dbTodo = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, todoId))
      .execute();
    
    expect(typeof dbTodo[0].due_date).toBe('string');
    expect(dbTodo[0].due_date).toBe('2025-06-15');
  });

  it('should throw error for non-existent todo', async () => {
    const updateInput: UpdateTodoInput = {
      id: 99999, // Non-existent ID
      title: 'This should fail'
    };

    expect(updateTodo(updateInput)).rejects.toThrow(/not found/i);
  });
});
