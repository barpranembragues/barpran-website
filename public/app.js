const menu=document.querySelector('.menu-toggle'),nav=document.querySelector('.new-header nav');menu.addEventListener('click',()=>{const open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',open)});nav.addEventListener('click',e=>{if(e.target.closest('a')){nav.classList.remove('open');menu.setAttribute('aria-expanded','false')}});
fetch('products.json').then(r=>r.json()).then(products=>{
 const sec=document.querySelector('#productos .frame');
 const heading=sec.querySelector('h2').outerHTML;
 sec.innerHTML='<p class="kicker">03 · Ecosistema de productos</p>'+heading+'<div class="product-layout"><div class="product-tabs" role="tablist" aria-label="Productos"></div><div class="product-detail" role="tabpanel"></div></div>';
 const tabs=sec.querySelector('.product-tabs'),panel=sec.querySelector('.product-detail');
 function select(i){const p=products[i];tabs.querySelectorAll('button').forEach((b,j)=>{b.classList.toggle('active',i===j);b.setAttribute('aria-selected',i===j)});panel.innerHTML='<img src="assets/'+(p.imagen||p.imagenes[1]).split('/').pop().replaceAll(' ','-')+'" alt="'+p.nombre+'"><h3>'+p.nombre+'</h3><p>'+p.resumen+'</p><ul>'+p.specs.map(x=>'<li>'+x+'</li>').join('')+'</ul>';}
 products.forEach((p,i)=>{const b=document.createElement('button');b.setAttribute('role','tab');b.textContent=p.codigo+' / '+p.nombre;b.onclick=()=>select(i);tabs.append(b)});select(0);
});
const pilotSection=document.querySelector('#pilotos-barpran'),pilotGrid=pilotSection.querySelector('article').parentElement,originalPilots=pilotGrid.innerHTML;
pilotSection.querySelectorAll('button').forEach((b,i)=>{b.classList.toggle('active',i===0);b.onclick=()=>{pilotSection.querySelectorAll('button').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',x===b)});if(i===0){pilotGrid.innerHTML=originalPilots;return}const names=i===1?['Gabriel Gandulia','Benjamín Antón','Eugenio Provens','Manuel Borgert','Benjamín Ochoa','Nicanor Santilli Pazos','Braian Quevedo']:['Marcos Di Palma'];pilotGrid.innerHTML=names.map(name=>'<article><img style="height:230px;width:100%;object-fit:contain" src="assets/'+name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replaceAll(' ','-')+'.png" alt="'+name+'"><div style="padding:20px"><p>'+b.textContent+'</p><h3>'+name+'</h3><p>Embrague BARPRAN</p></div></article>').join('')}});

addEventListener('scroll',()=>document.querySelector('.new-header').classList.toggle('scrolled',scrollY>30),{passive:true});

function buildQuoteMessage(data) {
 const lines=['Hola BARPRAN, quiero pedir precio.','Nombre: '+data.get('nombre').trim(),'Necesito: '+data.get('servicio'),'Vehículo: '+data.get('auto').trim()];
 for(const [key,label] of [['anio','Año'],['motor','Motor / versión'],['mensaje','Consulta']]) {const value=(data.get(key)||'').trim();if(value)lines.push(label+': '+value);}
 return lines.join('\n');
}
document.querySelector('#quote-form').addEventListener('submit',event=>{
 event.preventDefault(); const form=event.currentTarget;
 for(const field of form.querySelectorAll('[required]')) {field.setCustomValidity(field.value.trim()?'':'Completá este campo.');}
 if(!form.reportValidity())return;
 window.open('https://wa.me/5491170586143?text='+encodeURIComponent(buildQuoteMessage(new FormData(form))),'_blank','noopener,noreferrer');
});
document.querySelector('#quote-form').addEventListener('input',event=>event.target.setCustomValidity?.(''));
