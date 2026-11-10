// 城市入口唯一配置源。填写 href 后，招牌将打开真实页面。
// id / buildingId 保持稳定；修改 label 不会改变模型结构。
const contentEntries = [
  {id:'about',buildingId:'tower',label:'About Me',description:'个人介绍与成长经历。内容将在后续加入。',status:'placeholder',href:'',color:'#183b59',position:[0,15.08,-1.13],rotation:.22,size:[4.1,1.43],mountBase:14,design:{shape:'rounded',mount:'fascia',font:'City Lilita',weight:400,fill:'#fff0cf',hoverFill:'#ffe3b0',text:'#183b59',rim:'#d47c62',thickness:.28,icon:'cup',motion:'fixed'}},
  {id:'cv',buildingId:'library',label:'CV',description:'简明履历与简历下载。资料尚未添加。',status:'placeholder',href:'',color:'#214c70',position:[1.0,3.90,9.06],rotation:.70,size:[1.35,2.75],mountBase:2.53,design:{shape:'tag',mount:'blade',font:'City Bungee',weight:400,fill:'#214c70',hoverFill:'#2b5d85',text:'#fff9e7',rim:'#edc86b',thickness:.25,motion:'fixed'}},
  {id:'projects',buildingId:'office',label:'Projects',description:'项目和作品展示。内容将在后续加入。',status:'placeholder',href:'',color:'#183b59',position:[-7.5,14.65,-.95],rotation:.25,size:[4.75,1.65],mountBase:13.34,design:{shape:'billboard',mount:'a-frame',font:'City Bungee',weight:400,fill:'#f0ce68',hoverFill:'#ffe198',text:'#183b59',rim:'#d47c62',thickness:.32,motion:'fixed'}},
  {id:'memo',buildingId:'cafe',label:'Memo',description:'个人记忆、照片、旅行与生活片段。内容将在后续加入。',status:'placeholder',href:'',color:'#b34d39',position:[-6.8,3.84,8.95],rotation:.3,size:[2.55,2.05],mountBase:2.52,design:{shape:'oval',mount:'hanging',font:'City Lilita',weight:400,fill:'#b34d39',hoverFill:'#a54534',text:'#fff5d7',rim:'#314c46',thickness:.24,motion:'hanging',doubleSided:true}},
  {id:'contact',buildingId:'restaurant',label:'Contact Me',description:'邮箱与社交链接。联系方式尚未添加。',status:'placeholder',href:'',color:'#285644',position:[8,10.8,-.9],rotation:.28,size:[3.45,1.66],mountBase:9.28,design:{shape:'arch',mount:'canopy',font:'City Fredoka',weight:700,fill:'#285644',hoverFill:'#356e57',text:'#fff0bb',rim:'#eddb9d',thickness:.27,icon:'envelope',motion:'fixed'}},
  {id:'notes',buildingId:'bakery',label:'Notes',description:'Coming Soon · 未来用于短文、学习记录和随想。',status:'coming-soon',href:'',color:'#244e3c',position:[-10.45,4.05,5.32],rotation:.4,size:[1.4,3.05],mountBase:2.53,design:{shape:'bookmark',mount:'bracket',font:'City Bungee',weight:400,fill:'#9ed3b5',hoverFill:'#b7e1c8',text:'#244e3c',rim:'#fff0cf',thickness:.23,motion:'fixed'}},
];

// 建筑观察位置、点击范围和内容关系集中维护；不会改变建筑模型。
export const locations = [
 {id:'tower',label:'Terrace House',regionId:'central',href:'',interaction:'focus',center:[0,8,-2],size:[8,16,7],camera:{target:[0,8,-2],offset:[35,25,43],zoom:1.85}},
 {id:'office',label:'Blue Studio',regionId:'west',href:'',interaction:'focus',center:[-7.5,6.8,-3.5],size:[4.3,13,4.4],camera:{target:[-7.5,7,-3],offset:[29,23,47],zoom:2}},
 {id:'restaurant',label:'Sunny Table',regionId:'east',href:'',interaction:'focus',center:[8,4.7,-3.6],size:[4.8,9,4.6],camera:{target:[8,5,-3.5],offset:[31,24,45],zoom:2.15}},
 {id:'pavilion',label:'Garden Terrace',regionId:'central',href:'',interaction:'focus',center:[3.3,3,4.1],size:[6.6,6,4.5],camera:{target:[3.3,3.4,4.1],offset:[34,26,44],zoom:2.2}},
 {id:'cafe',label:'Corner Café',regionId:'front',href:'',interaction:'focus',center:[-6.8,1.5,7.3],size:[4,2.8,2.8],camera:{target:[-6.8,1.7,7.6],offset:[24,28,50],zoom:2.4}},
 {id:'library',label:'Little Bookshop',regionId:'front',href:'',interaction:'focus',center:[.2,1.5,7.8],size:[3.3,2.8,2.8],camera:{target:[.2,1.7,8],offset:[27,27,48],zoom:2.4}},
 {id:'bakery',label:'Little Bakery',regionId:'west',href:'',interaction:'focus',center:[-10,1.5,3.7],size:[3,2.8,2.8],camera:{target:[-10,1.6,3.7],offset:[29,25,47],zoom:2.4}},
 {id:'ferris',label:'Ferris Wheel',regionId:'playground',href:'',interaction:'focus',center:[-10.1,8,-6.7],size:[9.4,16,2.6],camera:{target:[-10.1,9,-6.7],offset:[22,24,52],zoom:1.9}},
 {id:'carousel',label:'Carousel',regionId:'playground',href:'',interaction:'focus',center:[-8,2.3,1.6],size:[4.2,4.4,4.2],camera:{target:[-8,2,1.6],offset:[30,30,46],zoom:2.4}},
];

export const destinations=contentEntries.map(entry=>({
 ...entry,
 regionId:locations.find(place=>place.id===entry.buildingId).regionId,
 interaction:'content',
 camera:locations.find(place=>place.id===entry.buildingId).camera,
}));








