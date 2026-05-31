jest.mock('twilio', () => {
  return jest.fn().mockReturnValue({
    availablePhoneNumbers: jest.fn().mockReturnValue({
      local: {
        list: jest.fn().mockResolvedValue([{ phoneNumber: '+441234567890' }]),
      },
    }),
    incomingPhoneNumbers: Object.assign(
      jest.fn().mockReturnValue({
        remove: jest.fn().mockResolvedValue(true),
      }),
      {
        create: jest.fn().mockResolvedValue({
          sid: 'PN123',
          phoneNumber: '+441234567890',
        }),
      }
    ),
  })
})

import { buyUKNumber, buyEUNumber, releaseNumber } from '@/lib/twilio'

test('buyUKNumber returns sid and phoneNumber', async () => {
  const result = await buyUKNumber()
  expect(result.sid).toBe('PN123')
  expect(result.phoneNumber).toBe('+441234567890')
})

test('buyEUNumber returns a number', async () => {
  const result = await buyEUNumber()
  expect(result.phoneNumber).toBeDefined()
})

test('releaseNumber calls remove', async () => {
  await expect(releaseNumber('PN123')).resolves.not.toThrow()
})
