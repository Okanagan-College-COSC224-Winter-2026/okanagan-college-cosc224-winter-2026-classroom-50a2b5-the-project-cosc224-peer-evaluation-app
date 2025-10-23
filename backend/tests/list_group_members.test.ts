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

describe('/list_group_members/:assignmentID/:groupID', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return members of a group for a given assignment', async () => {
    Group_Member.findAll.mockResolvedValue([
      { id: 1, assignmentID: 4, groupID: 'alpha', name: 'Eve' },
      { id: 2, assignmentID: 4, groupID: 'alpha', name: 'Frank' }
    ]);

    const response = await app.inject({
      method: 'GET',
      url: '/list_group_members/4/alpha'
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual([
      { id: 1, assignmentID: 4, groupID: 'alpha', name: 'Eve' },
      { id: 2, assignmentID: 4, groupID: 'alpha', name: 'Frank' }
    ]);
    expect(Group_Member.findAll).toHaveBeenCalledWith({
      where: {
        groupID: 'alpha',
        assignmentID: '4'
      }
    });
  });

  test('should return empty array if group has no members', async () => {
    Group_Member.findAll.mockResolvedValue([]);

    const response = await app.inject({
      method: 'GET',
      url: '/list_group_members/4/alpha'
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual([]);
    expect(Group_Member.findAll).toHaveBeenCalledWith({
      where: {
        groupID: 'alpha',
        assignmentID: '4'
      }
    });
  });
});
