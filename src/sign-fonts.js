export const signFontFiles=[
 {family:'City Lilita',file:'LilitaOne-Regular.ttf',weight:'400'},
 {family:'City Bungee',file:'Bungee-Regular.ttf',weight:'400'},
 {family:'City Fredoka',file:'Fredoka-Variable.ttf',weight:'300 700'},
];
export async function loadSignFonts(){
 const faces=await Promise.all(signFontFiles.map(async f=>{
  const url=`${import.meta.env.BASE_URL}fonts/${encodeURIComponent(f.file)}`;
  const face=new FontFace(f.family,`url("${url}")`,{weight:f.weight,style:'normal'});
  await face.load();document.fonts.add(face);return face;
 }));
 await document.fonts.ready;
 return faces.map(f=>f.family);
}

