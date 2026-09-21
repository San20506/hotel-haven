document.addEventListener('DOMContentLoaded', () => {

  // 1. Navbar scroll + mobile toggle (spring feel)
  const navbar = document.getElementById('navbar') || document.querySelector('.navbar');
  const menuToggle = document.getElementById('menuToggle') || document.getElementById('navToggle') || document.querySelector('.menu-toggle');
  const navLinks = document.getElementById('navLinks') || document.getElementById('navMenu') || document.querySelector('.nav-menu');

  if (navbar) {
    let ticking=false;
    window.addEventListener('scroll', () => {
      if(!ticking){
        requestAnimationFrame(()=>{
          navbar.classList.toggle('scrolled', window.scrollY > 24);
          ticking=false;
        });
        ticking=true;
      }
    }, {passive:true});
  }
  if (menuToggle && navLinks) {
    const close=()=>{ navLinks.classList.remove('active'); menuToggle.classList.remove('active'); document.body.style.overflow=''; };
    const open=()=>{ navLinks.classList.add('active'); menuToggle.classList.add('active'); document.body.style.overflow='hidden'; };
    menuToggle.addEventListener('click', () => {
      navLinks.classList.contains('active') ? close() : open();
    });
    navLinks.querySelectorAll('a').forEach(a=> a.addEventListener('click', close));
    document.addEventListener('keydown', e=>{ if(e.key==='Escape') close(); });
    document.addEventListener('click', e=>{ if(navLinks.classList.contains('active') && !navLinks.contains(e.target) && !menuToggle.contains(e.target)) close(); });
  }

  // Hero WhatsApp / call
  const heroContactBtn = document.getElementById('heroSecondaryBtn');
  if (heroContactBtn) {
    heroContactBtn.addEventListener('click', (e) => {
      // taste: single primary CTA restraint — keep both but WhatsApp is secondary ghost
      if(heroContactBtn.getAttribute('href')?.startsWith('tel:')) return;
      e.preventDefault();
      window.open('https://wa.me/919434270555?text=Hi%20Hotel%20Haven%2C%20I%20want%20to%20check%20availability','_blank');
    });
  }

  // 2. Products slider - desktop grid, mobile native scroll + dots sync (emil spring)
  const sliderTrack = document.getElementById('sliderTrack');
  const prevSlide = document.getElementById('prevSlide');
  const nextSlide = document.getElementById('nextSlide');
  const sliderDots = document.querySelectorAll('.slider-dot');
  const productCards = document.querySelectorAll('.product-card');
  if (sliderTrack && productCards.length){
    let current=0;
    const isMobile=()=> window.innerWidth <= 768;
    const go=(idx)=>{
      current = (idx + productCards.length) % productCards.length;
      sliderDots.forEach((d,i)=> d.classList.toggle('active', i===current));
      if(isMobile()){
        const card = productCards[current];
        const left = card.offsetLeft - sliderTrack.offsetLeft;
        sliderTrack.scrollTo({left, behavior:'smooth'});
      }
    };
    if(prevSlide) prevSlide.addEventListener('click', ()=> go(current-1));
    if(nextSlide) nextSlide.addEventListener('click', ()=> go(current+1));
    sliderDots.forEach((d,i)=> d.addEventListener('click', ()=> go(i)));
    // sync dots on manual scroll
    let scrollT;
    if(isMobile()) sliderTrack.addEventListener('scroll', ()=>{
      clearTimeout(scrollT);
      scrollT=setTimeout(()=>{
        let best=0, bestDist=Infinity;
        productCards.forEach((c,i)=>{
          const dist=Math.abs(c.offsetLeft - sliderTrack.scrollLeft - sliderTrack.offsetLeft);
          if(dist < bestDist){ bestDist=dist; best=i; }
        });
        current=best;
        sliderDots.forEach((d,i)=> d.classList.toggle('active', i===current));
      }, 80);
    }, {passive:true});
    // keyboard
    sliderTrack.setAttribute('tabindex','0');
    sliderTrack.addEventListener('keydown', e=>{
      if(e.key==='ArrowRight') go(current+1);
      if(e.key==='ArrowLeft') go(current-1);
    });
    window.addEventListener('resize', ()=> go(current));
    // auto-advance on mobile only (4.5s), pause on hover/touch, respect reduced-motion
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let autoTimer=null;
    const startAuto=()=>{
      if(prefersReduced || !isMobile()) return;
      stopAuto();
      autoTimer=setInterval(()=> go(current+1), 4500);
    };
    const stopAuto=()=>{ if(autoTimer){ clearInterval(autoTimer); autoTimer=null; } };
    startAuto();
    sliderTrack.addEventListener('mouseenter', stopAuto);
    sliderTrack.addEventListener('mouseleave', startAuto);
    sliderTrack.addEventListener('touchstart', stopAuto, {passive:true});
    sliderTrack.addEventListener('touchend', ()=> setTimeout(startAuto, 3000), {passive:true});
    sliderTrack.addEventListener('focusin', stopAuto);
    sliderTrack.addEventListener('focusout', startAuto);
    window.addEventListener('resize', ()=> { prefersReduced ? stopAuto() : startAuto(); });
    document.addEventListener('visibilitychange', ()=> document.hidden ? stopAuto() : startAuto());
  }

  // 3. FAQ accordion - allow keyboard + single open
  document.querySelectorAll('.faq-item').forEach(item=>{
    const q=item.querySelector('.faq-question');
    if(!q) return;
    q.setAttribute('tabindex','0');
    q.setAttribute('role','button');
    q.setAttribute('aria-expanded', item.classList.contains('active')?'true':'false');
    const toggle=()=>{
      const wasActive=item.classList.contains('active');
      document.querySelectorAll('.faq-item').forEach(o=>{ o.classList.remove('active'); o.querySelector('.faq-question')?.setAttribute('aria-expanded','false'); });
      if(!wasActive){ item.classList.add('active'); q.setAttribute('aria-expanded','true'); }
    };
    q.addEventListener('click', toggle);
    q.addEventListener('keydown', e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); toggle(); }});
  });

  // 4. Pricing selector (preserve)
  const packageSelect = document.getElementById('packageSelect');
  const priceAmount = document.getElementById('priceAmount');
  const extraMattressGroup = document.getElementById('extraMattressGroup');
  const cartExtraMattress = document.getElementById('cartExtraMattress');
  function updatePricingDisplay(){
    if(!packageSelect || !priceAmount) return;
    const opt=packageSelect.options[packageSelect.selectedIndex];
    const base=parseInt((opt.getAttribute('data-price')||'0').replace(/,/g,''))||0;
    const extra=parseInt((opt.getAttribute('data-extra')||'0').replace(/,/g,''))||0;
    if(extraMattressGroup){
      const show=extra>0;
      extraMattressGroup.style.display= show ? 'block':'none';
      if(!show && cartExtraMattress) cartExtraMattress.checked=false;
    }
    const addon= cartExtraMattress?.checked ? extra:0;
    priceAmount.textContent=(base+addon).toLocaleString('en-IN');
    // micro spring scale
    priceAmount.style.transform='scale(1.06)';
    setTimeout(()=> priceAmount.style.transform='scale(1)', 180);
    priceAmount.style.transition='transform 180ms cubic-bezier(0.175,0.885,0.32,1.275)';
  }
  if(packageSelect && priceAmount){
    packageSelect.addEventListener('change', updatePricingDisplay);
    cartExtraMattress?.addEventListener('change', updatePricingDisplay);
    updatePricingDisplay();
  }

  // 5. Scroll reveal - staggered spring cascade (Geist spring 100/20 => approx 700ms ease-spring)
  const revealElements = document.querySelectorAll('.reveal-element');
  const revealObserver = new IntersectionObserver((entries, obs)=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        const el=entry.target;
        // stagger children if it's a grid
        if(el.classList.contains('products-wrapper') || el.classList.contains('editorial-grid')){
          el.classList.add('active');
        } else {
          el.classList.add('active');
        }
        obs.unobserve(el);
      }
    });
  }, {threshold:0.12, rootMargin:'0px 0px -40px 0px'});
  revealElements.forEach((el,i)=>{
    el.style.transitionDelay = `${Math.min(i%4 * 70, 210)}ms`;
    revealObserver.observe(el);
  });

  // 6. Freebie form
  const freebieForm = document.getElementById('freebieForm');
  const buyNowBtn = document.getElementById('buyNowBtn');
  if(freebieForm){
    freebieForm.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const email=document.getElementById('freebieEmail').value.trim();
      const name=document.getElementById('freebieName').value.trim();
      const btn=document.getElementById('freebieSubmitBtn');
      const orig=btn.textContent;
      btn.textContent='Sending…'; btn.disabled=true; btn.setAttribute('data-state','loading');
      try{
        const fd=new FormData(); fd.append('name',name); fd.append('email',email);
        const res=await fetch('/api/freebie-guide',{method:'POST', body:fd});
        const data=await res.json();
        if(data.sent){
          btn.setAttribute('data-state','success');
          btn.textContent='Sent ✓';
          // toast instead of alert (impeccable: less jarring)
          const toast=document.createElement('div');
          toast.textContent=`Thank you, ${name}! Guide sent to ${email}. Check spam too.`;
          Object.assign(toast.style,{position:'fixed',bottom:'18px',left:'50%',transform:'translateX(-50%) translateY(8px)',background:'#0F1F23',color:'white',padding:'12px 16px',borderRadius:'999px',fontSize:'0.88rem',boxShadow:'0 12px 32px rgba(15,31,35,0.22)',zIndex:'9999',opacity:'0',transition:'all 320ms cubic-bezier(0.22,1,0.36,1)'});
          document.body.appendChild(toast);
          requestAnimationFrame(()=>{ toast.style.opacity='1'; toast.style.transform='translateX(-50%) translateY(0)'; });
          setTimeout(()=>{ toast.style.opacity='0'; toast.style.transform='translateX(-50%) translateY(8px)'; setTimeout(()=>toast.remove(),320); }, 4200);
          freebieForm.reset();
          setTimeout(()=>{ btn.textContent=orig; btn.disabled=false; btn.removeAttribute('data-state'); }, 2000);
        } else {
          throw new Error('not sent');
        }
      } catch{
        btn.setAttribute('data-state','error');
        btn.textContent='Try again';
        setTimeout(()=>{ btn.textContent=orig; btn.disabled=false; btn.removeAttribute('data-state'); }, 2200);
      }
    });
  }
  if(buyNowBtn){
    buyNowBtn.addEventListener('click', ()=>{
      const dateVal=document.getElementById('bookingDates')?.value;
      if(!dateVal){ alert('Please choose a check-in date before reserving.'); document.getElementById('bookingDates')?.focus(); return; }
      // add success micro
      buyNowBtn.setAttribute('data-state','success');
      buyNowBtn.textContent='Opening dialer…';
      setTimeout(()=>{ window.location.href='tel:+918900911010'; buyNowBtn.textContent='Reserve now — call to confirm →'; buyNowBtn.removeAttribute('data-state'); }, 300);
    });
  }

  // 7. Booking calculator
  const bookingForm=document.querySelector('.widget-booking-form');
  if(bookingForm){
    const ci=bookingForm.querySelector('[name="checkin"]');
    const co=bookingForm.querySelector('[name="checkout"]');
    const mp=bookingForm.querySelector('[name="mealplan"]');
    const mcb=bookingForm.querySelector('[name="extramattress"]');
    const calcNights=bookingForm.querySelector('.calc-nights');
    const calcPlanPrice=bookingForm.querySelector('.calc-plan-price');
    const calcMattressRow=bookingForm.querySelector('.calc-mattress-row');
    const calcMattressPrice=bookingForm.querySelector('.calc-mattress-price');
    const calcTotal=bookingForm.querySelector('.calc-total');
    const fmt=n=>'₹'+n.toLocaleString('en-IN');
    function calc(){
      if(!ci||!co) return;
      let nights=1;
      if(ci.value && co.value){
        const d=Math.ceil((new Date(co.value)-new Date(ci.value))/(86400000));
        nights= d>0?d:1;
      }
      const plan=mp?mp.value:'cp';
      const isM=mcb?mcb.checked:false;
      const base=parseInt(bookingForm.getAttribute(`data-base-${plan}`))||0;
      const mpPrice=isM?parseInt(bookingForm.getAttribute(`data-extra-${plan}`))||0:0;
      if(calcNights) calcNights.textContent=`${nights} ${nights===1?'night':'nights'}`;
      if(calcPlanPrice) calcPlanPrice.textContent=fmt(base);
      if(calcMattressRow){
        if(isM && mpPrice>0){ calcMattressRow.style.display='flex'; if(calcMattressPrice) calcMattressPrice.textContent=fmt(mpPrice); }
        else calcMattressRow.style.display='none';
      }
      const total=(base+mpPrice)*nights;
      if(calcTotal) calcTotal.textContent=fmt(total);
    }
    ci?.addEventListener('change',calc); co?.addEventListener('change',calc); mp?.addEventListener('change',calc); mcb?.addEventListener('change',calc);
    const today=new Date(); const tom=new Date(today); tom.setDate(tom.getDate()+1); const dayAfter=new Date(today); dayAfter.setDate(dayAfter.getDate()+2);
    if(ci && !ci.value) ci.value=tom.toISOString().split('T')[0];
    if(co && !co.value) co.value=dayAfter.toISOString().split('T')[0];
    calc();
  }

  // 8. Gallery switcher with fade
  const galleryMainImg=document.querySelector('.gallery-main img');
  const thumbItems=document.querySelectorAll('.thumb-item');
  if(galleryMainImg && thumbItems.length){
    thumbItems.forEach(item=>{
      item.addEventListener('click', ()=>{
        thumbItems.forEach(t=>t.classList.remove('active'));
        item.classList.add('active');
        const src=item.querySelector('img')?.getAttribute('src');
        if(!src) return;
        galleryMainImg.style.opacity='0';
        galleryMainImg.style.transform='scale(0.98)';
        galleryMainImg.style.transition='opacity 220ms ease, transform 220ms ease';
        setTimeout(()=>{ galleryMainImg.setAttribute('src',src); galleryMainImg.style.opacity='1'; galleryMainImg.style.transform='scale(1)'; }, 180);
      });
    });
  }

  // Impeccable: set min dates to today
  const dateInputs=document.querySelectorAll('input[type="date"]');
  const todayStr=new Date().toISOString().split('T')[0];
  dateInputs.forEach(inp=>{ if(!inp.min) inp.min=todayStr; });

});
