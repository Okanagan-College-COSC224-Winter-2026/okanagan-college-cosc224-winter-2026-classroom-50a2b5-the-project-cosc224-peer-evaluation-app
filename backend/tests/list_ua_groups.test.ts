import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { app } from '../src/app';

jest.mock('../src/util/database', () => {
  return {
    Group_Member: {
      findAll: jest.fn()
    },
  };
});

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Group_Member } = require('../src/util/database');

describe('/list_ua_groups/:assignmentID', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return unassigned group members for a valid assignment', async () => {
    Group_Member.findAll.mockResolvedValue([
      { id: 1, assignmentID: 10, groupID: -1, name: 'Alice' },
      { id: 2, assignmentID: 10, groupID: -1, name: 'Bob' }
    ]);

    const response = await app.inject({
      method: 'GET',
      url: '/list_ua_groups/10'
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual([
      { id: 1, assignmentID: 10, groupID: -1, name: 'Alice' },
      { id: 2, assignmentID: 10, groupID: -1, name: 'Bob' }
    ]);
    expect(Group_Member.findAll).toHaveBeenCalledWith({
      where: {
        groupID: -1,
        assignmentID: '10'
      }
    });
  });

  test('should return empty array if no unassigned members exist', async () => {
    Group_Member.findAll.mockResolvedValue([]);

    const response = await app.inject({
      method: 'GET',
      url: '/list_ua_groups/10'
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual([]);
    expect(Group_Member.findAll).toHaveBeenCalledWith({
      where: {
        groupID: -1,
        assignmentID: '10'
      }
    });
  });
});
