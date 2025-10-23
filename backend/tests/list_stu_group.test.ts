import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { app } from '../src/app';

jest.mock('../src/util/database', () => {
  return {
    Group_Member: {
      findOne: jest.fn(),
      findAll: jest.fn(),
    },
  };
});

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Group_Member } = require('../src/util/database');

describe('/list_stu_groups/:assignmentID/:studentID', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return group members if student is in a group', async () => {
    Group_Member.findOne.mockResolvedValue({
      userID: 42,
      assignmentID: 99,
      groupID: 'team1',
    });

    Group_Member.findAll.mockResolvedValue([
      { id: 1, userID: 42, groupID: 'team1', assignmentID: 99 },
      { id: 2, userID: 43, groupID: 'team1', assignmentID: 99 }
    ]);

    const response = await app.inject({
      method: 'GET',
      url: '/list_stu_groups/99/42'
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual([
      { id: 1, userID: 42, groupID: 'team1', assignmentID: 99 },
      { id: 2, userID: 43, groupID: 'team1', assignmentID: 99 }
    ]);
    expect(Group_Member.findOne).toHaveBeenCalledWith({
      where: {
        userID: '42',
        assignmentID: '99'
      }
    });
    expect(Group_Member.findAll).toHaveBeenCalledWith({
      where: {
        assignmentID: '99',
        groupID: 'team1'
      }
    });
  });

  test('should return 300 if student has no group', async () => {
    Group_Member.findOne.mockResolvedValue(null);

    const response = await app.inject({
      method: 'GET',
      url: '/list_stu_groups/99/42'
    });

    expect(response.statusCode).toBe(300);
    expect(Group_Member.findOne).toHaveBeenCalledWith({
      where: {
        userID: '42',
        assignmentID: '99'
      }
    });
  });
});
