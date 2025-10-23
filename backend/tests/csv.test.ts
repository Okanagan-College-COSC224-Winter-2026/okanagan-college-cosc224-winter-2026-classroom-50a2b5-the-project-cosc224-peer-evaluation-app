import { describe, expect, test } from '@jest/globals';
import { csv2json } from '../src/util/csv';

describe('csv2json', () => {
  test('should parse csv', () => {
    const csv = `id,name,email
300325853,Gregory Bigglesworth,gbizzle@yandex.ru
`;

    const parsed = csv2json(csv);

    expect(parsed).toEqual([
      {
        id: '300325853',
        name: 'Gregory Bigglesworth',
        email: 'gbizzle@yandex.ru',
      }
    ]);
  });
});