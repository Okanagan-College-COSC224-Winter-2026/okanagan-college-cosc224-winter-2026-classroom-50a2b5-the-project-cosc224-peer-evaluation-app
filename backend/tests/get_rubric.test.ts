import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { app } from '../src/app';

jest.mock('../src/util/database', () => ({
  Rubric: {
    findOne: jest.fn()
  }
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Rubric } = require('../src/util/database');

describe('GET /rubric', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return rubric data when rubric exists', async () => {
    Rubric.findOne.mockResolvedValue({
      id: 1,
      assignmentID: 5,
      canComment: true
    });

    const response = await app.inject({
      method: 'GET',
      url: '/rubric?rubricID=1'
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual({
      id: 1,
      assignmentID: 5,
      canComment: true
    });

    expect(Rubric.findOne).toHaveBeenCalledWith({
      where: { id: 1 }
    });
  });

  test('should return 400 if rubricID is missing', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/rubric'
    });

    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body)).toEqual({
      error: 'rubricID is required'
    });

    expect(Rubric.findOne).not.toHaveBeenCalled();
  });

  test('should return 404 if rubric not found', async () => {
    Rubric.findOne.mockResolvedValue(null);

    const response = await app.inject({
      method: 'GET',
      url: '/rubric?rubricID=999'
    });

    expect(response.statusCode).toBe(404);
    expect(JSON.parse(response.body)).toEqual({
      error: 'Rubric not found'
    });

    expect(Rubric.findOne).toHaveBeenCalledWith({
      where: { id: 999 }
    });
  });
});
