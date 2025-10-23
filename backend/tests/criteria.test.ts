import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { app } from '../src/app';

jest.mock('../src/util/database', () => ({
  Criteria_Description: {
    findAll: jest.fn()
  }
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Criteria_Description } = require('../src/util/database');

describe('GET /criteria', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return criteria for a valid rubricID', async () => {
    Criteria_Description.findAll.mockResolvedValue([
      { id: 1, rubricID: 2, description: 'Clarity' },
      { id: 2, rubricID: 2, description: 'Completeness' }
    ]);

    const response = await app.inject({
      method: 'GET',
      url: '/criteria?rubricID=2'
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual([
      { id: 1, rubricID: 2, description: 'Clarity' },
      { id: 2, rubricID: 2, description: 'Completeness' }
    ]);
    expect(Criteria_Description.findAll).toHaveBeenCalledWith({
      where: { rubricID: 2 }
    });
  });

  test('should return 400 if rubricID is missing', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/criteria'
    });

    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body)).toEqual({
      error: 'rubricID is required'
    });

    expect(Criteria_Description.findAll).not.toHaveBeenCalled();
  });

  test('should return empty array if no criteria found', async () => {
    Criteria_Description.findAll.mockResolvedValue([]);

    const response = await app.inject({
      method: 'GET',
      url: '/criteria?rubricID=99'
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual([]);

    expect(Criteria_Description.findAll).toHaveBeenCalledWith({
      where: { rubricID: 99 }
    });
  });
});
