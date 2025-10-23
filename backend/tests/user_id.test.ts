import { describe, test, expect, beforeEach } from '@jest/globals';
import { app } from '../src/app';

describe('/user_id', () => {
  const testToken = 'mocktoken123';
  const mockUserID = 42;

  beforeEach(() => {
    // @ts-expect-error – overriding session is okay in test
    app.session = {
      [testToken]: {
        id: mockUserID
      }
    };
  });

  test('should return user ID when valid token is provided', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/user_id',
      headers: {
        authorization: `Bearer ${testToken}`
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.body).toBe(mockUserID.toString());
  });

  test('should throw when token is missing', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/user_id'
    });

    // It will probably throw TypeError (accessing `undefined.id`) unless caught in route
    // Adjust this depending on how robust you want error handling to be
    expect(response.statusCode).toBeGreaterThanOrEqual(500);
  });
});
