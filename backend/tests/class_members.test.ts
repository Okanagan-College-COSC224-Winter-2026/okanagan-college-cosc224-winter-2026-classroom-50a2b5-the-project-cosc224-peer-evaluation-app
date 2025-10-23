import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { app } from '../src/app';

jest.mock('../src/util/database', () => ({
  User: {
    findAll: jest.fn()
  },
  User_Course: {
    findAll: jest.fn()
  }
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { User, User_Course } = require('../src/util/database');

describe('POST /classes/members', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return members of a course by course ID', async () => {
    User_Course.findAll.mockResolvedValue([
      { userID: 1 },
      { userID: 2 }
    ]);

    User.findAll.mockResolvedValue([
      { id: 1, name: 'Alice', email: 'alice@test.com' },
      { id: 2, name: 'Bob', email: 'bob@test.com' }
    ]);

    const response = await app.inject({
      method: 'POST',
      url: '/classes/members',
      payload: {
        id: 42
      }
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual([
      { id: 1, name: 'Alice', email: 'alice@test.com' },
      { id: 2, name: 'Bob', email: 'bob@test.com' }
    ]);

    expect(User_Course.findAll).toHaveBeenCalledWith({
      where: {
        courseID: 42
      }
    });

    expect(User.findAll).toHaveBeenCalledWith({
      where: {
        id: [1, 2]
      },
      attributes: ['id', 'name', 'email']
    });
  });

  test('should return empty array if no users are enrolled', async () => {
    User_Course.findAll.mockResolvedValue([]);
    User.findAll.mockResolvedValue([]);

    const response = await app.inject({
      method: 'POST',
      url: '/classes/members',
      payload: {
        id: 999
      }
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual([]);

    expect(User_Course.findAll).toHaveBeenCalledWith({
      where: {
        courseID: 999
      }
    });

    expect(User.findAll).toHaveBeenCalledWith({
      where: {
        id: []
      },
      attributes: ['id', 'name', 'email']
    });
  });
});
