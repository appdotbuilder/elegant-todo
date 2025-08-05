
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type CreateTodoInput } from '../schema';
import { createTodo } from '../handlers/create_todo';
import { eq } from 'drizzle-orm';

// Test input with all fields
const testInput: CreateTodoInput = {
  title: 'Test Todo',
  description: 'A todo for testing',
  due_date: new Date('2024-12-31'),
  priority: 'High'
};

// Minimal test input - priority is required in the handler input type
const minimalInput: CreateTodoInput = {
  title: 'Minimal Todo',
  priority: 'Medium'
};

describe('createTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a todo with all fields', async () => {
    const result = await createTodo(testInput);

    // Basic field validation
    expect(result.title).toEqual('Test Todo');
    expect(result.description).toEqual('A todo for testing');
    expect(result.completed).toEqual(false);
    expect(result.due_date).toBeInstanceOf(Date);
    expect(result.due_date?.toISOString().split('T')[0]).toEqual('2024-12-31');
    expect(result.priority).toEqual('High');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a todo with minimal fields and apply defaults', async () => {
    const result = await createTodo(minimalInput);

    // Verify defaults are applied
    expect(result.title).toEqual('Minimal Todo');
    expect(result.description).toBeNull();
    expect(result.completed).toEqual(false);
    expect(result.due_date).toBeNull();
    expect(result.priority).toEqual('Medium');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save todo to database', async () => {
    const result = await createTodo(testInput);

    // Query database to verify todo was saved
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, result.id))
      .execute();

    expect(todos).toHaveLength(1);
    const savedTodo = todos[0];
    
    expect(savedTodo.title).toEqual('Test Todo');
    expect(savedTodo.description).toEqual('A todo for testing');
    expect(savedTodo.completed).toEqual(false);
    expect(savedTodo.priority).toEqual('High');
    expect(savedTodo.created_at).toBeInstanceOf(Date);
    expect(savedTodo.updated_at).toBeInstanceOf(Date);
    
    // Verify due_date is stored correctly (as string in database)
    expect(savedTodo.due_date).toEqual('2024-12-31');
  });

  it('should handle null optional fields correctly', async () => {
    const inputWithNulls: CreateTodoInput = {
      title: 'Todo with nulls',
      description: null,
      due_date: null,
      priority: 'Low'
    };

    const result = await createTodo(inputWithNulls);

    expect(result.title).toEqual('Todo with nulls');
    expect(result.description).toBeNull();
    expect(result.due_date).toBeNull();
    expect(result.priority).toEqual('Low');
    expect(result.completed).toEqual(false);
  });

  it('should create multiple todos with unique IDs', async () => {
    const todo1 = await createTodo({ title: 'First Todo', priority: 'Medium' });
    const todo2 = await createTodo({ title: 'Second Todo', priority: 'Low' });

    expect(todo1.id).not.toEqual(todo2.id);
    expect(todo1.title).toEqual('First Todo');
    expect(todo2.title).toEqual('Second Todo');

    // Verify both are in database
    const allTodos = await db.select().from(todosTable).execute();
    expect(allTodos).toHaveLength(2);
  });
});
