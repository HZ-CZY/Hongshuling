(() => {
  const KEY='hongshuling-theme';
  const saved=localStorage.getItem(KEY);
  let theme=saved==='light'?'light':'dark';
  const apply=next=>{
    theme=next;document.documentElement.dataset.theme=theme;localStorage.setItem(KEY,theme);
    const button=document.getElementById('theme-toggle');
    if(button){button.innerHTML=theme==='light'?'<span>🌙</span><b>原模式</b>':'<span>☀️</span><b>明亮</b>';button.setAttribute('aria-label',theme==='light'?'切换到原模式':'切换到明亮模式');button.title=button.getAttribute('aria-label')}
    const map=window.__birdsMap;
    if(map?.setMapStyle) map.setMapStyle(theme==='light'?'amap://styles/normal':'amap://styles/dark');
  };
  document.documentElement.dataset.theme=theme;
  const mount=()=>{
    if(document.getElementById('theme-toggle'))return;
    const button=document.createElement('button');button.id='theme-toggle';button.type='button';button.addEventListener('click',()=>apply(theme==='dark'?'light':'dark'));document.body.appendChild(button);apply(theme);
  };
  new MutationObserver(()=>{mount();if(window.__birdsMap&&!window.__themeMapReady){window.__themeMapReady=true;apply(theme)}}).observe(document.documentElement,{childList:true,subtree:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
