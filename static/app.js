const $ = id => document.getElementById(id);
let selectedCharacter = "asta";
let completed = new Set();
try { completed = new Set(JSON.parse(localStorage.getItem("grimoire-progress-v2") || "[]").filter(n => Number.isInteger(n) && n >= 1 && n <= 6)); } catch {}
let executionCount = 0;
let imageAbort = null;
let inspection = null;
const names = {asta:"Asta",yuno:"Yuno",noelle:"Noelle"};
const filterLessons = {
 grises: {title:"Escala de grises", code:"gris = cv2.cvtColor(imagen, cv2.COLOR_BGR2GRAY)", info:"Convierte los tres canales de color en una sola intensidad de gris. No detecta objetos: transforma los valores de cada píxel."},
 gaussiano: {title:"Desenfoque gaussiano", code:"suave = cv2.GaussianBlur(imagen, (15, 15), 0)", info:"Promedia los píxeles vecinos con pesos gaussianos. Suaviza el detalle; el tamaño de la ventana debe ser impar."},
 bordes: {title:"Detección de bordes con Canny", code:"gris = cv2.cvtColor(imagen, cv2.COLOR_BGR2GRAY)\nsuave = cv2.GaussianBlur(gris, (5, 5), 0)\nbordes = cv2.Canny(suave, 100, 200)", info:"Convierte a gris, reduce el ruido y localiza cambios de intensidad. Las líneas blancas representan contornos, no una clasificación del personaje."},
 umbral: {title:"Umbral binario", code:"gris = cv2.cvtColor(imagen, cv2.COLOR_BGR2GRAY)\n_, binaria = cv2.threshold(gris, UMBRAL, 255, cv2.THRESH_BINARY)", info:"Asigna 255 cuando el gris es mayor al umbral y 0 en los demás casos. El porcentaje de píxeles claros se calcula con ≥, igual que en el ejercicio de condicionales."}
};
function renderProgress() {
 $("progress").value=completed.size; $("progress-label").textContent=completed.size+" / 6";
 document.querySelectorAll("[data-mission]").forEach(a=>a.classList.toggle("done",completed.has(Number(a.dataset.mission))));
 try {localStorage.setItem("grimoire-progress-v2",JSON.stringify([...completed]));} catch {}
}
function complete(n){completed.add(n);renderProgress();}
function count(id){$(id).textContent=++executionCount;}
function toast(text){$("toast").textContent=text;$("toast").classList.add("show");setTimeout(()=>$("toast").classList.remove("show"),2500);}
async function responseData(response){let data;try{data=await response.json();}catch{throw new Error("El servidor no está disponible. Vuelve a intentarlo en unos segundos.");}if(!response.ok)throw new Error(data.error||"No se pudo completar la solicitud.");return data;}
async function sendJSON(url,data){return responseData(await fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)}));}
function syncThreshold(){
 const pixel=Number($("pixel").value),threshold=Number($("lesson-threshold").value);
 $("pixel-value").textContent=pixel;$("pixel-label").textContent=pixel;$("lesson-threshold-value").textContent=threshold;
 $("code-pixel").textContent=pixel;$("code-threshold").textContent=threshold;
 $("pixel-swatch").style.background="rgb("+[pixel,pixel,pixel].join(",")+")";
 $("pixel-swatch").style.color=pixel>=128?"#111":"#fff";
 $("pixel-state").textContent=pixel>=threshold?"CLARO":"OSCURO";
}
["pixel","lesson-threshold"].forEach(id=>$(id).addEventListener("input",syncThreshold));
async function runCell(buttonId,outputId,countId,data,mission){
 const button=$(buttonId);button.disabled=true;$(outputId).textContent="Ejecutando…";
 try {const result=await sendJSON("/api/cuaderno",data);$(outputId).textContent=result.salida;count(countId);complete(mission);}
 catch(error){$(outputId).textContent=error.message;}finally{button.disabled=false;}
}
$("run-fundamentals").addEventListener("click",()=>runCell("run-fundamentals","output-m1","count-m1",{celda:"fundamentos"},1));
$("run-threshold").addEventListener("click",()=>runCell("run-threshold","output-m2","count-m2",{celda:"umbral",pixel:Number($("pixel").value),umbral:Number($("lesson-threshold").value)},2));
$("run-matrix").addEventListener("click",()=>runCell("run-matrix","output-m3","count-m3",{celda:"matriz",personaje:selectedCharacter},3));
function updateFilter(){
 const lesson=filterLessons[$("filtro").value];$("filter-title").textContent=lesson.title;
 $("filter-code").textContent=lesson.code.replace("UMBRAL",$("umbral").value);
 $("filter-info").textContent=lesson.info;$("threshold-value").textContent=$("umbral").value;
}
$("umbral").addEventListener("input",updateFilter);$("filtro").addEventListener("change",updateFilter);
$("compare-range").addEventListener("input",()=>{$("comparison").style.setProperty("--split",$("compare-range").value+"%");});
function drawInspector(source){
 const image=new Image();
 image.onload=()=>{
  const canvas=$("pixel-canvas"),ctx=canvas.getContext("2d",{willReadFrequently:true});
  canvas.width=420;canvas.height=240;ctx.fillStyle="#ececdf";ctx.fillRect(0,0,420,240);
  const scale=Math.min(420/image.width,240/image.height),width=image.width*scale,height=image.height*scale;
  const x=(420-width)/2,y=(240-height)/2;
  ctx.drawImage(image,x,y,width,height);inspection={image,x,y,width,height};
  $("pixel-info").textContent="Imagen lista. Selecciona un píxel.";$("sample-color").style.background="transparent";
 };
 image.src=source;
}
function inspectAt(cx,cy){
 if(!inspection)return;
 const p=inspection;
 if(cx<p.x||cy<p.y||cx>=p.x+p.width||cy>=p.y+p.height){$("pixel-info").textContent="Selecciona un punto dentro de la imagen.";return;}
 const x=Math.min(p.image.width-1,Math.floor((cx-p.x)/p.width*p.image.width));
 const y=Math.min(p.image.height-1,Math.floor((cy-p.y)/p.height*p.image.height));
 const sample=document.createElement("canvas");sample.width=sample.height=1;const ctx=sample.getContext("2d");
 ctx.drawImage(p.image,x,y,1,1,0,0,1,1);const [r,g,b]=ctx.getImageData(0,0,1,1).data;
 $("pixel-info").textContent="Posición (x, y): "+x+", "+y+"\nRGB: ["+r+", "+g+", "+b+"]";
 $("sample-color").style.background="rgb("+r+","+g+","+b+")";
}
$("pixel-canvas").addEventListener("click",event=>{const rect=$("pixel-canvas").getBoundingClientRect();inspectAt((event.clientX-rect.left)/rect.width*420,(event.clientY-rect.top)/rect.height*240);});
$("pixel-canvas").addEventListener("keydown",event=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();if(inspection)inspectAt(inspection.x+inspection.width/2,inspection.y+inspection.height/2);}});
async function processImage(mark=true){
 if(imageAbort)imageAbort.abort();imageAbort=new AbortController();
 $("process").disabled=true;$("image-status").textContent="Procesando imagen con OpenCV…";
 const form=new FormData();form.set("filtro",$("filtro").value);form.set("umbral",$("umbral").value);
 if($("imagen").files.length)form.set("imagen",$("imagen").files[0]);else form.set("demo",selectedCharacter);
 try{
 const data=await responseData(await fetch("/api/imagen",{method:"POST",body:form,signal:imageAbort.signal}));
 $("original").src=data.original;$("original").hidden=false;$("result").src=data.resultado;$("result").hidden=false;
 $("comparison").classList.add("ready");$("metrics").hidden=false;$("hist-wrap").hidden=false;
 $("dimensions").textContent=data.ancho+" × "+data.alto;$("brightness").textContent=data.brillo+" / 255";$("light").textContent=data.claros+" %";
 $("download").href=data.resultado;$("histogram").replaceChildren();
 const max=Math.max(...data.histograma,1);
 data.histograma.forEach((n,i)=>{const bar=document.createElement("i");bar.style.height=n/max*100+"%";bar.title=i*16+"–"+(i*16+15)+": "+n+" píxeles";$("histogram").append(bar);});
 $("image-status").textContent=data.filtro+" aplicado. Mueve el comparador o explora los píxeles.";
 drawInspector(data.original);if(mark){count("count-m4");complete(4);}
 }catch(error){if(error.name!=="AbortError")$("image-status").textContent=error.message;}
 finally{$("process").disabled=false;}
}
$("image-form").addEventListener("submit",event=>{event.preventDefault();processImage();});
$("imagen").addEventListener("change",()=>{$("file-label").textContent=$("imagen").files[0]?.name||"Imagen seleccionada: "+names[selectedCharacter];});
document.querySelectorAll("[data-character]").forEach(card=>card.addEventListener("click",()=>{
 selectedCharacter=card.dataset.character;$("imagen").value="";
 document.querySelectorAll("[data-character]").forEach(other=>{const active=other===card;other.classList.toggle("selected",active);other.setAttribute("aria-pressed",String(active));});
 $("code-character").textContent=selectedCharacter;
 $("file-label").textContent="Imagen seleccionada: "+names[selectedCharacter];
 $("output-m3").textContent="Seleccionaste a "+names[selectedCharacter]+". Ejecuta Leer imagen para actualizar sus dimensiones.";
 processImage(false);
}));
$("copy-filter").addEventListener("click",async()=>{try{await navigator.clipboard.writeText($("filter-code").textContent);toast("Código copiado.");}catch{toast("Selecciona el código y cópialo con Ctrl+C.");}});
$("greeting-form").addEventListener("submit",async event=>{
 event.preventDefault();const button=event.target.querySelector("button");button.disabled=true;
 try{const data=await sendJSON("/api/saludo",{nombre:$("nombre").value,edad:$("edad").value});$("greeting-result").textContent=data.mensaje;complete(5);}
 catch(error){$("greeting-result").textContent=error.message;}finally{button.disabled=false;}
});
$("calc-form").addEventListener("submit",async event=>{
 event.preventDefault();const button=event.target.querySelector("button");button.disabled=true;
 try{const data=await sendJSON("/api/calcular",{a:$("a").value,b:$("b").value,operacion:$("operacion").value});$("calc-result").textContent="Resultado: "+data.resultado;complete(5);}
 catch(error){$("calc-result").textContent=error.message;}finally{button.disabled=false;}
});
$("quiz").addEventListener("submit",event=>{
 event.preventDefault();const f=new FormData(event.target),correct=[f.get("q1")==="255",f.get("q2")==="canny",f.get("q3")==="RequestParam"];
 const score=correct.filter(Boolean).length;
 $("quiz-result").textContent="Resultado: "+score+" / 3\n"+[
 (correct[0]?"✓":"✗")+" 1. Un canal de 8 bits va de 0 a 255 (256 valores).",
 (correct[1]?"✓":"✗")+" 2. Canny resalta cambios de intensidad y contornos.",
 (correct[2]?"✓":"✗")+" 3. @RequestParam recibe los parámetros de la solicitud."
 ].join("\n")+(score===3?"\n¡Misión completada! Puedes descargar tu cuaderno.":"\nRevisa las explicaciones y vuelve a intentarlo.");
 if(score===3)complete(6);
});
$("reset-progress").addEventListener("click",()=>{completed.clear();renderProgress();toast("Avance reiniciado.");});
const observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){document.querySelectorAll("#mission-nav a").forEach(a=>a.classList.toggle("current",a.hash==="#"+entry.target.id));}},{rootMargin:"-100px 0px -60% 0px"});
document.querySelectorAll(".mission").forEach(section=>observer.observe(section));
syncThreshold();renderProgress();updateFilter();processImage(false);
