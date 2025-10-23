import {describe, expect, test} from '@jest/globals';
import { app } from '../src/app'

describe('/ping', () => {
  test('should return 200', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/ping'
    })
    expect(response.statusCode).toBe(200)
  })
})