
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { getTodos } from '../handlers/get_todos';

describe('getTodos', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no todos exist', async () => {
    const result = await getTodos();
    expect(result).toEqual([]);
  });

  it('should return all todos', async () => {
    // Create test todos
    await db.insert(todosTable)
      .values([
        {
          title: 'First Todo',
          description: 'First description',
          priority: 'High',
          due_date: '2024-12-31'
        },
        {
          title: 'Second Todo',
          description: null,
          priority: 'Low',
          due_date: null
        }
      ])
      .execute();

    const result = await getTodos();
    
    expect(result).toHaveLength(2);
    
    // Verify basic properties
    expect(result[0].title).toBeDefined();
    expect(result[0].id).toBeDefined();
    expect(result[0].completed).toBe(false);
    expect(result[0].priority).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });

  it('should return todos ordered by created_at descending', async () => {
    // Create todos with slight delay to ensure different timestamps
    await db.insert(todosTable)
      .values({
        title: 'First Todo',
        priority: 'Medium'
      })
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(todosTable)
      .values({
        title: 'Second Todo',
        priority: 'High'
      })
      .execute();

    const result = await getTodos();
    
    expect(result).toHaveLength(2);
    expect(result[0].title).toEqual('Second Todo'); // Most recent first
    expect(result[1].title).toEqual('First Todo');
    
    // Verify ordering by timestamp
    expect(result[0].created_at.getTime()).toBeGreaterThan(result[1].created_at.getTime());
  });

  it('should handle null values correctly', async () => {
    await db.insert(todosTable)
      .values({
        title: 'Test Todo',
        description: null,
        due_date: null,
        priority: 'Medium'
      })
      .execute();

    const result = await getTodos();
    
    expect(result).toHaveLength(1);
    expect(result[0].description).toBeNull();
    expect(result[0].due_date).toBeNull();
    expect(result[0].title).toEqual('Test Todo');
  });

  it('should convert date fields to proper Date objects', async () => {
    await db.insert(todosTable)
      .values({
        title: 'Todo with due date',
        due_date: '2024-12-25',
        priority: 'High'
      })
      .execute();

    const result = await getTodos();
    
    expect(result).toHaveLength(1);
    expect(result[0].due_date).toBeInstanceOf(Date);
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
    
    // Verify due date value
    expect(result[0].due_date?.toISOString().split('T')[0]).toEqual('2024-12-25');
  });
});
