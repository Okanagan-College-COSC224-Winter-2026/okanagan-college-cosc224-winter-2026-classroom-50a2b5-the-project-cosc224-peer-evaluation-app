import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { app } from '../src/app';

jest.mock('../src/util/database', () => {
  return {
    CourseGroup: {
      findAll: jest.fn()
    },
  };
});

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { CourseGroup } = require('../src/util/database');

describe('/list_all_groups/:assignmentID', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return groups for a valid assignment ID', async () => {
    CourseGroup.findAll.mockResolvedValue([
      { id: 1, assignmentID: 5, groupName: 'Team A' },
      { id: 2, assignmentID: 5, groupName: 'Team B' }
    ]);

    const response = await app.inject({
      method: 'GET',
      url: '/list_all_groups/5'
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual([
      { id: 1, assignmentID: 5, groupName: 'Team A' },
      { id: 2, assignmentID: 5, groupName: 'Team B' }
    ]);
    expect(CourseGroup.findAll).toHaveBeenCalledWith({
      where: { assignmentID: '5' }
    });
  });

  test('should return empty array for assignment with no groups', async () => {
    CourseGroup.findAll.mockResolvedValue([]);

    const response = await app.inject({
      method: 'GET',
      url: '/list_all_groups/999'
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual([]);
    expect(CourseGroup.findAll).toHaveBeenCalledWith({
      where: { assignmentID: '999' }
    });
  });
});
