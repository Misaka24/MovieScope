import test from 'node:test'
import assert from 'node:assert/strict'
import { getAdminAccess, requireAdminPermission } from './admin-service.mjs'

function mockDatabase(responses){let index=0;return{query:async()=>responses[index++]||{rows:[]}}}

test('管理员权限按分组继承并应用用户级允许与拒绝覆盖',async t=>{
 const original=globalThis.__moviescopeDatabaseForTest
 globalThis.__moviescopeDatabaseForTest=mockDatabase([
  {rows:[{id:1,slug:'operator',name:'运维',description:'',color:'#fff',isSystem:false}]},
  {rows:[{permissionKey:'dashboard.view'},{permissionKey:'cache.view'}]},
  {rows:[{permissionKey:'cache.view',effect:'deny'},{permissionKey:'analytics.view',effect:'allow'}]},
 ])
 t.after(()=>{globalThis.__moviescopeDatabaseForTest=original})
 const access=await getAdminAccess(1)
 assert.deepEqual(access.permissions,['analytics.view','dashboard.view'])
})

test('非管理员不能通过后台权限校验',async()=>{
 await assert.rejects(()=>requireAdminPermission({id:2,role:'user'},'dashboard.view'),error=>error.status===403)
})

