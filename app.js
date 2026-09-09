const $ = (id) => document.getElementById(id);
const PROFILE_KEY = 'cidadao-claro-profile-v4';
const HISTORY_KEY = 'cidadao-claro-history-v4';

const MONTHS = { janeiro:0, fevereiro:1, marco:2, março:2, abril:3, maio:4, junho:5, julho:6, agosto:7, setembro:8, outubro:9, novembro:10, dezembro:11 };

function esc(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
function normalizeAccents(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();}
function normalize(s){return String(s||'').replace(/\r\n?/g,'\n').replace(/[ \t]+/g,' ').replace(/\n{3,}/g,'\n\n').trim();}
function lines(s){return normalize(s).split('\n').map(x=>x.trim()).filter(Boolean);}
function uniq(arr){return [...new Map((arr||[]).filter(Boolean).map(v=>[String(v).toLowerCase(),v])).values()];}
function listHtml(items,empty='Não localizado no edital.'){return items?.length?items.map(x=>`<li>${esc(x)}</li>`).join(''):`<li>${esc(empty)}</li>`;}
function clamp(n,a,b){return Math.max(a,Math.min(b,n));}
function dateKey(d){return d?`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`:null;}
function fmtDate(d){return d.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric'});}
function fmtRange(start,end){return end&&dateKey(start)!==dateKey(end)?`${fmtDate(start)} até ${fmtDate(end)}`:fmtDate(start);}

const AREA_TAXONOMY = [
 {canonical:'Design de Produto', aliases:['designer de produto','product designer','design de produto'], related:['UX Designer','UI Designer','Product Designer','Designer de Interação','Service Designer','UX Researcher','Design Digital','Design Estratégico'], signals:['figma','prototip','ux','ui','pesquisa com usuários','pesquisa com utilizadores','discovery','produto digital','design system','usabilidade','jornada do usuário','wireframe']},
 {canonical:'UX / Experiência do Usuário', aliases:['ux','ux designer','experiencia do usuario','experiência do usuário','user experience'], related:['Product Designer','UI Designer','UX Researcher','Service Designer','Designer de Interação'], signals:['usabilidade','arquitetura da informação','jornada','protótipo','wireframe','teste com usuários']},
 {canonical:'Tecnologia / Desenvolvimento', aliases:['desenvolvedor','developer','software engineer','engenheiro de software','programador','ti','tecnologia'], related:['Analista de Sistemas','Desenvolvedor Web','Engenheiro de Software','DevOps','Dados / BI'], signals:['javascript','python','java','sql','api','cloud','backend','frontend','git','sistema','programação']},
 {canonical:'Dados / Analytics', aliases:['dados','data analyst','analista de dados','cientista de dados','bi','business intelligence'], related:['Analista de BI','Cientista de Dados','Engenheiro de Dados','Analista de Sistemas','Estatístico'], signals:['sql','python','power bi','tableau','estatística','analytics','banco de dados','dashboard','machine learning']},
 {canonical:'Comunicação / Conteúdo', aliases:['jornalista','redator','copywriter','comunicacao','comunicação','conteudo','conteúdo'], related:['Analista de Comunicação','Assessor de Comunicação','Social Media','Redator','Copywriter'], signals:['redação','comunicação institucional','mídias sociais','conteúdo','campanha','imprensa']},
 {canonical:'Marketing', aliases:['marketing','growth','marketing digital','analista de marketing'], related:['Growth Analyst','Analista de Comunicação','Social Media','CRM','Publicidade'], signals:['seo','crm','campanha','performance','mídia paga','analytics','growth','leads']},
 {canonical:'Administração / Gestão', aliases:['administrador','administração','gestão','gestor','business analyst'], related:['Analista Administrativo','Analista de Processos','Gestor de Projetos','Analista de Planejamento'], signals:['processos','planejamento','gestão','indicadores','orçamento','compras','contratos']},
 {canonical:'Direito', aliases:['advogado','direito','juridico','jurídico','procurador'], related:['Analista Jurídico','Assistente Jurídico','Procurador','Consultor Legislativo'], signals:['legislação','contrato','parecer','processo','petição','jurisprudência']},
 {canonical:'Educação / Pedagogia', aliases:['professor','pedagogo','pedagogia','educacao','educação','docencia','docência'], related:['Professor','Pedagogo','Orientador Educacional','Analista Educacional'], signals:['ensino','aprendizagem','pedagógico','sala de aula','educação','currículo']},
 {canonical:'Engenharia', aliases:['engenheiro','engenharia'], related:['Engenheiro Civil','Engenheiro de Produção','Engenheiro Mecânico','Analista de Engenharia'], signals:['engenharia','projeto técnico','obra','produção','processos','cálculo']},
 {canonical:'Finanças / Contabilidade', aliases:['contador','contabilidade','financeiro','financas','finanças','economia','economista'], related:['Analista Financeiro','Contador','Economista','Auditor'], signals:['contábil','financeiro','orçamento','tributário','balanço','auditoria']}
];

function getProfile(){return {area:$('profileArea').value.trim(),details:$('profileDetails').value.trim(),education:$('profileEducation').value,state:$('profileState').value.trim().toUpperCase(),experience:$('profileExperience').value,modality:$('profileModality').value};}
function setProfile(p={}){$('profileArea').value=p.area||'';$('profileDetails').value=p.details||'';$('profileEducation').value=p.education||'';$('profileExperience').value=p.experience||'';$('profileState').value=p.state||'';$('profileModality').value=p.modality||'';renderProfileSummary();refreshAreaMap();}
function loadProfile(){try{setProfile(JSON.parse(localStorage.getItem(PROFILE_KEY)||'{}'));}catch{setProfile({});}}
function saveProfile(){localStorage.setItem(PROFILE_KEY,JSON.stringify(getProfile()));renderProfileSummary();refreshAreaMap();$('contestStatus').textContent='Perfil salvo neste navegador.';$('contestStatus').className='status success';}
function clearProfile(){localStorage.removeItem(PROFILE_KEY);setProfile({});$('areaMap').classList.add('hidden');}
function renderProfileSummary(){const p=getProfile();$('profileSummary').innerHTML=[['Área',p.area||'Não informada'],['Escolaridade',p.education||'Não informada'],['Experiência',p.experience?`${p.experience} ano(s)`:'Não informada'],['UF/região',p.state||'Não informada'],['Modalidade',p.modality||'Ampla concorrência']].map(([a,b])=>`<div class="profile-chip"><small>${esc(a)}</small><b>${esc(b)}</b></div>`).join('');}

function inferArea(area,details=''){
 const q=normalizeAccents(`${area} ${details}`); const matches=[];
 for(const item of AREA_TAXONOMY){let score=0,hits=[];for(const a of item.aliases){if(q.includes(normalizeAccents(a))){score+=50;hits.push(a);}}for(const s of item.signals){if(q.includes(normalizeAccents(s))){score+=8;hits.push(s);}}if(score)matches.push({...item,score:clamp(score,0,98),hits:uniq(hits)});}
 matches.sort((a,b)=>b.score-a.score);
 if(!matches.length)return {primary:{canonical:area||'Área não identificada',score:0,related:[]},matches:[],related:[]};
 const primary=matches[0];const related=uniq([...primary.related,...matches.slice(1,3).flatMap(x=>[x.canonical,...x.related.slice(0,2)])]).slice(0,9);
 return {primary,related,matches};
}
function refreshAreaMap(){const p=getProfile();if(!p.area){$('areaMap').classList.add('hidden');renderProfileAIMap(null);return;}const map=inferArea(p.area,p.details);renderAreaMap(map);}
function renderAreaMap(map){$('areaMap').innerHTML=`<div class="area-map-head"><span class="ai-badge">✦ IA LOCAL</span><b>${esc(map.primary.canonical)}</b></div><div class="chip-row">${map.related.map(x=>`<span>${esc(x)}</span>`).join('')}</div><small>O motor cruza área, descrição profissional e sinais de função. Nada é enviado para um servidor.</small>`;$('areaMap').classList.remove('hidden');renderProfileAIMap(map);}
function renderProfileAIMap(map){if(!$('profileAIMap'))return;if(!map?.primary){$('profileAIMap').innerHTML='';return;}$('profileAIMap').innerHTML=`<div class="ai-section"><div><span class="ai-badge">✦ IA LOCAL · PRONTA</span><h3>${esc(map.primary.canonical)}</h3><p>Áreas correlatas que entrarão no cruzamento com os cargos do edital.</p></div><div class="chip-row large">${map.related.map(x=>`<span>${esc(x)}</span>`).join('')}</div></div>`;}

function extractSection(text,startRegex,endRegex=/\n\s*\d+\.\s+[A-ZÁÉÍÓÚÀÃÕÇ]/){const t=normalize(text);const m=t.match(startRegex);if(!m)return '';const start=m.index+m[0].length;const tail=t.slice(start);const e=tail.search(endRegex);return tail.slice(0,e<0?tail.length:e).trim();}

function parseSingleDate(raw){let m=raw.match(/(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})/);if(m){const y=+m[3]<100?2000+ +m[3]:+m[3];const d=new Date(y,+m[2]-1,+m[1]);return Number.isNaN(d.getTime())?null:d;}m=raw.toLowerCase().match(/(\d{1,2})\s+de\s+([a-zçãõáéíóú]+)\s+de\s+(\d{4})/);if(m&&MONTHS[m[2]]!==undefined){const d=new Date(+m[3],MONTHS[m[2]],+m[1]);return Number.isNaN(d.getTime())?null:d;}return null;}
const DATE_TOKEN='(?:\\d{1,2}[\\/-]\\d{1,2}[\\/-]\\d{2,4}|\\d{1,2}\\s+de\\s+[A-Za-zçãõáéíóú]+\\s+de\\s+\\d{4})';
function datesFromBlock(block){
 const rangeRe=new RegExp(`(${DATE_TOKEN})\\s*(?:a|até|ate|[-–])\\s*(?:23h59min(?: do dia)?|23h59(?: do dia)?|\\d{1,2}h(?:\\d{2})?(?: do dia)?)?\\s*(${DATE_TOKEN})`,'i');
 const r=block.match(rangeRe);
 const singles=[...block.matchAll(new RegExp(DATE_TOKEN,'gi'))].map(m=>m[0]);
 const dates=singles.map(parseSingleDate).filter(Boolean);
 if(r){const a=parseSingleDate(r[1]),b=parseSingleDate(r[2]);if(a&&b)return {start:a,end:b};}
 if(dates[0])return {start:dates[0],end:dates[0]};
 return null;
}
function extractTimeline(text){
 const t=normalize(text); const pos=normalizeAccents(t).lastIndexOf('anexo iv cronograma'); if(pos<0)return [];
 const cron=t.slice(pos,pos+8000); const cr=normalizeAccents(cron); const out=[];
 function after(regex,limit=900){const m=regex.exec(cr);return m?{m,block:cr.slice(m.index,m.index+limit),orig:cron.slice(m.index,m.index+limit)}:null;}
 function dates(block){return [...block.matchAll(new RegExp(DATE_TOKEN,'gi'))].map(x=>parseSingleDate(x[0])).filter(Boolean);}
 const pub=after(/publicacao do edital\s*/i);if(pub){const ds=dates(pub.block).slice(0,1);if(ds[0])out.push({label:'Publicação do edital',start:ds[0],end:ds[0],evidence:pub.orig.slice(0,180),source:'Anexo IV — Cronograma'});}
 const ins=after(/periodo de inscricao[\s\S]{0,220}/i);if(ins){const ds=dates(ins.block).slice(0,2);if(ds[0])out.push({label:'Inscrições',start:ds[0],end:ds[1]||ds[0],evidence:ins.orig.slice(0,220),source:'Anexo IV — Cronograma'});}
 const parcial=after(/divulgacao do resultado parcial\s*/i);if(parcial){const ds=dates(parcial.block).slice(0,1);if(ds[0])out.push({label:'Resultado parcial',start:ds[0],end:ds[0],evidence:parcial.orig.slice(0,180),source:'Anexo IV — Cronograma'});}
 const rec=after(/interposicao de recursos[\s\S]{0,180}/i);if(rec){const ds=dates(rec.block).slice(0,2);if(ds[0])out.push({label:'Recursos',start:ds[0],end:ds[1]||ds[0],evidence:rec.orig.slice(0,200),source:'Anexo IV — Cronograma'});}
 const apos=after(/divulgacao do resultado apos recurso e convocacao[\s\S]{0,180}/i);if(apos){const ds=dates(apos.block).slice(0,1);if(ds[0])out.push({label:'Resultado após recurso / convocação',start:ds[0],end:ds[0],evidence:apos.orig.slice(0,220),source:'Anexo IV — Cronograma'});}
 const het=after(/realizacao da avaliacao dos candidatos[\s\S]{0,220}?heteroidentificacao/i,700);if(het){const rm=het.block.match(new RegExp(`(${DATE_TOKEN})\\s*(?:a|ate|[-–])\\s*(${DATE_TOKEN})`,'i'));const all=dates(het.block);const a=rm?parseSingleDate(rm[1]):all[0];const b=rm?parseSingleDate(rm[2]):(all[1]||a);if(a)out.push({label:'Heteroidentificação / avaliação PCD',start:a,end:b||a,evidence:het.orig.slice(0,240),source:'Anexo IV — Cronograma'});}
 const rc=after(/divulgacao do resultado da comissao[\s\S]{0,180}/i);if(rc){const all=dates(rc.block);const rm=rc.block.match(new RegExp(`(${DATE_TOKEN})\\s*(?:a|ate|[-–])\\s*(${DATE_TOKEN})`,'i'));const a=rm?parseSingleDate(rm[1]):all[0];const b=rm?parseSingleDate(rm[2]):(all[1]||a);if(a)out.push({label:'Resultado da comissão',start:a,end:b||a,evidence:rc.orig.slice(0,200),source:'Anexo IV — Cronograma'});}
 const rr=after(/solicitacao de recurso contra o resultado[\s\S]{0,220}/i);if(rr){const ds=dates(rr.block).slice(0,1);if(ds[0])out.push({label:'Recurso da heteroidentificação / avaliação PCD',start:ds[0],end:ds[0],evidence:rr.orig.slice(0,220),source:'Anexo IV — Cronograma'});}
 const fin=after(/divulgacao do resultado final\s*/i);if(fin){const ds=dates(fin.block).slice(0,1);if(ds[0])out.push({label:'Resultado final',start:ds[0],end:ds[0],evidence:fin.orig.slice(0,160),source:'Anexo IV — Cronograma'});}
 return out.filter((e,i,a)=>i===a.findIndex(x=>x.label===e.label)).sort((a,b)=>a.start-b.start);
}
function timelineStatus(item){const now=new Date();now.setHours(0,0,0,0);const end=new Date(item.end||item.start);end.setHours(23,59,59,999);const start=new Date(item.start);start.setHours(0,0,0,0);if(end<now)return ['past','Encerrado'];if(start<=now&&end>=now)return ['today','Hoje'];return ['future','Próximo'];}

function extractRequirements(text){
 const t=normalize(text); const out=[];
 for(const m of t.matchAll(/4\.8\.(\d+)\.\s*([\s\S]*?)(?=4\.8\.\d+\.|4\.9\.)/gi)){
   let clean=m[2].replace(/\s+/g,' ').trim();
   clean=clean.split(/FUNDAÇÃO MUNICIPAL|da Lei Municipal|PROCESSO SELETIVO SIMPLIFICADO,?\s+nos termos/i)[0].trim();
   clean=clean.replace(/https?:\/\/\S+/gi,'').replace(/\s{2,}/g,' ').replace(/[;:.-]+$/,'');
   if(clean.length>3&&clean.length<500)out.push(clean);
 }
 return uniq(out).slice(0,16);
}
function extractStages(text){
 const t=normalize(text); const out=[];
 for(const m of t.matchAll(/3\.1\.(\d+)\.\s*([\s\S]*?)(?=3\.1\.\d+\.|4\.\s+DA INSCRIÇÃO)/gi)){const clean=m[2].replace(/\s+/g,' ').trim().replace(/[;.]\s*$/,'');if(clean.length>10&&clean.length<550)out.push(clean);}
 return uniq(out).slice(0,8);
}
function extractQuotaSection(text,num,nextNum){
 const t=normalize(text); const a=new RegExp(`\\b${num}\\.\\s+DA[S]?\\s+VAGAS[^\\n]{0,120}(?:NEGROS|PESSOAS COM DEFICI[EÊ]NCIA)[\\s\\S]*?`,'i').exec(t);
 if(!a)return '';
 const start=a.index; const next=new RegExp(`\\b${nextNum}\\.\\s+DA\\b`,'i').exec(t.slice(a.index+a[0].length)); const end=next?a.index+a[0].length+next.index:Math.min(t.length,start+9000);
 return t.slice(start,end);
}
function quotaAnalysis(text,p){
 const t=normalize(text); const found=[]; if(/pret[oa]s?|pard[oa]s?|negros?/i.test(t))found.push('PPP'); if(/pessoas? com defici[eê]ncia|\bpcd\b/i.test(t))found.push('PCD'); if(/ind[ií]genas?/i.test(t))found.push('INDÍGENAS'); if(/quilombolas?/i.test(t))found.push('QUILOMBOLAS');
 const selected=p.modality; if(!selected)return {found,focus:null};
 let section='',label=''; if(selected==='PCD'){section=extractQuotaSection(t,'7','8');label='PCD';} else if(selected==='PPP'){section=extractQuotaSection(t,'8','9');label='PPP';} else {section=extractQuotaSection(t,'8','9');label=selected;}
 const norm=normalizeAccents(section);const items=[];
 if(label==='PCD'){
  const pm=section.match(/(\d{1,3})\s*%/); const percent=pm?`${pm[1]}%`:null; if(percent)items.push({icon:'◫',title:`Reserva PCD: ${percent}`,detail:'Percentual encontrado diretamente no capítulo de pessoas com deficiência.'});
  if(/declarar o tipo de deficiencia/.test(norm))items.push({icon:'☑',title:'Na inscrição',detail:'O candidato deve declarar o tipo de deficiência.'});
  if(/laudo medico/.test(norm))items.push({icon:'📄',title:'Laudo médico',detail:'O edital exige laudo médico com especificidade, grau ou nível da deficiência, referência ao CID-10 e provável causa; também menciona a Carteira de Identidade Diferenciada como alternativa indicada no item 7.4.'});
  if(/avaliacao/.test(norm))items.push({icon:'◷',title:'Avaliação',detail:'O edital prevê avaliação para os candidatos PCD.'});
 } else if(label==='PPP'){
  const pm=section.match(/(\d{1,3})\s*%/); const percent=pm?`${pm[1]}%`:null; if(percent)items.push({icon:'◫',title:`Reserva PPP: ${percent}`,detail:'Percentual encontrado diretamente no capítulo de vagas reservadas a negros.'});
  if(/marcar a opcao do tipo de vaga/.test(norm))items.push({icon:'☑',title:'Na inscrição',detail:'É necessário marcar o tipo de vaga no formulário de inscrição online.'});
  if(/autodeclaracao/.test(norm))items.push({icon:'☑',title:'Autodeclaração',detail:'O edital determina marcar a opção de autodeclaração para candidato preto ou pardo.'});
  if(/heteroidentificacao/.test(norm))items.push({icon:'◷',title:'Heteroidentificação',detail:'A autodeclaração será confirmada por procedimento de heteroidentificação; a convocação ocorre por e-mail ou pelo site.'});
  if(!/laudo|certidao|documento especifico|anexo/.test(norm))items.push({icon:'!',title:'Documento específico da PPP',detail:'O capítulo de PPP analisado não exige anexação de laudo ou certidão específica. O que ele exige expressamente é a opção de vaga e a autodeclaração, além da etapa de heteroidentificação quando convocado.'});
 } else {
  items.push({icon:'?',title:'Modalidade encontrada',detail:`A modalidade ${label} foi detectada, mas este edital não forneceu dados suficientes no capítulo localizado para uma lista específica de documentos.`});
 }
 return {found,focus:{found:found.includes(selected),items,section:section.slice(0,5000)}};
}

function roleCandidates(text){
 const candidates=[];
 const patterns=[
  /\bcargo\s+(?:efetivo\s+)?de\s+([A-Za-zÀ-ú][A-Za-zÀ-ú\s-]{3,90}?)(?=\s+(?:no|na|nos|nas|do|da|dos|das|para|e|que)\b|[.,;])/gi,
  /\bcargo\s*[:\-]\s*([A-Za-zÀ-ú][A-Za-zÀ-ú\s-]{3,90}?)(?=[.;])/gi
 ];
 for(const re of patterns)for(const m of text.matchAll(re)){const c=m[1].replace(/\s+/g,' ').trim();if(c.length>3)candidates.push(c);}
 const known=/\b(?:Agente de Apoio Escolar|Analista(?: de [A-Za-zÀ-ú ]{2,55})?|Assistente(?: de [A-Za-zÀ-ú ]{2,55})?|Designer de Produto|Product Designer|UX Designer|UI Designer|Engenheiro(?: de [A-Za-zÀ-ú ]{2,55})?|Professor(?: de [A-Za-zÀ-ú ]{2,55})?|Técnico(?: de [A-Za-zÀ-ú ]{2,55})?|Contador|Advogado|Administrador|Psicólogo|Jornalista|Desenvolvedor|Auditor|Coordenador|Especialista)\b/gi;
 for(const m of text.matchAll(known))candidates.push(m[0].replace(/\s+/g,' ').trim());
 return uniq(candidates).filter(x=>/[A-Za-zÀ-ú]{3,}/.test(x)&&x.length<110).slice(0,30);
}
function semanticAreaMatchLocal(text,p){
 const inferred=inferArea(p.area,p.details); const candidates=roleCandidates(text); const roleScores=[];
 const profileTerms=uniq([p.area,p.details,inferred.primary.canonical,...inferred.related]).map(normalizeAccents).filter(x=>x.length>2);
 const taxonomyTerms=[...inferred.primary.aliases,...inferred.primary.related,...inferred.primary.signals].map(normalizeAccents);
 for(const c of candidates){const cn=normalizeAccents(c);let hit=0;for(const term of profileTerms){if(cn.includes(term))hit++;}let signal=0;for(const term of taxonomyTerms){if(cn.includes(term))signal++;}const percent=clamp(Math.round(8+hit*24+signal*16),0,99);roleScores.push({label:c,percent});}
 // Always show the exact/related occupational labels found inside the edital, even when the title is only in a table.
 const allText=normalizeAccents(text); for(const term of [inferred.primary.canonical,...inferred.related]){if(term&&allText.includes(normalizeAccents(term)))roleScores.push({label:term,percent:70});}
 return {inferred,roles:uniq(roleScores.map(x=>JSON.stringify(x))).map(JSON.parse).sort((a,b)=>b.percent-a.percent).slice(0,8),aiUsed:true,engine:'IA local híbrida'};
}
function generalExtract(text){
 const t=normalize(text),ls=lines(t);
 const title=(t.match(/EDITAL[^\n]{0,90}?\b20\d{2}\b/i)?.[0]||'Edital').replace(/\s+/g,' ').trim();
 const salary=uniq([...t.matchAll(/R\$\s*\d{1,3}(?:\.\d{3})*(?:,\d{2})?/gi)].map(m=>m[0]));
 const totalVac=(t.match(/(?:[-–—]\s*)?(\d{1,5})\s+vagas\b/i)||[])[1];
 const vacancyBreak=[];const table=t.match(/(\d{1,5})\s+(\d{1,5})\s+(\d{1,5})\s+(\d{1,5})\s+Recursos(?: orçamentários)?/i);if(table)vacancyBreak.push(`Total ${table[1]} · Ampla ${table[2]} · PCD ${table[3]} · PPP ${table[4]}`);
 const education=uniq((t.match(/(?:Certificado de Conclusão do [^.]{3,180}\.|Ensino (?:Fundamental|Médio|Técnico|Superior)[^.]{0,120}\.|Graduação[^.]{0,120}\.|Bacharelado[^.]{0,120}\.|Licenciatura[^.]{0,120}\.)/gi)||[])).slice(0,6);
 const stages=extractStages(text);const docs=extractRequirements(text);const fee=/inscrição[\s\S]{0,80}gratuita/i.test(t)?['Gratuita']:(uniq([...t.matchAll(/taxa de inscri[cç][aã]o[^\n.]*/gi)].map(m=>m[0])).slice(0,3));
 const dates=extractTimeline(text);const cotas=uniq([/pret[oa]s?|pard[oa]s?|negros?/i.test(t)?'PPP':'',/pessoas? com defici[eê]ncia|\bpcd\b/i.test(t)?'PCD':'',/ind[ií]genas?/i.test(t)?'INDÍGENAS':'',/quilombolas?/i.test(t)?'QUILOMBOLAS':'']);
 const cargo=roleCandidates(text);const purpose=(t.match(/DO OBJETO[\s\S]{0,500}?Trata-se de ([^.]{20,280}\.)/i)||[])[1]||`O edital organiza uma seleção com ${totalVac||'vagas'} e define inscrição, documentos e critérios de classificação.`;
 return {title,overview:purpose.replace(/\s+/g,' ').trim(),salary,vacancies:totalVac?[`${totalVac} vagas`,...vacancyBreak]:vacancyBreak,education,stages,docs,fee,dates,cotas,cargo};
}
function explainGeneral(g,p){
 const action=[];
 if(g.dates.some(d=>d.label==='Inscrições'))action.push('Confira se o período de inscrição ainda está aberto e faça a inscrição apenas pelo canal indicado no edital.');
 if(g.docs.length)action.push(`Separe os ${g.docs.length} documentos identificados no item de inscrição e confira formato e validade.`);
 if(g.stages.length)action.push('Observe quais etapas eliminam e quais apenas classificam; isso muda o risco de eliminação.');
 if(g.dates.some(d=>/Recurso/i.test(d.label)))action.push('Guarde as datas de recurso: o edital considera a perda do prazo como impeditiva.');
 if(p.modality)action.push(`No seu caso, leia primeiro o bloco da modalidade ${p.modality}: ele define como você concorre e quais provas/documentos específicos se aplicam.`);
 return uniq(action).slice(0,5);
}
function personalizedVerdict(g,p,areaAI){
 const area=areaAI.inferred.primary; const roles=areaAI.roles; const selected=roles.find(r=>r.percent>=70);
 if(!roles.length)return `O edital analisado não apresenta cargo claramente relacionado a ${p.area||'sua área'}. O melhor caminho é conferir o quadro de cargos antes de considerar este processo uma oportunidade profissional.`;
 if(selected)return `Há sinal de proximidade entre seu perfil e “${selected.label}”. Isso é uma triagem de linguagem; ainda é preciso conferir escolaridade, atribuições e demais requisitos do cargo.`;
 return `Seu perfil foi interpretado como ${area.canonical}, mas os cargos capturados neste edital não mostram proximidade suficiente com essa área. Por isso, a compatibilidade profissional é baixa, mesmo que outras condições do edital coincidam.`;
}
function scoreProfile(g,p,areaAI){let score=25;const reasons=[],warnings=[];const edu=normalizeAccents(g.education.join(' '));if(p.education&&edu.includes(normalizeAccents(p.education))){score+=20;reasons.push('Sua escolaridade aparece no texto do edital.');}else if(p.education)warnings.push('A escolaridade do seu perfil não foi localizada de forma segura.');if(p.state&&normalizeAccents(g.overview+' '+g.title).includes(normalizeAccents(p.state))){score+=5;reasons.push(`A região ${p.state} aparece na identificação do processo.`);}const top=areaAI.roles[0];if(top?.percent>=78){score+=25;reasons.push(`Há alta proximidade de linguagem com “${top.label}”.`);}else if(top?.percent>=60){score+=12;reasons.push('Há algum cargo ou área correlata no texto.');}else warnings.push('Não foi identificado cargo suficientemente próximo da sua área.');if(p.modality){if(g.cotas.includes(p.modality)){score+=10;reasons.push(`A modalidade ${p.modality} está presente no edital.`);}else warnings.push(`A modalidade ${p.modality} não foi localizada com segurança.`);}return {score:clamp(Math.round(score),0,100),band:score>=80?'Alta':score>=60?'Média':'Baixa',reasons,warnings};}
function contestAnalyze(text,p){const g=generalExtract(text);const areaAI=semanticAreaMatchLocal(text,p);const quota=quotaAnalysis(text,p);const ps=scoreProfile(g,p,areaAI);const checklist=explainGeneral(g,p);checklist.push('Conferir no edital oficial o item literal do cargo antes de decidir pela inscrição.');return {general:g,profile:{...ps,areaAI,quota,checklist:uniq(checklist)},simpleExplanation:personalizedVerdict(g,p,areaAI),disclaimer:'Este radar explica e organiza o edital; não substitui o edital oficial, seus anexos ou os atos posteriores da banca.'};}

function renderAreaAI(ai,p){const primary=ai.inferred?.primary;const roleHtml=ai.roles.length?`<div class="role-list">${ai.roles.slice(0,6).map((r,i)=>`<div class="role-item"><div><span class="rank">${i+1}</span><b>${esc(r.label)}</b></div><strong>${r.percent}%</strong></div>`).join('')}</div>`:`<div class="empty-state">Nenhum cargo do edital foi reconhecido como próximo da sua área. Isso é diferente de “não existe cargo”: confira o quadro de cargos e anexos.</div>`;return `<div class="ai-panel"><div class="ai-panel-head"><div><span class="ai-badge">✦ ${esc(ai.engine||'IA LOCAL')}</span><h3>Como sua área foi interpretada</h3><p>${esc(primary?.canonical||p.area||'Área não identificada')}</p></div><span class="ai-main-area">${ai.roles.length?'Cargos correlatos':'Sem correlação suficiente'}</span></div>${primary?.related?.length?`<div class="chip-row large">${primary.related.map(x=>`<span>${esc(x)}</span>`).join('')}</div>`:''}${roleHtml}<div class="ai-note">Percentual = proximidade de linguagem. Não é chance de aprovação.</div></div>`;}
function renderTimeline(items){if(!items.length)return '<div class="empty-state">O sistema não encontrou um Anexo IV / Cronograma suficientemente claro. Nada foi inferido de datas soltas do restante do edital.</div>';return `<div class="timeline">${items.map(i=>{const[status,label]=timelineStatus(i);return `<div class="timeline-item ${status}"><div class="timeline-date"><strong>${fmtDate(i.start)}</strong>${i.end&&dateKey(i.end)!==dateKey(i.start)?`<span>até ${fmtDate(i.end)}</span>`:''}</div><div class="timeline-dot"></div><div class="timeline-body"><div class="timeline-label"><b>${esc(i.label)}</b><span class="status-pill ${status}">${label}</span></div><p>${esc(i.evidence.slice(0,220))}</p></div></div>`;}).join('')}</div>`;}
function renderQuota(q,p){const tags=q.found.map(x=>`<span class="tag">${esc(x)}</span>`).join(' ');if(!q.focus)return `<article class="result-card quota-card"><h3>🏷️ Sua modalidade</h3><div class="tag-row">${tags||'<span class="muted">Nenhuma modalidade de reserva detectada.</span>'}</div><div class="empty-state">Selecione uma modalidade no perfil para receber os requisitos específicos.</div></article>`;return `<article class="result-card quota-card"><h3>🏷️ Sua modalidade: ${esc(p.modality)}</h3><div class="tag-row">${tags}</div><div class="quota-focus-head"><span class="quota-selected">Leitura específica</span><b>${q.focus.found?'Encontrada no edital':'Não localizada'}</b></div><div class="quota-docs">${q.focus.items.map(i=>`<div class="quota-item"><span class="quota-icon">${i.icon}</span><div><b>${esc(i.title)}</b><p>${esc(i.detail)}</p></div></div>`).join('')}</div><div class="callout">A lista acima usa apenas o que foi localizado no capítulo da modalidade. Quando o edital não pede um documento específico, isso aparece explicitamente.</div></article>`;}
function renderContest(r){const g=r.general,p=r.profile;const next=g.dates.find(x=>timelineStatus(x)[0]==='future');const stats=[['Vagas',g.vacancies.length?g.vacancies.join(' · '):'Não identificadas'],['Remuneração',g.salary.length?g.salary.slice(0,2).join(' · '):'Não identificada'],['Taxa',g.fee.length?g.fee[0]:'Não localizada'],['Cargos capturados',g.cargo.length?g.cargo.join(' · '):'Não localizado']];$('contestResult').innerHTML=`<div class="result-head"><div><span class="eyebrow">RADAR PERSONALIZADO</span><h2>${esc(g.title)}</h2><p>${esc(r.simpleExplanation)}</p></div><button class="secondary" onclick="window.print()">Imprimir</button></div><section class="simple-hero"><div><span class="eyebrow">EM PORTUGUÊS CLARO</span><h3>O que este edital quer fazer?</h3><p>${esc(g.overview)}</p></div><div class="simple-steps">${r.profile.checklist.slice(0,3).map((x,i)=>`<div><span>${i+1}</span><p>${esc(x)}</p></div>`).join('')}</div></section><section class="score-hero"><div class="score-circle">${p.score}</div><div><span class="eyebrow">COMPATIBILIDADE INDICATIVA</span><h3>${esc(p.band)}</h3><p>${esc(personalizedVerdict(g,getProfile(),p.areaAI))}</p></div>${next?`<div class="next-deadline"><small>PRÓXIMO PRAZO</small><b>${esc(next.label)}</b><span>${fmtRange(next.start,next.end)}</span></div>`:''}</section><div class="mini-stat-grid">${stats.map(([a,b])=>`<div class="mini-stat"><small>${esc(a)}</small><b>${esc(b)}</b></div>`).join('')}</div><div class="primary-grid"><article class="result-card"><h3>🧠 Seu perfil x edital</h3>${renderAreaAI(p.areaAI,getProfile())}<div class="split-box"><div><span class="list-title">O que joga a favor</span><ul>${listHtml(p.reasons,'Nenhum ponto positivo seguro.')}</ul></div><div><span class="list-title">O que exige atenção</span><ul>${listHtml(p.warnings,'Nenhum alerta automático.')}</ul></div></div></article><article class="result-card"><h3>📅 Datas que realmente importam</h3>${renderTimeline(g.dates)}</article></div><div class="result-grid"><article class="result-card"><h3>🎯 Requisitos e como funciona</h3><p class="list-title">Escolaridade</p><ul>${listHtml(g.education)}</ul><p class="list-title">Etapas</p><ul>${listHtml(g.stages)}</ul></article><article class="result-card"><h3>🧾 Documentos para inscrição</h3><ul>${listHtml(g.docs,'Não foi localizado o bloco 4.8 de documentos.')}</ul></article>${renderQuota(p.quota,getProfile())}<article class="result-card"><h3>✅ O que você faria agora</h3><ol class="action-list">${r.profile.checklist.map(x=>`<li>${esc(x)}</li>`).join('')}</ol></article></div><div class="callout danger">${esc(r.disclaimer)}</div>`;$('contestResult').classList.remove('hidden');}

async function readFileText(file){if(file.type!=='application/pdf'&&!/\.pdf$/i.test(file.name))return file.text();const pdfjs=await import('https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/legacy/build/pdf.mjs');pdfjs.GlobalWorkerOptions.workerSrc='https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/legacy/build/pdf.worker.mjs';const buffer=await file.arrayBuffer();const pdf=await pdfjs.getDocument({data:new Uint8Array(buffer),enableScripting:false}).promise;const pages=[];for(let i=1;i<=pdf.numPages;i++){const page=await pdf.getPage(i);const content=await page.getTextContent({normalizeWhitespace:true});const rows=[];for(const item of content.items){const y=Math.round(item.transform?.[5]||0);const x=item.transform?.[4]||0;let row=rows.find(r=>Math.abs(r.y-y)<=3);if(!row){row={y,items:[]};rows.push(row);}row.items.push({x,str:item.str||''});}rows.sort((a,b)=>b.y-a.y);pages.push(rows.map(r=>r.items.sort((a,b)=>a.x-b.x).map(i=>i.str).join(' ').trim()).filter(Boolean).join('\n'));}const text=pages.join('\n\n').trim();if(!text)throw new Error('Este PDF parece ser escaneado como imagem.');return text;}
async function handleFileInput(inputId,textId,countId,statusId,max){const input=$(inputId),file=input.files?.[0];if(!file)return;const status=$(statusId);try{status.textContent=`Lendo “${file.name}”…`;status.className='status loading';const text=await readFileText(file);$(textId).value=text.slice(0,max);$(countId).textContent=`${Math.min(text.length,max).toLocaleString('pt-BR')} / ${max.toLocaleString('pt-BR')}`;$('fileStatus').innerHTML=`<span class="file-status-icon success-icon">✓</span><span><b>${esc(file.name)}</b><small>${text.length>max?'Texto carregado com limite de caracteres.':'Edital carregado e pronto para análise.'}</small></span>`;status.textContent='Arquivo pronto. Agora clique em “Encontrar o que importa”.';status.className='status success';$(textId).focus();}catch(e){console.error(e);status.textContent=`Não consegui ler “${file.name}”. ${e.message||'Tente outro arquivo ou cole o texto.'}`;status.className='status error';}finally{input.value='';}}
function saveHistory(data){try{const items=JSON.parse(localStorage.getItem(HISTORY_KEY)||'[]');items.unshift({id:Date.now(),title:data.general.title,data});localStorage.setItem(HISTORY_KEY,JSON.stringify(items.slice(0,10)));}catch{}}
function serviceAnalyzeLocal(text){const t=normalize(text),ls=lines(t),ss=t.split(/(?<=[.!?])\s+|\n+/).map(x=>x.trim()).filter(Boolean);return {title:ls[0]||'Serviço público',overview:ss.slice(0,2).join(' '),actions:uniq(ls.filter(l=>/comparecer|preencher|agendar|entregar|apresentar|enviar|protocolar|solicitar|acompanhar|retirar|pagar|assinar|cadastrar|acessar|anexar/i.test(l))).slice(0,7),documents:uniq(ls.filter(l=>/documento|documentos|rg|cpf|comprovante|certid[aã]o|diploma|hist[oó]rico|laudo|declara[cç][aã]o/i.test(l))).slice(0,7),deadlines:extractTimeline(text).map(x=>`${x.label}: ${fmtRange(x.start,x.end)}`),costs:uniq(t.match(/R\$\s*\d{1,3}(?:\.\d{3})*(?:,\d{2})?/gi)||[]),contacts:uniq([...t.matchAll(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/ig)].map(m=>m[0])),keyPoints:ss.filter(s=>/deve|precisa|necess[aá]rio|obrigat[oó]rio|prazo|taxa|gratuito|agendamento|atendimento/i.test(s)).slice(0,7),disclaimer:'A análise é informativa. Confirme tudo na fonte oficial.'};}

$('profileArea').addEventListener('input',refreshAreaMap);$('profileDetails').addEventListener('input',refreshAreaMap);$('saveProfile').addEventListener('click',saveProfile);$('clearProfile').addEventListener('click',clearProfile);
$('serviceText').addEventListener('input',()=>{$('serviceCount').textContent=`${$('serviceText').value.length.toLocaleString('pt-BR')} / 30.000`;});
$('contestText').addEventListener('input',()=>{$('contestCount').textContent=`${$('contestText').value.length.toLocaleString('pt-BR')} / 80.000`;});
$('serviceFile').addEventListener('change',()=>handleFileInput('serviceFile','serviceText','serviceCount','serviceStatus',30000));
$('contestFile').addEventListener('change',()=>handleFileInput('contestFile','contestText','contestCount','contestStatus',80000));
$('forceLocalAI').addEventListener('click',()=>alert('A IA do Cidadão Claro agora funciona em modo híbrido: primeiro interpreta sua profissão e áreas correlatas com um mapa semântico local; depois cruza esses conceitos com cargos e descrições do edital. Isso funciona sem API paga e sem depender de um modelo remoto.'));
$('contestAnalyze').addEventListener('click',()=>{const text=$('contestText').value.trim();if(!text){$('contestStatus').textContent='Carregue ou cole o edital antes de analisar.';$('contestStatus').className='status error';return;}const p=getProfile();localStorage.setItem(PROFILE_KEY,JSON.stringify(p));$('contestStatus').textContent='Interpretando sua área, explicando o edital e montando o cronograma…';$('contestStatus').className='status loading';try{const result=contestAnalyze(text,p);renderContest(result);saveHistory(result);$('contestStatus').textContent='Radar concluído: análise semântica, explicação e cronograma estruturado.';$('contestStatus').className='status success';}catch(err){console.error(err);$('contestStatus').textContent='Não foi possível montar o radar. Tente novamente com o texto integral do edital.';$('contestStatus').className='status error';}});

document.querySelectorAll('.nav-btn').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('.nav-btn').forEach(x=>x.classList.remove('active'));btn.classList.add('active');document.querySelectorAll('.tab-panel').forEach(x=>x.classList.remove('active'));$(btn.dataset.tab==='services'?'servicesTab':btn.dataset.tab==='contests'?'contestsTab':'profileTab').classList.add('active');}));
loadProfile();
