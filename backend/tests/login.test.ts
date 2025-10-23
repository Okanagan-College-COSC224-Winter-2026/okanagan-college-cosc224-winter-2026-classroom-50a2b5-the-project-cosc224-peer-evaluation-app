import { describe, expect, test, jest } from '@jest/globals';
import { app } from '../src/app'

jest.mock('../src/util/database', () => {
  return {
    User: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      findOne: jest.fn((config: any) => {
        const name = config.where.name;
        if (name === 'test') {
          return {
            id: 1,
            name: 'test',
            email: 'test@test.com',
            is_teacher: false,
          }
        }

        return null;
      }),
    }
  }
})

describe('/login', () => {
  test('proper login should return 200', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/login',
      headers: {
        authorization: 'Basic ' + btoa('test:test')
      }
    })
    expect(response.statusCode).toBe(200)
  })

  test('improper login should return 401', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/login',
      headers: {
        authorization: 'Basic ' + btoa('wrong:wrong')
      }
    })
    expect(response.statusCode).toBe(401)
  })
})