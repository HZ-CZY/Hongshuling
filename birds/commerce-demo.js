(() => {
  const products=[
    {id:'badge',emoji:'🏅',name:'守护候鸟电子徽章',desc:'黑脸琵鹭限定数字徽章',price:6,tag:'热门'},
    {id:'cards',emoji:'🃏',name:'深圳湾候鸟科普卡牌',desc:'12种代表物种电子卡组',price:12,tag:'亲子推荐'},
    {id:'wallpaper',emoji:'🌅',name:'红树林治愈壁纸包',desc:'手机与电脑高清壁纸 8 张',price:9,tag:'新品'},
    {id:'guide',emoji:'📖',name:'深圳湾观鸟电子手册',desc:'观鸟季节、地点与礼仪指南',price:15,tag:'实用'},
    {id:'sticker',emoji:'🕊️',name:'候鸟聊天贴纸包',desc:'16枚原创透明背景贴纸',price:8,tag:'可爱'},
    {id:'support',emoji:'🌱',name:'红树林守护支持证书',desc:'生成专属电子支持证书',price:19,tag:'公益纪念'}
  ];
  let cart=JSON.parse(localStorage.getItem('birdDemoCart')||'{}');
  const money=n=>`¥${n.toFixed(2)}`;
  const save=()=>localStorage.setItem('birdDemoCart',JSON.stringify(cart));
  const count=()=>Object.values(cart).reduce((sum,n)=>sum+n,0);
  const total=()=>products.reduce((sum,p)=>sum+p.price*(cart[p.id]||0),0);
  const itemRows=()=>products.filter(p=>cart[p.id]).map(p=>`<div class="eco-cart-item"><span class="eco-cart-emoji">${p.emoji}</span><div><strong>${p.name}</strong><small>${money(p.price)}</small></div><div class="eco-stepper"><button data-action="minus" data-id="${p.id}">−</button><span>${cart[p.id]}</span><button data-action="plus" data-id="${p.id}">＋</button></div></div>`).join('');
  function shell(){let root=document.getElementById('eco-commerce-root');if(!root){root=document.createElement('div');root.id='eco-commerce-root';document.body.appendChild(root)}return root}
  function renderShop(){shell().innerHTML=`<div class="eco-backdrop" data-action="close"></div><section class="eco-shop"><header><div><span class="eco-eyebrow">MANGROVE ECO STORE</span><h2>红树候鸟科普商店</h2><p>购买数字周边，延续每一次自然探索</p></div><div class="eco-header-actions"><button class="eco-cart-button" data-action="cart">🛒 <span>${count()}</span></button><button class="eco-close" data-action="close">×</button></div></header><div class="eco-product-grid">${products.map(p=>`<article class="eco-product"><span class="eco-tag">${p.tag}</span><div class="eco-product-art">${p.emoji}</div><h3>${p.name}</h3><p>${p.desc}</p><footer><strong>${money(p.price)}</strong><button data-action="add" data-id="${p.id}">加入购物车</button></footer></article>`).join('')}</div><div class="eco-shop-note">本商店为科创营 MVP 演示，不产生真实交易或扣款。</div></section>`}
  function renderCart(){shell().innerHTML=`<div class="eco-backdrop" data-action="shop"></div><section class="eco-cart"><header><div><span class="eco-eyebrow">YOUR SELECTION</span><h2>我的购物车</h2></div><button class="eco-close" data-action="shop">×</button></header><div class="eco-cart-list">${count()?itemRows():'<div class="eco-empty">🪶<h3>购物车还是空的</h3><p>挑选一份喜欢的数字周边吧</p><button data-action="shop">去逛逛</button></div>'}</div>${count()?`<footer class="eco-cart-footer"><div><span>共 ${count()} 件</span><strong>合计 ${money(total())}</strong></div><button class="eco-primary" data-action="checkout">去结算</button></footer>`:''}</section>`}
  function renderCheckout(){shell().innerHTML=`<div class="eco-backdrop" data-action="cart"></div><section class="eco-checkout"><header><div><span class="eco-eyebrow">DEMO CHECKOUT</span><h2>确认模拟订单</h2></div><button class="eco-close" data-action="cart">×</button></header><div class="eco-order-summary">${products.filter(p=>cart[p.id]).map(p=>`<div><span>${p.emoji} ${p.name} × ${cart[p.id]}</span><strong>${money(p.price*cart[p.id])}</strong></div>`).join('')}</div><div class="eco-pay-title">选择演示支付方式</div><label class="eco-pay-option"><input type="radio" name="demo-pay" checked><span>💬 微信支付（模拟）</span><b>推荐</b></label><label class="eco-pay-option"><input type="radio" name="demo-pay"><span>🐧 QQ钱包（模拟）</span></label><div class="eco-safety">🔒 不会收集付款信息，也不会产生真实扣款</div><footer class="eco-cart-footer"><div><span>应付金额</span><strong>${money(total())}</strong></div><button class="eco-primary" data-action="pay">确认模拟支付</button></footer></section>`}
  function renderSuccess(){const order=`MG${Date.now().toString().slice(-8)}`;cart={};save();shell().innerHTML=`<div class="eco-backdrop"></div><section class="eco-success"><div class="eco-success-icon">✓</div><span class="eco-eyebrow">DEMO PAYMENT SUCCESS</span><h2>模拟购买成功</h2><p>感谢你支持红树林与候鸟科普行动！</p><div class="eco-order-number">演示订单号：${order}</div><div class="eco-gift">🎁 数字周边将在正式版本中开放下载</div><button class="eco-primary" data-action="close">完成</button></section>`}
  document.addEventListener('click',event=>{
    const marker=event.target.closest('.custom-species-marker');
    if(marker){setTimeout(()=>document.querySelector('.info-window-btn')?.click(),80);return}
    const shopNav=event.target.closest('[title="商城"]');
    if(shopNav){event.preventDefault();event.stopImmediatePropagation();renderShop();return}
    const button=event.target.closest('#eco-commerce-root [data-action]');if(!button)return;const action=button.dataset.action,id=button.dataset.id;
    if(action==='close'){shell().innerHTML=''}
    if(action==='shop')renderShop();
    if(action==='cart')renderCart();
    if(action==='add'){cart[id]=(cart[id]||0)+1;save();renderShop();}
    if(action==='plus'){cart[id]=(cart[id]||0)+1;save();renderCart();}
    if(action==='minus'){cart[id]--;if(cart[id]<=0)delete cart[id];save();renderCart();}
    if(action==='checkout')renderCheckout();
    if(action==='pay'){button.disabled=true;button.textContent='模拟支付处理中…';setTimeout(renderSuccess,900)}
  },true);
})();
