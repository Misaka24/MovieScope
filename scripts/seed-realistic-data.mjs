import { createHash, randomBytes } from "node:crypto";
import { loadEnv } from "../server/env.mjs";
import { getDatabase } from "../server/database.mjs";
import { hashPassword } from "../server/user-service.mjs";

loadEnv();
const token = process.env.TMDB_ACCESS_TOKEN;
if (!token) throw new Error("缺少 TMDB_ACCESS_TOKEN");

const titleOverrides = new Map([[19404,"三傻大闹宝莱坞"],[77338,"触不可及"],[70523,"暗黑"],[100088,"最后生还者"],[95396,"人生切割术"]]);
const mediaSeeds = [
  ["movie",278],["movie",238],["movie",424],["movie",129],["movie",13],["movie",155],
  ["movie",27205],["movie",157336],["movie",372058],["movie",496243],["movie",550],["movie",680],
  ["movie",120467],["movie",497],["movie",122],["movie",603],["movie",807],["movie",637],
  ["movie",19404],["movie",77338],["tv",1396],["tv",1399],["tv",60625],["tv",66732],
  ["tv",94997],["tv",70523],["tv",100088],["tv",95396]
];
const handles = [
  "北岸放映员","晚风入场券","胶片星尘","银幕漫游者","海盐爆米花","午夜散场","山城观影人","不赶末班车","白昼梦游指南","雨夜录像厅",
  "橘子汽水电影局","远山与镜头","蓝色座椅","光影拾荒者","月球放映室","旧票根收藏家","夏日字幕组","沿海公路片","空镜头","一格胶片",
  "云端看片会","长街灯影","深夜第七码","海边电影院","明暗之间","纸上蒙太奇","未完待续","小岛银幕","北纬三十度","散场以后",
  "NoirWalker","FrameByFrame","SundayCinema","BlueReel","QuietAudience","AfterCredits","MiseEnScene","LastRowSeat","FilmVoyager","NeonScreen",
  "木棉花开时","冬青放映社","星河剪辑室","暮色对白","一页分镜","城市边缘人","小镇录像带","逆光看电影","雾中剧场","青苔台阶",
  "焦糖拿铁不加糖","路过银河系","凌晨两点半","温柔的镜头","南方来信","风吹旧海报","松林电影院","平原上的夏天","慢镜头生活","候场的人",
  "电影散步者","第七码头","银幕之外","今天也看电影","片尾曲未停","黑猫放映室","一个观众","长镜头练习","纸月亮","夜航西飞",
  "星光检票口","日落大道口","山谷回声","海浪与字幕","周末场记","栗子放映机","平行剪辑","光圈日记","未命名影迷","红色幕布",
  "穿过银幕","城市霓虹灯","回到开场前","电影候鸟","漂浮镜头","雨天看旧片","对白收藏册","荒野电影院","落日剪影","胶片温度",
  "凌晨放映","小熊观影团","海岸线以北","星星落在片尾","清醒梦剧场","十一号影厅","远方的银幕","风景在途中","看完再说","下一场见"
];
const reviews = new Map([
  [278,["希望并不是凭空出现的乐观，而是在漫长困境里仍然保留选择的能力。结尾的海风让前面的压抑都有了重量。","重看后更喜欢那些安静的段落。人物之间不需要太多对白，时间本身就把友谊写得足够清楚。"]],
  [238,["电影最迷人的不是权力本身，而是家庭语言如何逐渐变成权力语言。婚礼开场依旧是教科书级别。","迈克的变化没有被处理成突然的黑化，每一次沉默都在把他推向那个座位。"]],
  [424,["黑白影像没有拉开距离，反而让名单上的每一个名字更具体。红衣女孩的处理至今仍有冲击力。"]],
  [129,["成长不是离开幻想，而是学会在陌生规则里保住自己的名字。音乐一响，很多记忆会一起回来。","无脸男并不只是怪物，他更像被欲望环境放大的空壳。千寻的善意始终有边界，这一点很好。"]],
  [13,["阿甘未必理解时代，但他真诚地穿过了时代。电影的温柔来自它始终没有嘲笑这种真诚。"]],
  [155,["希斯·莱杰的表演让混乱不再只是反派口号，而成为对城市秩序真正有效的压力测试。","动作场面之外，渡轮段落才是全片最关键的选择题。它给黑暗留出了一点不廉价的希望。"]],
  [27205,["概念复杂但叙事目标一直很清楚：回家。正因为情感线足够简单，多层梦境才没有失去方向。"]],
  [157336,["宏大的宇宙尺度最后仍落在亲人之间错过的时间上。看完最难忘的不是黑洞，而是那些积累多年的视频留言。","配乐和画面共同制造了真正的尺度感，米勒星球的一次滴答声比很多对白更让人紧张。"]],
  [372058,["交换身体只是入口，真正动人的是两个人努力确认一段正在被世界遗忘的联系。黄昏时刻拍得很美。"]],
  [496243,["空间调度把阶层关系说得比台词更直接：楼梯、地下室和窗外的风景一直在决定人物的位置。","前半段的喜剧节奏和后半段的失控衔接得很自然，雨夜之后两个家庭看到的是完全不同的世界。"]],
  [550,["它对消费主义的批判未必面面俱到，但影像、剪辑和旁白形成的攻击性直到今天仍然有效。"]],
  [680,["非线性结构不是炫技，每一次重新排列都在改变观众对人物的判断。餐厅开场和结尾的闭环很漂亮。"]],
  [120467,["色彩和构图精致得像一本会移动的画册，但人物的失落感没有被美术吞掉。古斯塔夫很可爱，也很悲伤。"]],
  [497,["奇迹并没有冲淡残酷，反而让制度性的冷漠显得更难接受。演员群像把很长的篇幅撑得很稳。"]],
  [122,["作为三部曲终章，它几乎把所有情绪都推到了最高点。真正打动我的仍是山姆陪弗罗多走完最后一段路。"]],
  [603,["动作设计和哲学概念结合得异常顺滑。多年后重看，红蓝药丸之外，最精彩的仍是对现实感的持续追问。"]],
  [807,["阴雨城市和逼仄室内共同形成令人窒息的道德迷宫。结尾没有提供胜利，只留下代价。"]],
  [637,["父亲用游戏保护孩子的设定充满争议，但影片最有力量的地方，是让笑容和恐惧始终同时存在。"]],
  [1396,["人物变化建立在一连串看似合理的小选择上，等回头时才发现已经走得太远。剧本对因果关系的控制非常强。","索尔、杰西和老白都不是功能角色，每个人都有自己的欲望和盲点，这让冲突一直保持可信。"]],
  [1399,["世界观的规模很大，但早期真正吸引人的是不同家族在信息不对称下做出的选择。群像叙事很扎实。"]],
  [60625,["疯狂设定背后经常藏着很具体的孤独感。它能在二十分钟里从荒诞笑话转向存在主义，又不显得生硬。"]],
  [66732,["复古类型片元素很多，但核心始终是孩子们之间的友谊。第一季对未知感的控制尤其出色。"]]
]);
function hash(value){return createHash("sha256").update(String(value)).digest("hex")}
function unit(value){return Number.parseInt(hash(value).slice(0,8),16)/0xffffffff}
function integer(value,min,max){return min+Math.floor(unit(value)*(max-min+1))}
function dateDaysAgo(value,min,max){const d=new Date();d.setUTCDate(d.getUTCDate()-integer(value,min,max));d.setUTCHours(integer(value+":h",0,23),integer(value+":m",0,59),integer(value+":s",0,59),0);return d}
function between(value,start,end){const a=start.getTime(),b=end.getTime();return new Date(a+Math.floor(unit(value)*(Math.max(1,b-a))))}
async function tmdb(type,id){const url=new URL(
  "https://api.themoviedb.org/3/"+type+"/"+id);url.searchParams.set("language","zh-CN");url.searchParams.set("append_to_response","external_ids");const r=await fetch(url,{headers:{Authorization:"Bearer "+token,Accept:"application/json"},signal:AbortSignal.timeout(30000)});if(!r.ok)throw new Error("TMDB请求失败 "+r.status+" "+type+"/"+id);return r.json()}
const media=[];for(const [type,id] of mediaSeeds){const d=await tmdb(type,id);media.push({type,id,title:titleOverrides.get(id)||d.title||d.name||d.original_title||d.original_name,poster:d.poster_path?"https://image.tmdb.org/t/p/w500"+d.poster_path:null,year:Number(String(d.release_date||d.first_air_date||"").slice(0,4))||null,genres:(d.genres||[]).map(x=>x.name),language:d.original_language||null,country:d.origin_country?.[0]||d.production_countries?.[0]?.iso_3166_1||null,imdb:d.external_ids?.imdb_id||d.imdb_id||null})}
if(media.some(x=>!/[^\x00-\x7F]/u.test(x.title)))console.warn("部分影视没有中文标题，将保留TMDB返回的正式标题。")
const db=await getDatabase();const passwordHash=await hashPassword(randomBytes(48).toString("base64url"));
try{await db.query("START TRANSACTION");await db.query("DELETE FROM users WHERE username LIKE 'demo\\_user\\_%' OR bio LIKE '[运营模拟数据]%'");
let entries=0,events=0,comments=0;const usedComments=new Set();
for(let i=0;i<handles.length;i++){const display=handles[i],username=display;const registered=dateDaysAgo(username,30,420);const lastLogin=between(username+":login",registered,new Date());const status=unit(username+":status")<0.04?"suspended":"active";const visibility=unit(username+":privacy")<0.12?"private":"public";const user=await db.query("INSERT INTO users(username,email,password_hash,role,status,display_name,bio,profile_visibility,last_login_at,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)",[username,username+"@example.invalid",passwordHash,"user",status,display,"[运营模拟数据] 用于展示网站运行后的用户互动、评分与内容分布。",visibility,lastLogin,registered]);const uid=user.result.insertId;const activity=unit(username+":activity");const count=activity<0.2?integer(username+":count",1,3):activity<0.85?integer(username+":count",4,10):integer(username+":count",11,20);const ranked=[...media].sort((a,b)=>unit(username+":"+a.id)-unit(username+":"+b.id));
for(const m of ranked.slice(0,count)){const interaction=between(username+":"+m.id+":time",registered,lastLogin);const statusRoll=unit(username+":"+m.id+":watch");const watch=statusRoll<0.22?"want":statusRoll<0.30&&m.type==="tv"?"watching":"watched";const favorite=watch==="watched"&&unit(username+":"+m.id+":fav")<0.26;const rawRating=5.5+unit(username+":"+m.id+":rating")*4.5;const rating=watch==="watched"?Math.min(10,Math.max(0.5,Math.round(rawRating*2)/2)):null;let review=null;const pool=reviews.get(m.id)||[];if(watch==="watched"&&pool.length&&unit(username+":"+m.id+":review")<0.16){const candidate=pool[integer(username+":"+m.id+":pick",0,pool.length-1)];if(!usedComments.has(candidate)){review=candidate;usedComments.add(candidate);comments++}}
await db.query("INSERT INTO user_media_entries(user_id,media_type,tmdb_id,imdb_id,title,poster_url,release_year,genres_json,original_language,origin_country,watch_status,is_favorite,rating,review_text,contains_spoiler,review_status,watched_at,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",[uid,m.type,m.id,m.imdb,m.title,m.poster,m.year,JSON.stringify(m.genres),m.language,m.country,watch,favorite,rating,review,false,"published",watch==="watched"?interaction:null,interaction,interaction]);entries++;
const eventTypes=["status"];if(favorite)eventTypes.push("favorite");if(rating)eventTypes.push("rating");if(review)eventTypes.push("review");for(let e=0;e<eventTypes.length;e++){const eventAt=new Date(Math.min(interaction.getTime()+e*86400000,lastLogin.getTime()));await db.query("INSERT INTO user_media_events(user_id,media_type,tmdb_id,event_type,watch_status,is_favorite,rating,has_review,created_at) VALUES(?,?,?,?,?,?,?,?,?)",[uid,m.type,m.id,eventTypes[e],watch,favorite,rating,Boolean(review),eventAt]);events++}
if(unit(username+":"+m.id+":browse")<0.75)await db.query("INSERT INTO user_browse_history(user_id,media_type,source_id,title,image_url,viewed_at) VALUES(?,?,?,?,?,?)",[uid,m.type,String(m.id),m.title,m.poster,new Date(Math.max(registered.getTime(),interaction.getTime()-integer(username+":"+m.id+":before",1,72)*3600000))]);}
const searches=integer(username+":searches",0,Math.min(8,count));for(let s=0;s<searches;s++){const m=ranked[s%ranked.length];await db.query("INSERT INTO user_search_history(user_id,query_text,search_type,searched_at) VALUES(?,?,?,?)",[uid,s%3===0?(m.genres[0]||m.title):m.title,s%4===0?m.type:"multi",between(username+":search:"+s,registered,lastLogin)])}}
await db.query("COMMIT");console.log(JSON.stringify({users:handles.length,media:media.length,entries,events,comments},null,2))}catch(e){await db.query("ROLLBACK").catch(()=>{});throw e}finally{await db.close()}
