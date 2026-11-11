import './style.css';
import './about.css';
import {installNavigationDock} from './navigation-dock.js';

const stacks=[
 ['Languages',[
  ['Python','python','#3776ab'],['Java','openjdk','#e76f34'],['C++','cplusplus','#659ad2'],['JavaScript','javascript','#e5bc26'],['TypeScript','typescript','#3178c6'],['SQL','postgresql','#739fc5'],['Swift','swift','#f47736'],
 ]],
 ['Backend & data',[
  ['Spring Boot','springboot','#6db33f'],['FastAPI','fastapi','#00a28b'],['SvelteKit','svelte','#ff633a'],['PostgreSQL','postgresql','#739fc5'],['MongoDB','mongodb','#47a248'],['SQLite','sqlite','#63a9ce'],['RESTful APIs',null,null,'API'],['JUnit','junit5','#45ab74'],
 ]],
 ['AI & machine learning',[
  ['LangChain','langchain','#69b3a3'],['LangGraph','langgraph','#69b3a3'],['ChromaDB',null,null,'Ch'],['PGVector',null,null,'PG'],['OpenAI APIs',null,null,'AI'],['Gemini API','googlegemini','#8e83ef'],['RAG',null,null,'R'],['QLoRA',null,null,'Q'],['Vision Transformers',null,null,'ViT'],['Active Learning',null,null,'AL'],
 ]],
 ['Cloud, DevOps & testing',[
  ['AWS',null,'#ec9b43','aws'],['Docker','docker','#2496ed'],['Kubernetes','kubernetes','#5789f4'],['Jenkins','jenkins','#d86757'],['Terraform','terraform','#9275ef'],['Harness CI',null,null,'H'],['CI/CD',null,null,'CI'],
 ]],
];
const grid=document.querySelector('#stack-grid');
const methodNames=new Set(['RAG','QLoRA','Vision Transformers','Active Learning']);
const aiGroup=stacks.find(g=>g[0]==='AI & machine learning');
stacks.splice(3,0,['AI methods',aiGroup[1].filter(e=>methodNames.has(e[0]))]);
aiGroup[1]=aiGroup[1].filter(e=>!methodNames.has(e[0]));
const methodIcons={
 RAG:'<path d="M4 3h10v13H4zM7 7h4M7 11h3"/><circle cx="17" cy="15" r="4"/><path d="m20 18 3 3"/>',
 QLoRA:'<path d="M3 6h18M3 12h18M3 18h18"/><circle cx="8" cy="6" r="2"/><circle cx="16" cy="12" r="2"/><circle cx="10" cy="18" r="2"/>',
 'Vision Transformers':'<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/>',
 'Active Learning':'<circle cx="12" cy="6" r="3"/><circle cx="5" cy="18" r="3"/><circle cx="19" cy="18" r="3"/><path d="m10 9-3 6m7-6 3 6M8 18h8"/>',
 'CI/CD':'<path d="M8 8a5 5 0 1 0 0 8l8-8a5 5 0 1 1 0 8z"/>',
};
const extraImages={'OpenAI APIs':'openai.png','Harness CI':'harness.png'};
const extraBrands={'ChromaDB':['chroma','#f49a71'],'PGVector':['postgresql','#739fc5']};
function decorateMark(mark,name,slug,color){
 if(extraImages[name]){const image=document.createElement('img');image.src=`${import.meta.env.BASE_URL}stack/${extraImages[name]}`;image.alt='';mark.append(image);}
 else if(slug||extraBrands[name]){const [brand,tint]=extraBrands[name]??[slug,color];mark.classList.add('brand-mark');mark.style.setProperty('--brand-url',`url("${import.meta.env.BASE_URL}stack/${brand}.svg")`);mark.style.backgroundColor=tint??'var(--muted)';}
 else mark.innerHTML=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${methodIcons[name]??'<rect x="3" y="4" width="18" height="16" rx="3"/><path d="m9 9-3 3 3 3m6-6 3 3-3 3"/>'}</svg>`;
}
for(const [category,entries]of stacks){
 const group=document.createElement('section'),title=document.createElement('h3'),list=document.createElement('ul');title.textContent=category;group.append(title,list);
 for(const [name,slug,color,abbreviation]of entries){
  const li=document.createElement('li'),mark=document.createElement('span'),label=document.createElement('span');mark.className='stack-mark';mark.setAttribute('aria-hidden','true');
  decorateMark(mark,name,slug,color);
  label.textContent=name;li.append(mark,label);list.append(li);
 }
 if(category.startsWith('Cloud')){const note=document.createElement('p');note.className='stack-note';note.textContent='AWS: Lambda, S3, EC2, Athena, Redshift, ECS · EKS & SQS in internship work';group.append(note);}
 grid?.append(group);
}
const themeButton=document.querySelector('#theme-toggle');
function setTheme(light){document.body.classList.toggle('light-profile',light);document.body.classList.toggle('night',!light);themeButton.textContent=light?'☾':'☼';themeButton.setAttribute('aria-label',`Switch to ${light?'dark':'light'} theme`);}
let light=false;try{light=localStorage.getItem('profile-theme')==='light';}catch{}setTheme(light);
themeButton.addEventListener('click',()=>{light=!light;setTheme(light);try{localStorage.setItem('profile-theme',light?'light':'dark');}catch{}});
const dialog=document.querySelector('#profile-placeholder');dialog.querySelector('.close').addEventListener('click',()=>dialog.close());
installNavigationDock({open(entry){
 if(entry.href&&entry.status!=='coming-soon'){location.assign(new URL(entry.href,location.href).href);return;}
 dialog.querySelector('h2').textContent=entry.label;dialog.showModal();
}});

import {installProjectCarousel} from './project-carousel.js';
installProjectCarousel();
