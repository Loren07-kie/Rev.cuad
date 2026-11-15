const $ = id => document.getElementById(id);
const explanations = {grises:"Cada píxel se convierte en una intensidad de gris entre 0 y 255.",gaussiano:"Un promedio ponderado de los píxeles vecinos suaviza detalles y ruido.",bordes:"Canny identifica cambios de intensidad para destacar contornos.",umbral:"Los píxeles mayores al umbral se vuelven blancos; los demás, negros."};
$("umbral").addEventListener("input", () => $("threshold-value").textContent = $("umbral").value);
$("filtro").addEventListener("change", () => $("filter-info").textContent = explanations[$("filtro").value]);
$("imagen").addEventListener("change", () => {$("file-label").textContent = $("imagen").files[0]?.name || "Haz clic para seleccionar un archivo";});
async function responseData(response) {const data=await response.json(); if(!response.ok) throw new Error(data.error || "No se pudo completar la solicitud."); return data;}
$("image-form").addEventListener("submit", async e => {
 e.preventDefault(); $("process").disabled=true; $("image-status").textContent="Procesando tu imagen…";
 try {
 const data=await responseData(await fetch("/api/imagen",{method:"POST",body:new FormData(e.target)}));
 for(const [id,src] of [["original",data.original],["result",data.resultado]]) {$(id).src=src; $(id).hidden=false; $(id).parentElement.querySelector(".empty").hidden=true;}
 $("metrics").hidden=false; $("hist-wrap").hidden=false; $("dimensions").textContent=data.ancho+" × "+data.alto; $("brightness").textContent=data.brillo+" / 255"; $("light").textContent=data.claros+" %"; $("download").href=data.resultado;
 $("histogram").replaceChildren(); const max=Math.max(...data.histograma,1);
 data.histograma.forEach((n,i)=>{const bar=document.createElement("i");bar.style.height=(n/max*100)+"%";bar.title="Intensidad "+i*16+"–"+(i*16+15)+": "+n+" píxeles";$("histogram").append(bar);});
 $("image-status").textContent=data.filtro+" aplicado. Ya puedes descargar el resultado.";
 } catch(error){$("image-status").textContent=error.message;} finally{$("process").disabled=false;}
});
async function sendJSON(url,data){return responseData(await fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)}));}
$("greeting-form").addEventListener("submit",async e=>{e.preventDefault();try{const data=await sendJSON("/api/saludo",{nombre:$("nombre").value,edad:$("edad").value});$("greeting-result").textContent=data.mensaje;}catch(error){$("greeting-result").textContent=error.message;}});
$("calc-form").addEventListener("submit",async e=>{e.preventDefault();try{const data=await sendJSON("/api/calcular",{a:$("a").value,b:$("b").value,operacion:$("operacion").value});$("calc-result").textContent="Resultado: "+data.resultado;}catch(error){$("calc-result").textContent=error.message;}});
