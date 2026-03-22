// --- Icons (change if you prefer images) ---
const shareIcon = "3"; // sharing item character
const groupIcon = "🧴"; // erasers for grouping

// --- Basic DOM refs ---
const btnShare = document.getElementById('btnShare');
const btnGroup = document.getElementById('btnGroup');
const sharingView = document.getElementById('sharingView');
const groupingView = document.getElementById('groupingView');

const shareControls = document.getElementById('shareControls');
const groupControls = document.getElementById('groupControls');

// Sharing elements (queried at runtime where needed)
const perGroupShareEl = document.getElementById('perGroupShare');
const remainderShareEl = document.getElementById('remainderShare');
const shareItemsInput = document.getElementById('shareItems');
const shareGroupsInput = document.getElementById('shareGroups');

// Grouping elements
const groupGrid = document.getElementById('groupGrid');
const groupItemsInput = document.getElementById('groupItems');
const itemsPerGroupInput = document.getElementById('itemsPerGroup');
const completeGroupsBadge = document.getElementById('completeGroups');
const groupingRemainder = document.getElementById('groupingRemainder');
const autoGroupBtn = document.getElementById('autoGroup');
const resetGroupBtn = document.getElementById('resetGroup');
const colorKey = document.getElementById('colorKey');

const resetAllBtn = document.getElementById('resetAll');

// --- State ---
let shareState = { total: parseInt(shareItemsInput.value,10)||0, groups: Math.max(1, parseInt(shareGroupsInput.value,10)||1), items: [] };
let groupState = { total: parseInt(groupItemsInput.value,10)||0, perGroup: Math.max(1, parseInt(itemsPerGroupInput.value,10)||1), selected: [] };

// UID
let uidCounter = 1;
function uid(prefix='i'){ return prefix + (uidCounter++); }

// Activity switching
btnShare.addEventListener('click', ()=>{
btnShare.classList.add('active'); btnShare.setAttribute('aria-pressed','true');
btnGroup.classList.remove('active'); btnGroup.setAttribute('aria-pressed','false');
sharingView.style.display = ''; groupingView.style.display = 'none';
shareControls.style.display = ''; groupControls.style.display = 'none';
});
btnGroup.addEventListener('click', ()=>{
btnGroup.classList.add('active'); btnGroup.setAttribute('aria-pressed','true');
btnShare.classList.remove('active'); btnShare.setAttribute('aria-pressed','false');
sharingView.style.display = 'none'; groupingView.style.display = '';
shareControls.style.display = 'none'; groupControls.style.display = '';
});

// ------- SHARING ACTIVITY -------
function buildSharing(){
const poolEl = document.getElementById('pool');
const groupsRow = document.getElementById('groupsRow');
if(!poolEl || !groupsRow) return;

poolEl.innerHTML = '';
groupsRow.innerHTML = '';
shareState.total = Math.max(0, parseInt(shareItemsInput.value,10) || 0);
shareState.groups = Math.max(1, parseInt(shareGroupsInput.value,10) || 1);
shareState.items = [];

for(let i=0;i<shareState.total;i++){
const id = uid('s');
const it = document.createElement('div');
it.className = 'item';
it.setAttribute('data-id', id);
it.setAttribute('role','button');
it.setAttribute('aria-label','item');
it.innerText = shareIcon;
poolEl.appendChild(it);
shareState.items.push({id, el: it, location: 'pool'});
}

for(let g=0; g<shareState.groups; g++){
const grp = document.createElement('div');
grp.className = 'group';
grp.setAttribute('data-group', g);
grp.setAttribute('tabindex',0);
grp.innerHTML = '<div class="label">Group ' + (g+1) + '</div><div class="contents"></div>';
groupsRow.appendChild(grp);
}

updateSharingStats();
attachSharingDrag();
}

// Pointer-based drag for sharing (works on touch)
function attachSharingDrag(){
let pool = document.getElementById('pool');
const groupsRow = document.getElementById('groupsRow');
if(!pool || !groupsRow) return;

// Replace node safely (preserve children) to reset listeners if needed
if(pool.parentNode){
const newPool = pool.cloneNode(true);
pool.parentNode.replaceChild(newPool, pool);
pool = document.getElementById('pool');
} else {
pool = document.getElementById('pool');
}

let dragging = null, mirror = null, offsetX = 0, offsetY = 0;

function onPointerDown(e){
const target = e.target.closest('.item');
if(!target) return;
e.preventDefault();
try { target.setPointerCapture && target.setPointerCapture(e.pointerId); } catch(e){}
dragging = target;
dragging.classList.add('dragging');
const rect = target.getBoundingClientRect();
offsetX = e.clientX - rect.left;
offsetY = e.clientY - rect.top;

ini
mirror = target.cloneNode(true);
mirror.style.position = 'fixed';
mirror.style.left = (e.clientX - offsetX) + 'px';
mirror.style.top = (e.clientY - offsetY) + 'px';
mirror.style.zIndex = 9999;
mirror.style.pointerEvents = 'none';
mirror.classList.add('dragging');
document.body.appendChild(mirror);

window.addEventListener('pointermove', onPointerMove);
window.addEventListener('pointerup', onPointerUp);

}

function onPointerMove(e){
if(!dragging || !mirror) return;
mirror.style.left = (e.clientX - offsetX) + 'px';
mirror.style.top = (e.clientY - offsetY) + 'px';
const elems = document.elementsFromPoint(e.clientX, e.clientY);
const grp = elems.find(el => el.classList && el.classList.contains('group'));
document.querySelectorAll('.group').forEach(g => g.classList.remove('over'));
if(grp) grp.classList.add('over');
}

function onPointerUp(e){
if(!dragging) return;
dragging.classList.remove('dragging');
if(mirror){ mirror.remove(); mirror = null; }
const elems = document.elementsFromPoint(e.clientX, e.clientY);
const grpEl = elems.find(el => el.classList && el.classList.contains('group'));
const poolHit = elems.find(el => el === pool || (el.closest && el.closest('.items-pool') === pool));
const id = dragging.getAttribute('data-id');
const itemObj = shareState.items.find(it => it.id === id);

scheme
if(grpEl){
  const contents = grpEl.querySelector('.contents');
  contents.appendChild(dragging);
  itemObj.location = 'group:' + grpEl.getAttribute('data-group');
} else if(poolHit){
  pool.appendChild(dragging);
  itemObj.location = 'pool';
} else {
  pool.appendChild(dragging);
  itemObj.location = 'pool';
}

document.querySelectorAll('.group').forEach(g => g.classList.remove('over'));
window.removeEventListener('pointermove', onPointerMove);
window.removeEventListener('pointerup', onPointerUp);
dragging = null;
updateSharingStats();

}

pool.addEventListener('pointerdown', onPointerDown);
groupsRow.addEventListener('pointerdown', onPointerDown);

groupsRow.addEventListener('click', (e)=>{
const it = e.target.closest('.item');
if(!it) return;
pool.appendChild(it);
const id = it.getAttribute('data-id');
const itemObj = shareState.items.find(x=>x.id===id);
if(itemObj) itemObj.location = 'pool';
updateSharingStats();
});
}

function updateSharingStats(){
const counts = new Array(shareState.groups).fill(0);
for(const it of shareState.items){
if(it.location && it.location.startsWith('group:')){
const idx = parseInt(it.location.split(':')[1],10);
if(!isNaN(idx) && idx>=0 && idx<counts.length) counts[idx]++;
} else {
const parent = it.el.parentElement;
if(parent && parent.classList.contains('contents')){
const grp = parent.closest('.group');
if(grp){
const idx = parseInt(grp.getAttribute('data-group'),10);
counts[idx]++;
it.location = 'group:' + idx;
} else {
it.location = 'pool';
}
} else {
it.location = 'pool';
}
}
}
const totalPlaced = counts.reduce((a,b)=>a+b,0);
const inPool = shareState.total - totalPlaced;
const perGroup = Math.floor(shareState.total / shareState.groups);
const remainder = shareState.total % shareState.groups;
perGroupShareEl.innerText = 'Each group (equal share): ' + perGroup;
remainderShareEl.innerText = 'Leftover (equal share): ' + remainder;

document.querySelectorAll('.group').forEach(g=>{
const idx = parseInt(g.getAttribute('data-group'),10);
const label = g.querySelector('.label');
const cnt = counts[idx] || 0;
label.innerText = 'Group ' + (idx+1) + ' — has ' + cnt;
});
}

// ------- GROUPING ACTIVITY -------
// friendly color palette for groups
const groupColors = ['#4DB6AC','#90CAF9','#FFAB91','#CE93D8','#FFF59D','#A5D6A7','#FFCC80','#B39DDB','#81D4FA','#F48FB1'];

function buildGrouping(){
groupGrid.innerHTML = '';
colorKey.innerHTML = '';
groupState.total = Math.max(0, parseInt(groupItemsInput.value,10) || 0);
groupState.perGroup = Math.max(1, parseInt(itemsPerGroupInput.value,10) || 1);
groupState.selected = [];

for(let i=0;i<groupState.total;i++){
const id = uid('g');
const el = document.createElement('div');
el.className = 'grid-item';
el.setAttribute('data-id', id);
el.setAttribute('role','button');
el.setAttribute('aria-pressed','false');
el.innerText = groupIcon;
groupGrid.appendChild(el);
}

for(let i=0;i<10;i++){
const dot = document.createElement('div');
dot.style.display = 'flex';
dot.style.alignItems = 'center';
dot.style.gap = '6px';
dot.style.fontSize = '13px';
const color = groupColors[i % groupColors.length];
const circle = document.createElement('div');
circle.className = 'color-dot';
circle.style.background = color;
const label = document.createElement('div');
label.innerText = (i+1) + (i===0? ' group color':'' ) + '';
dot.appendChild(circle);
dot.appendChild(label);
colorKey.appendChild(dot);
}

updateGroupingStats();
attachGroupingHandlers();
}

function attachGroupingHandlers(){
groupGrid.onclick = (e)=>{
const el = e.target.closest('.grid-item');
if(!el) return;
const id = el.getAttribute('data-id');
const idx = groupState.selected.indexOf(id);
if(idx >= 0){
groupState.selected.splice(idx,1);
el.classList.remove('selected');
el.setAttribute('aria-pressed','false');
} else {
groupState.selected.push(id);
el.classList.add('selected');
el.setAttribute('aria-pressed','true');
}
assignGroupColors();
updateGroupingStats();
};
}

function assignGroupColors(){
const per = groupState.perGroup;
const selectedEls = Array.from(groupGrid.querySelectorAll('.grid-item')).filter(el => groupState.selected.includes(el.getAttribute('data-id')));
Array.from(groupGrid.children).forEach(el=>{
el.classList.remove('grouped');
el.style.background = '';
el.style.color = '';
el.style.border = '';
});

const completeGroups = Math.floor(groupState.selected.length / per);
for(let g=0; g<completeGroups; g++){
const color = groupColors[g % groupColors.length];
for(let i = gper; i < gper + per && i < selectedEls.length; i++){
const el = selectedEls[i];
el.classList.add('grouped');
el.style.background = color;
el.style.color = 'white';
el.style.fontWeight = '700';
el.style.border = '3px solid rgba(255,255,255,0.25)';
if(!el.querySelector('.grp-b')) {
const badge = document.createElement('div');
badge.className = 'grp-b';
badge.style.position = 'absolute';
badge.style.transform = 'translate(12px,-12px)';
badge.style.width = '28px';
badge.style.height = '28px';
badge.style.borderRadius = '50%';
badge.style.display = 'flex';
badge.style.alignItems = 'center';
badge.style.justifyContent = 'center';
badge.style.fontSize = '12px';
badge.style.background = 'rgba(255,255,255,0.22)';
badge.style.color = 'white';
badge.style.fontWeight = '700';
badge.innerText = (g+1);
el.style.position = 'relative';
el.appendChild(badge);
} else {
el.querySelector('.grp-b').innerText = (g+1);
el.querySelector('.grp-b').style.background = 'rgba(255,255,255,0.22)';
el.querySelector('.grp-b').style.color = 'white';
}
}
}

for(let i = completeGroups * per; i < selectedEls.length; i++){
const el = selectedEls[i];
el.classList.remove('grouped');
el.style.background = '';
el.style.color = '';
const b = el.querySelector('.grp-b');
if(b) b.remove();
}
}

function updateGroupingStats(){
const selCount = groupState.selected.length;
const per = groupState.perGroup;
const completeGroups = Math.floor(selCount / per);
const remainder = selCount % per;
completeGroupsBadge.innerText = completeGroups + ' group' + (completeGroups===1 ? '' : 's');
groupingRemainder.innerText = 'Leftover: ' + remainder;
assignGroupColors();
}

function autoGroup(){
groupState.selected = [];
const per = groupState.perGroup;
const maxFull = Math.floor(groupState.total / per);
const toSelect = maxFull * per;
const els = Array.from(groupGrid.querySelectorAll('.grid-item'));
for(let i=0;i<els.length;i++){
const id = els[i].getAttribute('data-id');
if(i < toSelect){
groupState.selected.push(id);
els[i].classList.add('selected');
els[i].setAttribute('aria-pressed','true');
} else {
els[i].classList.remove('selected');
els[i].setAttribute('aria-pressed','false');
}
}
updateGroupingStats();
}

// Reset handlers
resetAllBtn.addEventListener('click', ()=>{
shareItemsInput.value = 10;
shareGroupsInput.value = 3;
groupItemsInput.value = 20;
itemsPerGroupInput.value = 3;
buildSharing();
buildGrouping();
});

resetGroupBtn.addEventListener('click', ()=>{
groupState.selected = [];
buildGrouping();
});

autoGroupBtn.addEventListener('click', autoGroup);

// Rebuild when inputs change
shareItemsInput.addEventListener('change', buildSharing);
shareGroupsInput.addEventListener('change', buildSharing);
groupItemsInput.addEventListener('change', buildGrouping);
itemsPerGroupInput.addEventListener('change', buildGrouping);

// Initial build
buildSharing();
buildGrouping();

// Keyboard accessibility shortcuts
document.addEventListener('keydown', (e)=>{
if(e.key === '1'){ btnShare.click(); }
if(e.key === '2'){ btnGroup.click(); }
});

