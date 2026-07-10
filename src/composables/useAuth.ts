
import { readonly,ref } from 'vue'
import { authApi,type SessionUser } from '../services/user-api'
const user=ref<SessionUser|null>(null),ready=ref(false)
async function refresh(){try{user.value=(await authApi.me()).user}catch{user.value=null}finally{ready.value=true}}
async function login(identifier:string,password:string){user.value=(await authApi.login(identifier,password)).user}
async function register(input:{username:string;email:string;password:string;displayName:string}){user.value=(await authApi.register(input)).user}
async function logout(){await authApi.logout();user.value=null}
export function useAuth(){return{user:readonly(user),ready:readonly(ready),refresh,login,register,logout}}
