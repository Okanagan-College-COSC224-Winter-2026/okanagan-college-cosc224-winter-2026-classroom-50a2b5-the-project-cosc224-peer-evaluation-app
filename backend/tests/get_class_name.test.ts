import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { app } from '../src/app';

jest.mock('../src/util/database', () => ({
  Course: {
    findOne: jest.fn()
  }
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Course } = require('../src/util/database');

describe('GET /get_className/:classID', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return class name when class exists', async () => {
    Course.findOne.mockResolvedValue({
      id: 1,
      name: 'Computer Science 101'
    });

    const response = await app.inject({
      method: 'GET',
      url: '/get_className/1'
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual({
      className: 'Computer Science 101'
    });

    expect(Course.findOne).toHaveBeenCalledWith({
      where: { id: '1' }
    });
  });

  test('should return 404 when class does not exist', async () => {
    Course.findOne.mockResolvedValue(null);

    const response = await app.inject({
      method: 'GET',
      url: '/get_className/999'
    });

    expect(response.statusCode).toBe(404);
    expect(JSON.parse(response.body)).toEqual({
      error: 'Class not found'
    });

    expect(Course.findOne).toHaveBeenCalledWith({
      where: { id: '999' }
    });
  });
});
