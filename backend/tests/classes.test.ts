import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { app } from '../src/app';

jest.mock('../src/util/database', () => {
  return {
    Course: {
      findAll: jest.fn()
    },
  };
});

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Course } = require('../src/util/database');

describe('/classes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return list of courses', async () => {
    Course.findAll.mockResolvedValue([
      { id: 1, name: 'Math 101' },
      { id: 2, name: 'History 202' }
    ]);

    const response = await app.inject({
      method: 'GET',
      url: '/classes'
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual([
      { id: 1, name: 'Math 101' },
      { id: 2, name: 'History 202' }
    ]);
    expect(Course.findAll).toHaveBeenCalledWith({});
  });

  test('should return empty array when no courses exist', async () => {
    Course.findAll.mockResolvedValue([]);

    const response = await app.inject({
      method: 'GET',
      url: '/classes'
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual([]);
    expect(Course.findAll).toHaveBeenCalledWith({});
  });
});
