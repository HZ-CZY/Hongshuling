(() => {
  const items=[
    ['黑脸琵鹭','候鸟','black-faced-spoonbill.jpg'],['大白鹭','候鸟','great-egret.jpg'],['红嘴鸥','候鸟','black-headed-gull.jpg'],['普通翠鸟','候鸟','common-kingfisher.jpg'],['白腰杓鹬','候鸟','far-eastern-curlew.jpg'],['苍鹭','候鸟','grey-heron.jpg'],['红颈滨鹬','候鸟','red-necked-stint.jpg'],
    ['秋茄','植物','kandelia.jpg'],['白骨壤','植物','avicennia.jpg'],['互花米草','植物','smooth-cordgrass.jpg'],
    ['鲎','潮间带','horseshoe-crab.jpg'],['弹涂鱼','潮间带','mudskipper.jpg'],['招潮蟹','潮间带','fiddler-crab.jpg'],
    ['小白鹭','候鸟','little-egret.jpg','little-egret'],['黑翅长脚鹬','候鸟','black-winged-stilt.jpg','black-winged-stilt'],['反嘴鹬','候鸟','pied-avocet.jpg','pied-avocet'],['普通鸬鹚','候鸟','great-cormorant.jpg','great-cormorant'],['青脚鹬','候鸟','common-greenshank.jpg','common-greenshank'],['红脚鹬','候鸟','common-redshank.jpg','common-redshank']
  ];
  let filter='全部',query='';
  const root=document.createElement('div');root.id='species-library';root.innerHTML=`<button class="library-toggle" aria-expanded="false"><span>🪶</span><b>物种图鉴</b><small>19</small></button><section class="library-drawer" aria-hidden="true"><header><div><span class="ui-kicker">SHENZHEN BAY FIELD GUIDE</span><h2>深圳湾物种图鉴</h2></div><button class="library-close" aria-label="关闭物种图鉴">×</button></header><div class="library-tools"><label>⌕<input type="search" placeholder="搜索物种名称…" aria-label="搜索物种"></label><div class="library-filters">${['全部','候鸟','植物','潮间带'].map((x,i)=>`<button data-filter="${x}" class="${i?'':'active'}">${x}</button>`).join('')}</div></div><div class="library-grid"></div><footer>点击物种查看真实照片、习性与保护知识</footer></section>`;document.body.appendChild(root);
  const drawer=root.querySelector('.library-drawer'),grid=root.querySelector('.library-grid'),toggle=root.querySelector('.library-toggle');
  function render(){const visible=items.filter(x=>(filter==='全部'||x[1]===filter)&&x[0].includes(query));grid.innerHTML=visible.length?visible.map(x=>`<button class="library-card" data-name="${x[0]}" ${x[3]?`data-extra="${x[3]}"`:''}><img src="/birds/assets/species/${x[2]}" alt=""><span><b>${x[0]}</b><small>${x[1]}</small></span><i>›</i></button>`).join(''):'<div class="library-empty">没有找到匹配的物种</div>'}
  function open(){drawer.classList.add('open');drawer.setAttribute('aria-hidden','false');toggle.setAttribute('aria-expanded','true');root.querySelector('input').focus()}
  function close(){drawer.classList.remove('open');drawer.setAttribute('aria-hidden','true');toggle.setAttribute('aria-expanded','false')}
  toggle.addEventListener('click',()=>drawer.classList.contains('open')?close():open());root.querySelector('.library-close').addEventListener('click',close);
  root.querySelector('input').addEventListener('input',e=>{query=e.target.value.trim();render()});
  root.querySelector('.library-filters').addEventListener('click',e=>{const button=e.target.closest('[data-filter]');if(!button)return;filter=button.dataset.filter;root.querySelectorAll('[data-filter]').forEach(x=>x.classList.toggle('active',x===button));render()});
  grid.addEventListener('click',e=>{const card=e.target.closest('.library-card');if(!card)return;close();const target=card.dataset.extra?document.querySelector(`[data-extra-species="${card.dataset.extra}"]`):document.querySelector(`.bottom-strip [title="${card.dataset.name}"]`);target?.click()});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&drawer.classList.contains('open'))close()});
  render();
})();
