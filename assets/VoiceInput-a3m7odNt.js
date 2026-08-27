import{c as p,u as f,r as c,j as s,s as i}from"./index-CZAs0Rf5.js";/**
 * @license lucide-react v0.555.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const x=[["path",{d:"M12 19v3",key:"npa21l"}],["path",{d:"M15 9.34V5a3 3 0 0 0-5.68-1.33",key:"1gzdoj"}],["path",{d:"M16.95 16.95A7 7 0 0 1 5 12v-2",key:"cqa7eg"}],["path",{d:"M18.89 13.23A7 7 0 0 0 19 12v-2",key:"16hl24"}],["path",{d:"m2 2 20 20",key:"1ooewy"}],["path",{d:"M9 9v3a3 3 0 0 0 5.12 2.12",key:"r2i35w"}]],y=p("mic-off",x);/**
 * @license lucide-react v0.555.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const S=[["path",{d:"M12 19v3",key:"npa21l"}],["path",{d:"M19 10v2a7 7 0 0 1-14 0v-2",key:"1vc78b"}],["rect",{x:"9",y:"2",width:"6",height:"13",rx:"3",key:"s6n7sd"}]],k=p("mic",S),v=({onResult:d,placeholder:h})=>{const{language:t}=f(),[r,n]=c.useState(!1),[a]=c.useState(()=>typeof window<"u"&&("webkitSpeechRecognition"in window||"SpeechRecognition"in window)),l=()=>{if(!a){i("Voice input is not supported in this browser.","warning");return}const w=window.webkitSpeechRecognition||window.SpeechRecognition,e=new w;e.lang=t==="ta"?"ta-IN":"en-US",e.interimResults=!1,e.maxAlternatives=1,e.onstart=()=>{n(!0)},e.onresult=o=>{const g=o.results[0][0].transcript;d(g),n(!1),i(t==="ta"?"உரை சேகரிக்கப்பட்டது":"Speech captured","success")},e.onerror=o=>{console.error("Speech recognition error",o.error),n(!1),i(`${t==="ta"?"பேச்சுப் பிழை":"Speech error"}: ${o.error}`,"error")},e.onend=()=>{n(!1)},e.start()};if(!a)return null;const u=h||(r?t==="ta"?"கவனிக்கிறது...":"Listening...":t==="ta"?"குரல் மூலம் தேடு":"Search by voice");return s.jsx("button",{onClick:l,className:`p-2 rounded-xl transition-all ${r?"bg-red-500/20 text-red-500 animate-pulse":"text-slate-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10"}`,title:u,children:r?s.jsx(y,{className:"h-5 w-5"}):s.jsx(k,{className:"h-5 w-5"})})};export{v as V};
