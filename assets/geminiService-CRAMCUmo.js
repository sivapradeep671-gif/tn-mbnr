var Z=Object.defineProperty;var ee=(e,t,n)=>t in e?Z(e,t,{enumerable:!0,configurable:!0,writable:!0,value:n}):e[t]=n;var S=(e,t,n)=>ee(e,typeof t!="symbol"?t+"":t,n);var b;(function(e){e.STRING="string",e.NUMBER="number",e.INTEGER="integer",e.BOOLEAN="boolean",e.ARRAY="array",e.OBJECT="object"})(b||(b={}));/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var M;(function(e){e.LANGUAGE_UNSPECIFIED="language_unspecified",e.PYTHON="python"})(M||(M={}));var L;(function(e){e.OUTCOME_UNSPECIFIED="outcome_unspecified",e.OUTCOME_OK="outcome_ok",e.OUTCOME_FAILED="outcome_failed",e.OUTCOME_DEADLINE_EXCEEDED="outcome_deadline_exceeded"})(L||(L={}));/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const D=["user","model","function","system"];var x;(function(e){e.HARM_CATEGORY_UNSPECIFIED="HARM_CATEGORY_UNSPECIFIED",e.HARM_CATEGORY_HATE_SPEECH="HARM_CATEGORY_HATE_SPEECH",e.HARM_CATEGORY_SEXUALLY_EXPLICIT="HARM_CATEGORY_SEXUALLY_EXPLICIT",e.HARM_CATEGORY_HARASSMENT="HARM_CATEGORY_HARASSMENT",e.HARM_CATEGORY_DANGEROUS_CONTENT="HARM_CATEGORY_DANGEROUS_CONTENT",e.HARM_CATEGORY_CIVIC_INTEGRITY="HARM_CATEGORY_CIVIC_INTEGRITY"})(x||(x={}));var G;(function(e){e.HARM_BLOCK_THRESHOLD_UNSPECIFIED="HARM_BLOCK_THRESHOLD_UNSPECIFIED",e.BLOCK_LOW_AND_ABOVE="BLOCK_LOW_AND_ABOVE",e.BLOCK_MEDIUM_AND_ABOVE="BLOCK_MEDIUM_AND_ABOVE",e.BLOCK_ONLY_HIGH="BLOCK_ONLY_HIGH",e.BLOCK_NONE="BLOCK_NONE"})(G||(G={}));var k;(function(e){e.HARM_PROBABILITY_UNSPECIFIED="HARM_PROBABILITY_UNSPECIFIED",e.NEGLIGIBLE="NEGLIGIBLE",e.LOW="LOW",e.MEDIUM="MEDIUM",e.HIGH="HIGH"})(k||(k={}));var H;(function(e){e.BLOCKED_REASON_UNSPECIFIED="BLOCKED_REASON_UNSPECIFIED",e.SAFETY="SAFETY",e.OTHER="OTHER"})(H||(H={}));var I;(function(e){e.FINISH_REASON_UNSPECIFIED="FINISH_REASON_UNSPECIFIED",e.STOP="STOP",e.MAX_TOKENS="MAX_TOKENS",e.SAFETY="SAFETY",e.RECITATION="RECITATION",e.LANGUAGE="LANGUAGE",e.BLOCKLIST="BLOCKLIST",e.PROHIBITED_CONTENT="PROHIBITED_CONTENT",e.SPII="SPII",e.MALFORMED_FUNCTION_CALL="MALFORMED_FUNCTION_CALL",e.OTHER="OTHER"})(I||(I={}));var U;(function(e){e.TASK_TYPE_UNSPECIFIED="TASK_TYPE_UNSPECIFIED",e.RETRIEVAL_QUERY="RETRIEVAL_QUERY",e.RETRIEVAL_DOCUMENT="RETRIEVAL_DOCUMENT",e.SEMANTIC_SIMILARITY="SEMANTIC_SIMILARITY",e.CLASSIFICATION="CLASSIFICATION",e.CLUSTERING="CLUSTERING"})(U||(U={}));var F;(function(e){e.MODE_UNSPECIFIED="MODE_UNSPECIFIED",e.AUTO="AUTO",e.ANY="ANY",e.NONE="NONE"})(F||(F={}));var $;(function(e){e.MODE_UNSPECIFIED="MODE_UNSPECIFIED",e.MODE_DYNAMIC="MODE_DYNAMIC"})($||($={}));/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class u extends Error{constructor(t){super(`[GoogleGenerativeAI Error]: ${t}`)}}class _ extends u{constructor(t,n){super(t),this.response=n}}class J extends u{constructor(t,n,s,i){super(t),this.status=n,this.statusText=s,this.errorDetails=i}}class E extends u{}class z extends u{}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const te="https://generativelanguage.googleapis.com",ne="v1beta",se="0.24.1",ie="genai-js";var m;(function(e){e.GENERATE_CONTENT="generateContent",e.STREAM_GENERATE_CONTENT="streamGenerateContent",e.COUNT_TOKENS="countTokens",e.EMBED_CONTENT="embedContent",e.BATCH_EMBED_CONTENTS="batchEmbedContents"})(m||(m={}));class oe{constructor(t,n,s,i,o){this.model=t,this.task=n,this.apiKey=s,this.stream=i,this.requestOptions=o}toString(){var t,n;const s=((t=this.requestOptions)===null||t===void 0?void 0:t.apiVersion)||ne;let o=`${((n=this.requestOptions)===null||n===void 0?void 0:n.baseUrl)||te}/${s}/${this.model}:${this.task}`;return this.stream&&(o+="?alt=sse"),o}}function ae(e){const t=[];return e!=null&&e.apiClient&&t.push(e.apiClient),t.push(`${ie}/${se}`),t.join(" ")}async function re(e){var t;const n=new Headers;n.append("Content-Type","application/json"),n.append("x-goog-api-client",ae(e.requestOptions)),n.append("x-goog-api-key",e.apiKey);let s=(t=e.requestOptions)===null||t===void 0?void 0:t.customHeaders;if(s){if(!(s instanceof Headers))try{s=new Headers(s)}catch(i){throw new E(`unable to convert customHeaders value ${JSON.stringify(s)} to Headers: ${i.message}`)}for(const[i,o]of s.entries()){if(i==="x-goog-api-key")throw new E(`Cannot set reserved header name ${i}`);if(i==="x-goog-api-client")throw new E(`Header name ${i} can only be set using the apiClient field`);n.append(i,o)}}return n}async function ce(e,t,n,s,i,o){const a=new oe(e,t,n,s,o);return{url:a.toString(),fetchOptions:Object.assign(Object.assign({},fe(o)),{method:"POST",headers:await re(a),body:i})}}async function O(e,t,n,s,i,o={},a=fetch){const{url:r,fetchOptions:l}=await ce(e,t,n,s,i,o);return le(r,l,a)}async function le(e,t,n=fetch){let s;try{s=await n(e,t)}catch(i){de(i,e)}return s.ok||await ue(s,e),s}function de(e,t){let n=e;throw n.name==="AbortError"?(n=new z(`Request aborted when fetching ${t.toString()}: ${e.message}`),n.stack=e.stack):e instanceof J||e instanceof E||(n=new u(`Error fetching from ${t.toString()}: ${e.message}`),n.stack=e.stack),n}async function ue(e,t){let n="",s;try{const i=await e.json();n=i.error.message,i.error.details&&(n+=` ${JSON.stringify(i.error.details)}`,s=i.error.details)}catch{}throw new J(`Error fetching from ${t.toString()}: [${e.status} ${e.statusText}] ${n}`,e.status,e.statusText,s)}function fe(e){const t={};if((e==null?void 0:e.signal)!==void 0||(e==null?void 0:e.timeout)>=0){const n=new AbortController;(e==null?void 0:e.timeout)>=0&&setTimeout(()=>n.abort(),e.timeout),e!=null&&e.signal&&e.signal.addEventListener("abort",()=>{n.abort()}),t.signal=n.signal}return t}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function w(e){return e.text=()=>{if(e.candidates&&e.candidates.length>0){if(e.candidates.length>1&&console.warn(`This response had ${e.candidates.length} candidates. Returning text from the first candidate only. Access response.candidates directly to use the other candidates.`),N(e.candidates[0]))throw new _(`${g(e)}`,e);return he(e)}else if(e.promptFeedback)throw new _(`Text not available. ${g(e)}`,e);return""},e.functionCall=()=>{if(e.candidates&&e.candidates.length>0){if(e.candidates.length>1&&console.warn(`This response had ${e.candidates.length} candidates. Returning function calls from the first candidate only. Access response.candidates directly to use the other candidates.`),N(e.candidates[0]))throw new _(`${g(e)}`,e);return console.warn("response.functionCall() is deprecated. Use response.functionCalls() instead."),B(e)[0]}else if(e.promptFeedback)throw new _(`Function call not available. ${g(e)}`,e)},e.functionCalls=()=>{if(e.candidates&&e.candidates.length>0){if(e.candidates.length>1&&console.warn(`This response had ${e.candidates.length} candidates. Returning function calls from the first candidate only. Access response.candidates directly to use the other candidates.`),N(e.candidates[0]))throw new _(`${g(e)}`,e);return B(e)}else if(e.promptFeedback)throw new _(`Function call not available. ${g(e)}`,e)},e}function he(e){var t,n,s,i;const o=[];if(!((n=(t=e.candidates)===null||t===void 0?void 0:t[0].content)===null||n===void 0)&&n.parts)for(const a of(i=(s=e.candidates)===null||s===void 0?void 0:s[0].content)===null||i===void 0?void 0:i.parts)a.text&&o.push(a.text),a.executableCode&&o.push("\n```"+a.executableCode.language+`
`+a.executableCode.code+"\n```\n"),a.codeExecutionResult&&o.push("\n```\n"+a.codeExecutionResult.output+"\n```\n");return o.length>0?o.join(""):""}function B(e){var t,n,s,i;const o=[];if(!((n=(t=e.candidates)===null||t===void 0?void 0:t[0].content)===null||n===void 0)&&n.parts)for(const a of(i=(s=e.candidates)===null||s===void 0?void 0:s[0].content)===null||i===void 0?void 0:i.parts)a.functionCall&&o.push(a.functionCall);if(o.length>0)return o}const ge=[I.RECITATION,I.SAFETY,I.LANGUAGE];function N(e){return!!e.finishReason&&ge.includes(e.finishReason)}function g(e){var t,n,s;let i="";if((!e.candidates||e.candidates.length===0)&&e.promptFeedback)i+="Response was blocked",!((t=e.promptFeedback)===null||t===void 0)&&t.blockReason&&(i+=` due to ${e.promptFeedback.blockReason}`),!((n=e.promptFeedback)===null||n===void 0)&&n.blockReasonMessage&&(i+=`: ${e.promptFeedback.blockReasonMessage}`);else if(!((s=e.candidates)===null||s===void 0)&&s[0]){const o=e.candidates[0];N(o)&&(i+=`Candidate was blocked due to ${o.finishReason}`,o.finishMessage&&(i+=`: ${o.finishMessage}`))}return i}function R(e){return this instanceof R?(this.v=e,this):new R(e)}function Ee(e,t,n){if(!Symbol.asyncIterator)throw new TypeError("Symbol.asyncIterator is not defined.");var s=n.apply(e,t||[]),i,o=[];return i={},a("next"),a("throw"),a("return"),i[Symbol.asyncIterator]=function(){return this},i;function a(d){s[d]&&(i[d]=function(c){return new Promise(function(f,v){o.push([d,c,f,v])>1||r(d,c)})})}function r(d,c){try{l(s[d](c))}catch(f){y(o[0][3],f)}}function l(d){d.value instanceof R?Promise.resolve(d.value.v).then(h,C):y(o[0][2],d)}function h(d){r("next",d)}function C(d){r("throw",d)}function y(d,c){d(c),o.shift(),o.length&&r(o[0][0],o[0][1])}}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const j=/^data\: (.*)(?:\n\n|\r\r|\r\n\r\n)/;function pe(e){const t=e.body.pipeThrough(new TextDecoderStream("utf8",{fatal:!0})),n=ye(t),[s,i]=n.tee();return{stream:Ce(s),response:me(i)}}async function me(e){const t=[],n=e.getReader();for(;;){const{done:s,value:i}=await n.read();if(s)return w(ve(t));t.push(i)}}function Ce(e){return Ee(this,arguments,function*(){const n=e.getReader();for(;;){const{value:s,done:i}=yield R(n.read());if(i)break;yield yield R(w(s))}})}function ye(e){const t=e.getReader();return new ReadableStream({start(s){let i="";return o();function o(){return t.read().then(({value:a,done:r})=>{if(r){if(i.trim()){s.error(new u("Failed to parse stream"));return}s.close();return}i+=a;let l=i.match(j),h;for(;l;){try{h=JSON.parse(l[1])}catch{s.error(new u(`Error parsing JSON response: "${l[1]}"`));return}s.enqueue(h),i=i.substring(l[0].length),l=i.match(j)}return o()}).catch(a=>{let r=a;throw r.stack=a.stack,r.name==="AbortError"?r=new z("Request aborted when reading from the stream"):r=new u("Error reading from the stream"),r})}}})}function ve(e){const t=e[e.length-1],n={promptFeedback:t==null?void 0:t.promptFeedback};for(const s of e){if(s.candidates){let i=0;for(const o of s.candidates)if(n.candidates||(n.candidates=[]),n.candidates[i]||(n.candidates[i]={index:i}),n.candidates[i].citationMetadata=o.citationMetadata,n.candidates[i].groundingMetadata=o.groundingMetadata,n.candidates[i].finishReason=o.finishReason,n.candidates[i].finishMessage=o.finishMessage,n.candidates[i].safetyRatings=o.safetyRatings,o.content&&o.content.parts){n.candidates[i].content||(n.candidates[i].content={role:o.content.role||"user",parts:[]});const a={};for(const r of o.content.parts)r.text&&(a.text=r.text),r.functionCall&&(a.functionCall=r.functionCall),r.executableCode&&(a.executableCode=r.executableCode),r.codeExecutionResult&&(a.codeExecutionResult=r.codeExecutionResult),Object.keys(a).length===0&&(a.text=""),n.candidates[i].content.parts.push(a)}i++}s.usageMetadata&&(n.usageMetadata=s.usageMetadata)}return n}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function W(e,t,n,s){const i=await O(t,m.STREAM_GENERATE_CONTENT,e,!0,JSON.stringify(n),s);return pe(i)}async function X(e,t,n,s){const o=await(await O(t,m.GENERATE_CONTENT,e,!1,JSON.stringify(n),s)).json();return{response:w(o)}}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Q(e){if(e!=null){if(typeof e=="string")return{role:"system",parts:[{text:e}]};if(e.text)return{role:"system",parts:[e]};if(e.parts)return e.role?e:{role:"system",parts:e.parts}}}function A(e){let t=[];if(typeof e=="string")t=[{text:e}];else for(const n of e)typeof n=="string"?t.push({text:n}):t.push(n);return _e(t)}function _e(e){const t={role:"user",parts:[]},n={role:"function",parts:[]};let s=!1,i=!1;for(const o of e)"functionResponse"in o?(n.parts.push(o),i=!0):(t.parts.push(o),s=!0);if(s&&i)throw new u("Within a single message, FunctionResponse cannot be mixed with other type of part in the request for sending chat message.");if(!s&&!i)throw new u("No content is provided for sending chat message.");return s?t:n}function Ie(e,t){var n;let s={model:t==null?void 0:t.model,generationConfig:t==null?void 0:t.generationConfig,safetySettings:t==null?void 0:t.safetySettings,tools:t==null?void 0:t.tools,toolConfig:t==null?void 0:t.toolConfig,systemInstruction:t==null?void 0:t.systemInstruction,cachedContent:(n=t==null?void 0:t.cachedContent)===null||n===void 0?void 0:n.name,contents:[]};const i=e.generateContentRequest!=null;if(e.contents){if(i)throw new E("CountTokensRequest must have one of contents or generateContentRequest, not both.");s.contents=e.contents}else if(i)s=Object.assign(Object.assign({},s),e.generateContentRequest);else{const o=A(e);s.contents=[o]}return{generateContentRequest:s}}function Y(e){let t;return e.contents?t=e:t={contents:[A(e)]},e.systemInstruction&&(t.systemInstruction=Q(e.systemInstruction)),t}function Re(e){return typeof e=="string"||Array.isArray(e)?{content:A(e)}:e}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const K=["text","inlineData","functionCall","functionResponse","executableCode","codeExecutionResult"],Ae={user:["text","inlineData"],function:["functionResponse"],model:["text","functionCall","executableCode","codeExecutionResult"],system:["text"]};function Oe(e){let t=!1;for(const n of e){const{role:s,parts:i}=n;if(!t&&s!=="user")throw new u(`First content should be with role 'user', got ${s}`);if(!D.includes(s))throw new u(`Each item should include role field. Got ${s} but valid roles are: ${JSON.stringify(D)}`);if(!Array.isArray(i))throw new u("Content should have 'parts' property with an array of Parts");if(i.length===0)throw new u("Each Content should have at least one part");const o={text:0,inlineData:0,functionCall:0,functionResponse:0,fileData:0,executableCode:0,codeExecutionResult:0};for(const r of i)for(const l of K)l in r&&(o[l]+=1);const a=Ae[s];for(const r of K)if(!a.includes(r)&&o[r]>0)throw new u(`Content with role '${s}' can't contain '${r}' part`);t=!0}}function P(e){var t;if(e.candidates===void 0||e.candidates.length===0)return!1;const n=(t=e.candidates[0])===null||t===void 0?void 0:t.content;if(n===void 0||n.parts===void 0||n.parts.length===0)return!1;for(const s of n.parts)if(s===void 0||Object.keys(s).length===0||s.text!==void 0&&s.text==="")return!1;return!0}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const q="SILENT_ERROR";class Se{constructor(t,n,s,i={}){this.model=n,this.params=s,this._requestOptions=i,this._history=[],this._sendPromise=Promise.resolve(),this._apiKey=t,s!=null&&s.history&&(Oe(s.history),this._history=s.history)}async getHistory(){return await this._sendPromise,this._history}async sendMessage(t,n={}){var s,i,o,a,r,l;await this._sendPromise;const h=A(t),C={safetySettings:(s=this.params)===null||s===void 0?void 0:s.safetySettings,generationConfig:(i=this.params)===null||i===void 0?void 0:i.generationConfig,tools:(o=this.params)===null||o===void 0?void 0:o.tools,toolConfig:(a=this.params)===null||a===void 0?void 0:a.toolConfig,systemInstruction:(r=this.params)===null||r===void 0?void 0:r.systemInstruction,cachedContent:(l=this.params)===null||l===void 0?void 0:l.cachedContent,contents:[...this._history,h]},y=Object.assign(Object.assign({},this._requestOptions),n);let d;return this._sendPromise=this._sendPromise.then(()=>X(this._apiKey,this.model,C,y)).then(c=>{var f;if(P(c.response)){this._history.push(h);const v=Object.assign({parts:[],role:"model"},(f=c.response.candidates)===null||f===void 0?void 0:f[0].content);this._history.push(v)}else{const v=g(c.response);v&&console.warn(`sendMessage() was unsuccessful. ${v}. Inspect response object for details.`)}d=c}).catch(c=>{throw this._sendPromise=Promise.resolve(),c}),await this._sendPromise,d}async sendMessageStream(t,n={}){var s,i,o,a,r,l;await this._sendPromise;const h=A(t),C={safetySettings:(s=this.params)===null||s===void 0?void 0:s.safetySettings,generationConfig:(i=this.params)===null||i===void 0?void 0:i.generationConfig,tools:(o=this.params)===null||o===void 0?void 0:o.tools,toolConfig:(a=this.params)===null||a===void 0?void 0:a.toolConfig,systemInstruction:(r=this.params)===null||r===void 0?void 0:r.systemInstruction,cachedContent:(l=this.params)===null||l===void 0?void 0:l.cachedContent,contents:[...this._history,h]},y=Object.assign(Object.assign({},this._requestOptions),n),d=W(this._apiKey,this.model,C,y);return this._sendPromise=this._sendPromise.then(()=>d).catch(c=>{throw new Error(q)}).then(c=>c.response).then(c=>{if(P(c)){this._history.push(h);const f=Object.assign({},c.candidates[0].content);f.role||(f.role="model"),this._history.push(f)}else{const f=g(c);f&&console.warn(`sendMessageStream() was unsuccessful. ${f}. Inspect response object for details.`)}}).catch(c=>{c.message!==q&&console.error(c)}),d}}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Ne(e,t,n,s){return(await O(t,m.COUNT_TOKENS,e,!1,JSON.stringify(n),s)).json()}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Te(e,t,n,s){return(await O(t,m.EMBED_CONTENT,e,!1,JSON.stringify(n),s)).json()}async function we(e,t,n,s){const i=n.requests.map(a=>Object.assign(Object.assign({},a),{model:t}));return(await O(t,m.BATCH_EMBED_CONTENTS,e,!1,JSON.stringify({requests:i}),s)).json()}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class V{constructor(t,n,s={}){this.apiKey=t,this._requestOptions=s,n.model.includes("/")?this.model=n.model:this.model=`models/${n.model}`,this.generationConfig=n.generationConfig||{},this.safetySettings=n.safetySettings||[],this.tools=n.tools,this.toolConfig=n.toolConfig,this.systemInstruction=Q(n.systemInstruction),this.cachedContent=n.cachedContent}async generateContent(t,n={}){var s;const i=Y(t),o=Object.assign(Object.assign({},this._requestOptions),n);return X(this.apiKey,this.model,Object.assign({generationConfig:this.generationConfig,safetySettings:this.safetySettings,tools:this.tools,toolConfig:this.toolConfig,systemInstruction:this.systemInstruction,cachedContent:(s=this.cachedContent)===null||s===void 0?void 0:s.name},i),o)}async generateContentStream(t,n={}){var s;const i=Y(t),o=Object.assign(Object.assign({},this._requestOptions),n);return W(this.apiKey,this.model,Object.assign({generationConfig:this.generationConfig,safetySettings:this.safetySettings,tools:this.tools,toolConfig:this.toolConfig,systemInstruction:this.systemInstruction,cachedContent:(s=this.cachedContent)===null||s===void 0?void 0:s.name},i),o)}startChat(t){var n;return new Se(this.apiKey,this.model,Object.assign({generationConfig:this.generationConfig,safetySettings:this.safetySettings,tools:this.tools,toolConfig:this.toolConfig,systemInstruction:this.systemInstruction,cachedContent:(n=this.cachedContent)===null||n===void 0?void 0:n.name},t),this._requestOptions)}async countTokens(t,n={}){const s=Ie(t,{model:this.model,generationConfig:this.generationConfig,safetySettings:this.safetySettings,tools:this.tools,toolConfig:this.toolConfig,systemInstruction:this.systemInstruction,cachedContent:this.cachedContent}),i=Object.assign(Object.assign({},this._requestOptions),n);return Ne(this.apiKey,this.model,s,i)}async embedContent(t,n={}){const s=Re(t),i=Object.assign(Object.assign({},this._requestOptions),n);return Te(this.apiKey,this.model,s,i)}async batchEmbedContents(t,n={}){const s=Object.assign(Object.assign({},this._requestOptions),n);return we(this.apiKey,this.model,t,s)}}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class be{constructor(t){this.apiKey=t}getGenerativeModel(t,n){if(!t.model)throw new u("Must provide a model name. Example: genai.getGenerativeModel({ model: 'my-model-name' })");return new V(this.apiKey,t,n)}getGenerativeModelFromCachedContent(t,n,s){if(!t.name)throw new E("Cached content must contain a `name` field.");if(!t.model)throw new E("Cached content must contain a `model` field.");const i=["model","systemInstruction"];for(const a of i)if(n!=null&&n[a]&&t[a]&&(n==null?void 0:n[a])!==t[a]){if(a==="model"){const r=n.model.startsWith("models/")?n.model.replace("models/",""):n.model,l=t.model.startsWith("models/")?t.model.replace("models/",""):t.model;if(r===l)continue}throw new E(`Different value for "${a}" specified in modelParams (${n[a]}) and cachedContent (${t[a]})`)}const o=Object.assign(Object.assign({},n),{model:t.model,tools:t.tools,toolConfig:t.toolConfig,systemInstruction:t.systemInstruction,cachedContent:t});return new V(this.apiKey,o,s)}}const p=class p{constructor(){S(this,"genAI",null);S(this,"model",null);const t="production-api-key";this.genAI=new be(t),this.model=this.genAI.getGenerativeModel({model:"gemini-2.0-flash",generationConfig:{responseMimeType:"application/json"}})}static getInstance(){return p.instance||(p.instance=new p),p.instance}async analyzeLogo(t,n){if(!this.model)return this.getMockAnalysis(n);try{const s=`
                Analyze logo for "${n}". Identify trademark risks, copyright issues, or visual mimics of famous brands.
                Return JSON schema: { "isSafe": boolean, "riskLevel": "Low"|"Medium"|"High", "similarBrands": string[], "message": string }
            `,i=await this.fileToGenerativePart(t),a=await(await this.model.generateContent([s,i])).response;return JSON.parse(a.text())}catch(s){return console.error("AI Analysis Failed:",s),{isSafe:!1,riskLevel:"Medium",message:"Intelligence gathering interrupted. Proceed with caution."}}}async analyzeFraudReport(t){if(!this.model)return{severity:"Medium",urgency:5,summary:"AI node offline. Standard classification applied.",tamil_summary:"AI முடக்கம். நிலையான வகைப்பாடு பயன்படுத்தப்பட்டது."};try{const n=`
                Role: Senior Municipal Auditor for Tamil Nadu (TN-MBNR).
                Task: Analyze this citizen fraud report: "${t.description}".
                
                TN State Law Compliance Risk Matrix:
                - CRITICAL: Violations of Tamil Nadu Public Health Act, 1939 (e.g., severe hygiene, adulteration) or extreme TN Shops & Establishments Act violations (e.g., severe safety hazards).
                - HIGH: FSSAI non-compliance, lack of TN Pollution Control Board (TNPCB) clearance, or trademark infringement of regional heritage brands (e.g., A2B, Saravana Bhavan).
                - MEDIUM: Location mismatch (>200m), failure to display Tamil name boards (mandated by TN Shops and Establishments Rules), or pending trade license renewal under TN District Municipalities Act.
                - LOW: General inquiries, formatting issues, or cosmetic non-compliance.

                Context: ${t.category||"General Business Compliance"}.

                Return JSON schema EXACTLY: { 
                  "severity": "Low"|"Medium"|"High"|"Critical", 
                  "urgency": number(1-10), 
                  "summary": "Concise professional summary in English citing potential TN law violations",
                  "tamil_summary": "Concise professional summary in Tamil (தமிழ்) citing potential TN law violations"
                }
            `,i=await(await this.model.generateContent(n)).response;return JSON.parse(i.text())}catch{return{severity:"High",urgency:7,summary:"Automated risk flag raised due to processing error.",tamil_summary:"தொழில்நுட்பக் கோளாறு காரணமாக தானியங்கி எச்சரிக்கை எழுப்பப்பட்டது."}}}async getChatResponse(t,n,s){if(!this.genAI)return"AI node offline. Standard automated response applied.";try{return(await(await this.genAI.getGenerativeModel({model:"gemini-2.0-flash",systemInstruction:`
                    You are the TrustReg TN Assistant (MBNR Platform).
                    Your purpose is to help citizens and merchants in Tamil Nadu, India.
                    The platform uses HMAC-SHA256 signed QR codes and Haversine geofencing (200m threshold) to prevent business fraud.
                    
                    Rules:
                    1. Be official, polite, and helpful.
                    2. Support both English and Tamil (தமிழ்). If asked in Tamil, reply in Tamil.
                    3. If asked about registration: Explain that merchants need a unique logo (checked by AI), shop location, and contact details.
                    4. If asked about "Location Mismatch": Explain it's a security feature ensuring the shop is where it claims to be.
                    5. If asked about "Expired": Explain QR codes refresh every 30 seconds for security.
                    6. Never provide legal advice, but summarize platform rules.
                    7. Keep responses concise and formatted with markdown.
                    8. Note: The user is currently on this URL path: ${s||"Unknown"}. Use this context to provide more relevant help.
                `}).startChat({history:n}).sendMessage(t)).response).text()}catch(i){return console.error("Chat Failed:",i),"Communication node disrupted. Please try again shortly."}}async getStrategicAdvice(t){if(!this.model)return{yieldOpportunity:"Strategic Yield analysis requires an active AI connection. Node offline.",riskAdvisory:"Local risk matrix dictates standard protocol adherence while grid is dark."};try{const n=`
                Role: Senior Municipal Data Scientist for Tamil Nadu.
                Task: Analyze this registry data and provide a concise strategic dashboard report.
                
                Current Nodes: ${t.length}
                Data dump: ${JSON.stringify(t.slice(0,10))}

                Return JSON schema EXACTLY: {
                  "yieldOpportunity": "1-2 sentence paragraph identifying positive growth or revenue potential in English.",
                  "riskAdvisory": "1-2 sentence paragraph identifying compliance risks or geographic vulnerabilities in English."
                }
            `,i=await(await this.model.generateContent(n)).response;return JSON.parse(i.text())}catch(n){return console.error("Strategic Advice Failed:",n),{yieldOpportunity:"Automated metrics indicate stable regional output.",riskAdvisory:"Elevated network noise prevented deep risk analysis."}}}async fileToGenerativePart(t){return{inlineData:{data:await new Promise(s=>{const i=new FileReader;i.onloadend=()=>s(i.result.split(",")[1]),i.readAsDataURL(t)}),mimeType:t.type}}}getMockAnalysis(t){const s=["starbucks","a2b","dominos","kfc"].some(i=>t.toLowerCase().includes(i));return{isSafe:!s,riskLevel:s?"High":"Low",similarBrands:s?["Famous Brand Mimic"]:[],message:s?"High similarity to protected trademark identified.":"Brand signature appears unique."}}};S(p,"instance");let T=p;const Le=T.getInstance();export{Le as a};
