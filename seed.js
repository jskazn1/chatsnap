const admin=require('firebase-admin');
admin.initializeApp({projectId:'jordansk-chatter202020'});
const db=admin.firestore(),TS=admin.firestore.Timestamp,now=Date.now();
const ago=h=>TS.fromMillis(now-h*3600000);
const av=s=>`https://api.dicebear.com/7.x/thumbs/svg?seed=${s}`;
const NAMES=['Alex Rivera','Jordan Chen','Maya Singh','Carlos Mendez','Priya Patel','Sam Kim','Taylor Walsh','Morgan Davis','Riley Cooper','Jamie Lee','Casey Brown','Alex Zhang','Nia Williams','Marcus Thompson','Sofia Rodriguez','Ethan Park','Luna Torres','Kai Johnson','Zoe Martinez','Liam Wilson','Aisha Hassan','Noah Campbell','Elena Petrov','Diego Flores','Mia Nakamura'];
const SEEDS=['alex','jordan','maya','carlos','priya','samkim','taylor','morgan','riley','jamie','casey','alexz','nia','marcus','sofia','ethan','luna','kai','zoe','liam','aisha','noah','elena','diego','mia'];
const USERS=NAMES.map((n,i)=>({uid:`fu${String(i+1).padStart(2,'0')}`,displayName:n,email:`${SEEDS[i]}@mail.com`,photoURL:av(SEEDS[i])}));
const u=id=>USERS.find(x=>x.uid===id);
const m=(uid,text,h,rx={})=>({uid,text,displayName:u(uid).displayName,photoURL:u(uid).photoURL,createdAt:ago(h),reactions:rx});
const ROOM_MSGS={
home:[
m('fu01','Hey everyone! Happy to be here on Orbit!',72,{'👋':['fu02','fu03','fu04']}),
m('fu02','Welcome! This app looks really clean',71,{'🔥':['fu01','fu05']}),
m('fu03','Just joined, loving the dark theme',70),
m('fu04','Same! The violet accent is a nice touch',69,{'💜':['fu01','fu02','fu03']}),
m('fu05','Does anyone know if there are more rooms?',68),
m('fu06','Check the room directory in the sidebar',68,{'👍':['fu05']}),
m('fu07','I just created a gaming room, come join!',67),
m('fu08','This is way smoother than Discord tbh',66,{'🔥':['fu01','fu09','fu10']}),
m('fu09','The voice message feature is so good',65),
m('fu10','Agreed, recorded one and it sounded great',64),
m('fu11','Anyone else using this on mobile?',48),
m('fu12','Yeah mobile works really well',47,{'👍':['fu11']}),
m('fu13','The GIF picker is my favorite feature lol',46),
m('fu14','haha same, already sent way too many',45,{'😂':['fu13','fu15']}),
m('fu15','Good morning everyone!',24,{'☀️':['fu16','fu17','fu18']}),
m('fu16','Morning! What is everyone up to today?',23),
m('fu17','Working on a project, taking breaks here',22),
m('fu18','Orbit is my procrastination app now',21,{'😂':['fu15','fu16','fu19']}),
m('fu19','No shame in that honestly',20),
m('fu20','Has anyone tried the link preview? Pretty useful',5,{'👍':['fu21','fu22']}),
m('fu21','Just tried it, works great with YouTube links',4),
m('fu22','Shared an article earlier and it looked clean',3),
],
general:[
m('fu03','What do people use this for, work or personal?',60,{'🤔':['fu04','fu05']}),
m('fu04','Mix of both for me, mostly personal rn',59),
m('fu05','Our team switched to Orbit for project chats',58,{'🔥':['fu06','fu07']}),
m('fu06','Oh nice, how many people on your team?',57),
m('fu05','About 8 of us, works great so far',57),
m('fu07','We should get more rooms going for different topics',50),
m('fu08','Yes! A dev room would be cool',49,{'👍':['fu09','fu10','fu11']}),
m('fu09','And maybe a music room?',48),
m('fu10','Ooh a music room would be great',48,{'🎵':['fu09','fu11','fu12']}),
m('fu11','You can react with any emoji, not just presets',36,{'🤩':['fu12','fu13']}),
m('fu12','Wait really? How do you access it?',35),
m('fu11','Hover over a message and click the emoji button',35),
m('fu13','Mind blown, did not know that',34,{'🤯':['fu14','fu15']}),
m('fu23','Anyone know if there is an iOS app in the works?',12,{'🤔':['fu24','fu25']}),
m('fu24','It works as a PWA on iOS which is pretty good',11),
m('fu25','True, added it to my home screen already',11,{'👍':['fu23']}),
m('fu01','The PWA install is seamless on Android too',10),
m('fu02','Just installed it, feels native',9,{'🔥':['fu01','fu03']}),
],
random:[
m('fu13','Random question: pineapple on pizza, yes or no?',55,{'😂':['fu14','fu15','fu16']}),
m('fu14','Hard no from me lol',55),
m('fu15','Controversial but I like it',54,{'🍍':['fu13']}),
m('fu16','Hawaiian pizza is great and I will not apologize',54,{'😂':['fu13','fu17','fu18']}),
m('fu17','okay this room is already chaotic, love it',53),
m('fu18','Anyone watching anything good lately?',40),
m('fu19','Just finished Severance, absolutely wild',39,{'🔥':['fu20','fu21']}),
m('fu20','Severance is incredible, cannot wait for season 3',39),
m('fu21','no spoilers please I just started it',38,{'😅':['fu19','fu20']}),
m('fu22','What about music? What is everyone listening to?',30),
m('fu23','Been on a massive lo-fi kick lately',29),
m('fu24','Lo-fi is the only way to code',29,{'👍':['fu22','fu23','fu25']}),
m('fu25','Facts, lo-fi + dark mode + Orbit = peak productivity',28,{'🔥':['fu22','fu23','fu24']}),
m('fu01','haha this community is great',27),
m('fu02','Agreed, feels chill here',26,{'💜':['fu01','fu03','fu04']}),
m('fu06','Drop your Spotify playlists below',8,{'🎵':['fu07','fu08']}),
m('fu07','https://open.spotify.com/playlist/37i9dQZF1DX5trt9i14X7j',7),
m('fu08','Nice, adding this now',7,{'👍':['fu06','fu07']}),
]};
const DMS=[
{p:['fu01','fu02'],msgs:[m('fu01','Hey, glad you joined Orbit!',71),m('fu02','Thanks, this is really cool',70),m('fu01','Yeah been using it a while, big fan',70),m('fu02','The DM feature works great',69),m('fu01','Right? Way less cluttered than other apps',68)]},
{p:['fu03','fu05'],msgs:[m('fu03','How is your team finding Orbit so far?',57),m('fu05','Everyone loves it, super smooth',56),m('fu03','Glad to hear it, let me know if you need anything',56),m('fu05','Will do, thanks!',55)]},
{p:['fu07','fu09'],msgs:[m('fu07','Yo did you check out the gaming room I made?',66),m('fu09','Not yet, just joined it actually',65),m('fu07','Nice! Getting a group together later',64),m('fu09','Count me in',64),m('fu07','Bet, talk later',63)]},
{p:['fu15','fu18'],msgs:[m('fu15','That procrastination comment made me laugh',20),m('fu18','haha guilty as charged',19),m('fu15','Same tbh, I have had this open all day',19),m('fu18','It is just too good lol',18)]},
{p:['fu22','fu24'],msgs:[m('fu22','Do you know if there is a way to search messages?',10),m('fu24','Yeah! Click the search icon in the top right',9),m('fu22','Oh nice found it, thanks!',9),m('fu24','No problem!',9)]},
];
async function seed(){
  console.log('Creating users...');
  let b=db.batch();
  USERS.forEach(user=>b.set(db.collection('users').doc(user.uid),{displayName:user.displayName,email:user.email,photoURL:user.photoURL,blockedUsers:[]}));
  await b.commit();
  console.log(`${USERS.length} users created`);
  const snap=await db.collection('rooms').get();
  const rooms={};
  snap.forEach(doc=>{const d=doc.data();const slug=d.slug||(d.name||'').toLowerCase().replace(/\s+/g,'-');rooms[slug]=doc.id;});
  console.log('Rooms found:',Object.keys(rooms));
  for(const[slug,msgs]of Object.entries(ROOM_MSGS)){
    const id=rooms[slug];
    if(!id){console.log(`Room '${slug}' not found`);continue;}
    const uids=[...new Set(msgs.map(x=>x.uid))];
    await db.collection('rooms').doc(id).update({memberCount:admin.firestore.FieldValue.increment(uids.length),members:admin.firestore.FieldValue.arrayUnion(...uids)});
    b=db.batch();
    msgs.forEach(msg=>b.set(db.collection('rooms').doc(id).collection('messages').doc(),msg));
    await b.commit();
    console.log(`#${slug}: ${msgs.length} messages added`);
  }
  for(const dm of DMS){
    const last=dm.msgs[dm.msgs.length-1];
    const ref=db.collection('conversations').doc();
    await ref.set({participants:dm.p,lastMessage:last.text,lastAt:last.createdAt});
    b=db.batch();
    dm.msgs.forEach(msg=>b.set(ref.collection('messages').doc(),msg));
    await b.commit();
    console.log(`DM: ${u(dm.p[0]).displayName} <-> ${u(dm.p[1]).displayName}`);
  }
  const total=Object.values(ROOM_MSGS).reduce((a,v)=>a+v.length,0);
  console.log(`\nDone! ${USERS.length} users, ${total} room msgs, ${DMS.length} DM conversations`);
  process.exit(0);
}
seed().catch(e=>{console.error(e);process.exit(1);});
