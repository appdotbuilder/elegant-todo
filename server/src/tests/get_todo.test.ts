
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type GetTodoInput } from '../schema';
import { getTodo } from '../handlers/get_todo';

describe('getTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return a todo when it exists', async () => {
    // Create a test todo
    const testDate = new Date('2024-12-31');
    const insertResult = await db.insert(todosTable)
      .values({
        title: 'Test Todo',
        description: 'A test todo item',
        completed: false,
        due_date: testDate.toISOString().split('T')[0], // Convert to YYYY-MM-DD format
        priority: 'High'
      })
      .returning()
      .execute();

    const createdTodo = insertResult[0];
    
    const input: GetTodoInput = {
      id: createdTodo.id
    };

    const result = await getTodo(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdTodo.id);
    expect(result!.title).toEqual('Test Todo');
    expect(result!.description).toEqual('A test todo item');
    expect(result!.completed).toEqual(false);
    expect(result!.due_date).toBeInstanceOf(Date);
    expect(result!.due_date?.toISOString().split('T')[0]).toEqual('2024-12-31');
    expect(result!.priority).toEqual('High');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when todo does not exist', async () => {
    const input: GetTodoInput = {
      id: 999 // Non-existent ID
    };

    const result = await getTodo(input);

    expect(result).toBeNull();
  });

  it('should return todo with null optional fields', async () => {
    // Create a todo with minimal required fields
    const insertResult = await db.insert(todosTable)
      .values({
        title: 'Minimal Todo',
        description: null,
        due_date: null
      })
      .returning()
      .execute();

    const createdTodo = insertResult[0];
    
    const input: GetTodoInput = {
      id: createdTodo.id
    };

    const result = await getTodo(input);

    expect(result).not.toBeNull();
    expect(result!.title).toEqual('Minimal Todo');
    expect(result!.description).toBeNull();
    expect(result!.due_date).toBeNull();
    expect(result!.completed).toEqual(false); // Default value
    expect(result!.priority).toEqual('Medium'); // Default value
  });
});
