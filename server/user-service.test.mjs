
import test from 'node:test'
import assert from 'node:assert/strict'
import { hashPassword, verifyPassword } from './user-service.mjs'

test('密码使用随机盐 scrypt 哈希并可验证', async () => {
  const first = await hashPassword('StrongPass!123')
  const second = await hashPassword('StrongPass!123')
  assert.match(first, /^scrypt\$/)
  assert.notEqual(first, second)
  assert.equal(await verifyPassword('StrongPass!123', first), true)
  assert.equal(await verifyPassword('wrong-password', first), false)
})

test('密码长度校验拒绝弱短密码', async () => {
  await assert.rejects(() => hashPassword('short'), /8 到 128 位/)
})
