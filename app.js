const categories=[
{key:'breakfast',name:'בוקר',description:'להתחיל את היום',emoji:'🍳'},
{key:'lunch',name:'צהריים',description:'ארוחה משביעה',emoji:'🍝'},
{key:'dinner',name:'ערב',description:'לסיים את היום',emoji:'🥗'},
{key:'snack',name:'נשנוש',description:'משהו קטן',emoji:'🍓'},
{key:'surprise',name:'הפתעה',description:'תבחר לי',emoji:'🎲'}];
const meals=[
{id:'M001',name:'טוסט גבינה',category:'breakfast',image:'toast-cheese.jpg',description:'טוסט חם עם גבינה וירקות',emoji:'🥪'},
{id:'M002',name:'חביתה',category:'breakfast',image:'omelette.jpg',description:'חביתה רכה וסלט ליד',emoji:'🍳'},
{id:'M003',name:'קורנפלקס',category:'breakfast',image:'cornflakes.jpg',description:'קערה קלה ומהירה',emoji:'🥣'},
{id:'M004',name:'יוגורט',category:'breakfast',image:'yogurt.jpg',description:'יוגורט עם פרי וגרנולה',emoji:'🫐'},
{id:'M005',name:'שקשוקה',category:'breakfast',image:'shakshuka.jpg',description:'שקשוקה ביתית וחמה',emoji:'🍅'},
{id:'M006',name:'פנקייק',category:'breakfast',image:'pancakes.jpg',description:'פנקייק רך ומתוק',emoji:'🥞'},
{id:'M007',name:"פרנץ' טוסט",category:'breakfast',image:'french-toast.jpg',description:'מתוק וזהוב',emoji:'🍞'},
{id:'M008',name:'סלט',category:'breakfast',image:'salad.jpg',description:'סלט טרי וצבעוני',emoji:'🥗'},
{id:'M009',name:'כריך אבוקדו',category:'breakfast',image:'avocado-toast.jpg',description:'כריך אבוקדו מפנק',emoji:'🥑'}];
let selectedMeal=null;
const ids=['categoriesView','mealsView','choiceView','successView'];
const el=id=>document.getElementById(id);
function showView(id){ids.forEach(v=>el(v).classList.toggle('hidden',v!==id));el('backBtn').classList.toggle('hidden',id==='categoriesView'||id==='successView');window.scrollTo(0,0)}
function makeCard(item,onClick){const n=el('cardTemplate').content.firstElementChild.cloneNode(true);n.querySelector('h3').textContent=item.name;n.querySelector('p').textContent=item.description||'';const img=n.querySelector('img'),fb=n.querySelector('.fallback-emoji');fb.textContent=item.emoji||'🍽️';if(item.image){img.src=`images/meals/${item.image}`;img.onload=()=>fb.classList.add('hidden');img.onerror=()=>img.classList.add('hidden')}else img.classList.add('hidden');n.onclick=onClick;return n}
function renderCategories(){const g=el('categoriesGrid');g.innerHTML='';categories.forEach(c=>g.appendChild(makeCard(c,()=>c.key==='surprise'?openMeal(meals[Math.floor(Math.random()*meals.length)]):renderMeals(c))))}
function renderMeals(c){el('mealsTitle').textContent=c.name;const g=el('mealsGrid');g.innerHTML='';const list=meals.filter(m=>m.category===c.key);list.forEach(m=>g.appendChild(makeCard(m,()=>openMeal(m))));el('surpriseBtn').onclick=()=>list.length&&openMeal(list[Math.floor(Math.random()*list.length)]);showView('mealsView')}
function openMeal(m){selectedMeal=m;el('choiceName').textContent=m.name;el('choiceDescription').textContent=m.description||'';const img=el('choiceImage');img.src=`images/meals/${m.image}`;img.onerror=()=>img.style.display='none';img.onload=()=>img.style.display='block';showView('choiceView')}
el('confirmBtn').onclick=()=>{localStorage.setItem('latestSelection',JSON.stringify({...selectedMeal,selectedAt:new Date().toISOString(),selectedBy:'מעיין'}));el('successText').textContent=`בחרת: ${selectedMeal.name}`;showView('successView')};
el('homeBtn').onclick=()=>showView('categoriesView');el('backBtn').onclick=()=>showView('categoriesView');renderCategories();showView('categoriesView');if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js'));