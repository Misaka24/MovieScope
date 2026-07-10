
import { loadEnv } from '../server/env.mjs'
import { getDatabase } from '../server/database.mjs'
import { promoteUser } from '../server/user-service.mjs'
loadEnv()
const identifier=process.argv[2]
if(!identifier){console.error('用法：npm run admin:promote -- <用户名或邮箱>');process.exitCode=1}else{try{await promoteUser(identifier);console.log(`已将 ${identifier} 提升为管理员。`)}catch(error){console.error(error instanceof Error?error.message:error);process.exitCode=1}finally{const db=await getDatabase();await db.close()}}
