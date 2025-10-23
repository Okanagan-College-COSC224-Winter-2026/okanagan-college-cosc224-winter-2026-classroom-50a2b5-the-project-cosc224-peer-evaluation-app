import { describe, expect, test, jest, beforeEach } from '@jest/globals';
import { app } from '../src/app';

jest.mock('../src/util/database', () => {
  return {
    Assignment: {
      // We’ll replace this mock function in `beforeEach`
      findAll: jest.fn()
    },
  }
})

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Assignment } = require('../src/util/database');

describe('/assignments/:course', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return assignments for a valid course', async () => {
    Assignment.findAll.mockResolvedValue([
      { id: 1, courseID: 1, title: 'Algebra' },
      { id: 2, courseID: 1, title: 'Calculus' }
    ]);

    const response = await app.inject({
      method: 'GET',
      url: '/assignments/1'
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual([
      { id: 1, courseID: 1, title: 'Algebra' },
      { id: 2, courseID: 1, title: 'Calculus' }
    ]);
    expect(Assignment.findAll).toHaveBeenCalledWith({
      where: { courseID: '1' }
    });
  });

  test('should return empty array for unknown course', async () => {
    Assignment.findAll.mockResolvedValue([]);

    const response = await app.inject({
      method: 'GET',
      url: '/assignments/1'
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual([]);
    expect(Assignment.findAll).toHaveBeenCalledWith({
      where: { courseID: '1' }
    });
  });
});