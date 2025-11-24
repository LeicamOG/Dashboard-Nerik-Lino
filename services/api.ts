import { DashboardData, PipelineStage, DateFilterState, TeamMember, ServiceData, CardSimple, CreativeMetrics, TrafficSource, WtsContact, WtsCardItem, WtsTag } from '../types';

// ============================================================================
// CONFIGURAÇÃO DE INTEGRAÇÃO
// ============================================================================
const WTS_BASE_URL = 'https://swebhooks.conversapp.com.br/webhook/webhook/dashboard-data';

// User ID Mapping
const USER_ID_MAP: Record<string, string> = {
    '63f93580-afaa-49c8-af82-4c531d91e02a': 'Nerik Lino',
    '697b8530-66ca-4ca6-8fc2-c9be22257ac9': 'Maria Eduarda',
    '21b6c240-c438-44f1-929c-dd75e147bc2f': 'Ketylaine',
    'f8c14041-5757-4d37-b3e4-6e9d8c3e9ec7': 'Italo',
    '954fb85f-aeb6-4747-a2cc-95fe2a8ae105': 'Eric Gabriel',
    '8282fef2-2c76-4fc8-a4cb-9194daf6a617': 'Eduarda Felipe'
};

// ============================================================================
// HELPERS
// ============================================================================

const getPipelineColor = (index: number): string => {
  const colors = ['#0ea5e9', '#84cc16', '#eab308', '#fed7aa', '#8b5cf6', '#db2777', '#16a34a', '#ef4444', '#737373'];
  return colors[index % colors.length] || '#404040';
};

const getInitials = (name: string): string => {
    if (!name || name.startsWith('Consultor') || name === 'Sem Responsável') return '?';
    const parts = name.trim().split(' ');
    const cleanParts = parts.filter(p => !['Dr.', 'Dra.', 'Sr.', 'Sra.'].includes(p));
    if (cleanParts.length === 0) return parts[0]?.substring(0, 2).toUpperCase() || '?';
    if (cleanParts.length === 1) return cleanParts[0].substring(0, 2).toUpperCase();
    return (cleanParts[0][0] + cleanParts[cleanParts.length - 1][0]).toUpperCase();
};

const normalizeStr = (str: string): string => {
    return str ? str.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "") : "";
};

const formatDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const parseDateSafe = (input: any): Date => {
    if (!input) return new Date(); // Fallback to TODAY if missing
    if (input instanceof Date) return input;

    // Numeric timestamp
    if (typeof input === 'number') {
        if (input < 10000000000) return new Date(input * 1000); // Unix seconds
        return new Date(input); // Ms
    }

    // String parsing
    if (typeof input === 'string') {
        // ISO format usually works
        const isoDate = new Date(input);
        if (!isNaN(isoDate.getTime())) return isoDate;
        
        // PT-BR dd/mm/yyyy
        const ptBrMatch = input.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
        if (ptBrMatch) {
             return new Date(parseInt(ptBrMatch[3]), parseInt(ptBrMatch[2]) - 1, parseInt(ptBrMatch[1]));
        }
    }
    return new Date();
};

const normalizeDate = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

const fillMissingDates = (
    dataMap: Map<string, { value: number; breakdown?: { name: string; value: number }[] }>,
    startDateStr: string, 
    endDateStr: string
): { date: string; value: number; breakdown: { name: string; value: number }[] }[] => {
    const result: { date: string; value: number; breakdown: { name: string; value: number }[] }[] = [];
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    
    // Safety cap to prevent browser freeze
    const MAX_DAYS = 3650; // Max 10 years
    
    let current = new Date(start);
    let safety = 0;

    // Se a data de início for muito antiga, ajusta para 2023 (início dos dados relevantes)
    // a menos que estejamos filtrando especificamente um ano anterior.
    if (current.getFullYear() < 2020) {
        current = new Date(2023, 0, 1);
    }
    // Clamp end if it's too far in future
    if (end.getFullYear() > 2030) {
        end.setFullYear(2030);
    }

    while (current <= end && safety < MAX_DAYS) {
        const isoDate = formatDateString(current);
        const data = dataMap.get(isoDate);
        result.push({ 
            date: isoDate, 
            value: data ? data.value : 0,
            breakdown: data ? (data.breakdown || []) : []
        });
        current.setDate(current.getDate() + 1);
        safety++;
    }
    return result;
};

const getMonetaryValue = (val: any): number => {
    if (val === null || val === undefined) return 0;
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
        // Remove currency symbols, non-breaking spaces, letters
        let cleaned = val.replace(/[R$\s\u00A0a-zA-Z]/g, '').trim();
        if (!cleaned) return 0;
        
        // Handle "1.000,00" (BR) vs "1,000.00" (US)
        if (cleaned.includes(',') && !cleaned.includes('.')) {
             // 1000,00 -> 1000.00
             cleaned = cleaned.replace('.', '').replace(',', '.');
        } else if (cleaned.includes('.') && cleaned.includes(',')) {
             if (cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')) {
                // 1.000,00 (BR)
                cleaned = cleaned.replace(/\./g, '').replace(',', '.');
             } else {
                // 1,000.00 (US)
                cleaned = cleaned.replace(/,/g, '');
             }
        } else if (cleaned.includes(',')) {
            // 100,50 (Assume BR simple)
            cleaned = cleaned.replace(',', '.');
        }
        
        const parsed = parseFloat(cleaned);
        return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
};

// ============================================================================
// LOGIC: ADS / UTM / CUSTOM FIELDS PARSER
// ============================================================================

interface ExtractedAdData {
    name: string | null;
    source: string;
    url: string | null;
}

const extractAdData = (card: WtsCardItem, contact?: WtsContact): ExtractedAdData => {
    const result: ExtractedAdData = { name: null, source: 'Orgânico', url: null };

    // --- STRATEGY 1: CONTACT UTM (STRICT PRIORITY) ---
    if (contact && contact.utm) {
        const u = contact.utm;
        
        if (u.source) result.source = u.source;
        if (u.Campaign) result.name = u.Campaign;
        else if (u.campaign) result.name = u.campaign;
        else if (u.content) result.name = u.content;

        if (u.referalurl) result.url = u.referalurl;
        else if (u.referralUrl) result.url = u.referralUrl;

        if (result.name || result.source !== 'Orgânico') {
            return result;
        }
    }

    // --- STRATEGY 2: CARD/CONTACT CUSTOM FIELDS (Fallback) ---
    if (!result.name) {
        const checkFields = (fields: any) => {
            const candidates: string[] = [];
            if (!fields) return candidates;

            let normalizedFields: {key: string, value: any}[] = [];
            
            if (Array.isArray(fields)) {
                normalizedFields = fields.map((f: any) => ({
                    key: normalizeStr(f.name || f.key || f.id || ''),
                    value: f.value || f.text
                }));
            } else if (typeof fields === 'object') {
                normalizedFields = Object.entries(fields).map(([k, v]) => ({
                    key: normalizeStr(k),
                    value: v
                }));
            }

            normalizedFields.forEach(({key, value}) => {
                if (value && typeof value === 'string') {
                    if (isAdKey(key)) candidates.push(value);
                    if (key.includes('source') || key.includes('origem')) result.source = value;
                }
            });
            return candidates;
        };

        const cardCandidates = checkFields(card.customFields);
        const contactCandidates = contact ? checkFields(contact.customFields) : [];
        const allCandidates = [...cardCandidates, ...contactCandidates]
            .filter(c => c && c.length > 2 && !['api', 'wts', 'unknown', 'manual', 'n/a'].includes(c.toLowerCase()));
        
        if (allCandidates.length > 0) {
            result.name = allCandidates[0];
        }
    }

    return result;
};

const isAdKey = (key: string) => {
    return [
        'ad_name', 'adname', 'nome do anuncio', 'nome do anúncio',
        'campaign', 'campanha', 'utm_campaign', 'utm_content', 
        'criativo', 'creative', 'anuncio', 'ads'
    ].some(k => key.includes(k));
};

// ============================================================================
// LOGIC: TAGS (SERVICES) FILTER
// ============================================================================

const OPERATIONAL_TAGS = new Set([
  'quente', 'frio', 'morno', 'follow', 'reunião', 'agendada', 'lead', 
  'novo', 'cliente', 'importado', 'wts', 'arquivado', 'perdido', 
  'desqualificado', 'contato', 'agendado', 'pendente', 'sdr', 'closer',
  'indicação', 'google', 'instagram', 'facebook', 'ads', 'orgânico',
  'conversapp', 'sistema', 'automático', 'clie', 'prosp', 'ativo',
  'etapa', 'funil', 'card'
]);

// ============================================================================
// MAIN FETCH
// ============================================================================

// Mapa global para resolver IDs de tags (importante para o gráfico de serviços)
let globalTagMap = new Map<string, WtsTag>();

export const fetchConversAppData = async (currentData: DashboardData, dateFilter: DateFilterState): Promise<DashboardData> => {
  try {
    const url = new URL(WTS_BASE_URL);
    url.searchParams.append('_t', new Date().getTime().toString());

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      mode: 'cors'
    });

    if (!response.ok) throw new Error(`Status ${response.status}`);
    
    const text = await response.text();
    if (!text) return currentData;

    let rawJson;
    try { rawJson = JSON.parse(text); } catch (e) { throw new Error("JSON Inválido"); }

    // Unwrap N8N structure
    let rootData = rawJson;
    if (Array.isArray(rawJson)) {
        rootData = rawJson.length > 0 ? (rawJson[0].json || rawJson[0]) : {};
    } else if (rawJson.json) {
        rootData = rawJson.json;
    }

    // Populate Tag Map from Root Data - CRITICAL FIX
    // Isso garante que tenhamos o nome da tag quando o card só traz tagIds
    if (rootData.tags && Array.isArray(rootData.tags)) {
        globalTagMap.clear();
        rootData.tags.forEach((tag: any) => {
            if (tag.id) globalTagMap.set(tag.id, tag);
        });
    }

    const rawSteps = rootData.steps || [];
    let rawCards = rootData.cards || rootData.data || rootData.items || [];
    const rawContacts = rootData.contacts || [];

    if (!Array.isArray(rawCards) && typeof rawCards === 'object') {
        rawCards = Object.values(rawCards);
    }
    
    // Map Contacts for O(1) Access
    const contactsMap = new Map<string, WtsContact>();
    if (Array.isArray(rawContacts)) {
        rawContacts.forEach((c: any) => { if (c.id) contactsMap.set(c.id, c); });
    }

    // ========================================================================
    // PIPELINE & STAGE MAPPING
    // ========================================================================
    
    const pipelineMap = new Map<string, PipelineStage>();
    
    // 1. Initialize from Definitions
    if (Array.isArray(rawSteps)) {
        rawSteps.forEach((s: any, idx: number) => {
            const id = String(s.id);
            pipelineMap.set(id, {
                id: id,
                label: s.title || s.name || `Etapa ${idx + 1}`,
                count: 0,
                total: 0,
                color: getPipelineColor(idx),
                cards: [],
                value: 0
            });
        });
    }

    // 2. Process Cards
    if (Array.isArray(rawCards)) {
        rawCards.forEach((card: any) => {
            if (!card) return;

            // Enrich with Contact
            const contactId = card.contactId || card.contact_id;
            if (contactId && contactsMap.has(contactId)) {
                card.fullContact = contactsMap.get(contactId);
            }

            // Identify Step
            let stepId = String(card.stepId || card.stageId || card.columnId || '');
            let stepName = card.stepName || card.stageName || card.columnName || card.stage;
            let targetStageId: string | null = null;

            if (stepId && pipelineMap.has(stepId)) {
                targetStageId = stepId;
            } else if (stepName) {
                const normalizedStepName = normalizeStr(stepName);
                for (const [pId, pVal] of pipelineMap.entries()) {
                    if (normalizeStr(pVal.label) === normalizedStepName) {
                        targetStageId = pId;
                        break;
                    }
                }
                if (!targetStageId) {
                    const newId = stepId || `auto-${normalizedStepName}`;
                    const newIndex = pipelineMap.size;
                    pipelineMap.set(newId, {
                        id: newId,
                        label: stepName,
                        count: 0,
                        total: 0,
                        color: getPipelineColor(newIndex),
                        cards: [],
                        value: 0
                    });
                    targetStageId = newId;
                }
            }

            if (targetStageId) {
                const stage = pipelineMap.get(targetStageId);
                if (stage) stage.cards.push(card);
            } else {
                if (pipelineMap.size === 0) {
                     pipelineMap.set('default', {
                        id: 'default',
                        label: 'Geral',
                        count: 0,
                        total: 0,
                        color: getPipelineColor(0),
                        cards: [],
                        value: 0
                    });
                    pipelineMap.get('default')!.cards.push(card);
                } else {
                    const firstId = pipelineMap.keys().next().value;
                    pipelineMap.get(firstId)!.cards.push(card);
                }
            }
        });
    }

    const finalPipeline = Array.from(pipelineMap.values());
    return processMetrics(currentData, dateFilter, finalPipeline);

  } catch (error) {
    console.error('API Processing Error:', error);
    throw error;
  }
};


// ============================================================================
// METRICS PROCESSING
// ============================================================================

const processMetrics = (currentData: DashboardData, dateFilter: DateFilterState, pipeline: PipelineStage[]): DashboardData => {
    // Map stores both total and breakdown for interactive charts
    const dailyRevenueMap = new Map<string, { value: number, breakdown: {name: string, value: number}[] }>(); 
    const dailyLeadsMap = new Map<string, { value: number, breakdown?: any[] }>();   
    
    const servicesMap = new Map<string, any>();
    const teamMap = new Map<string, TeamMember>();
    const creativeMap = new Map<string, CreativeMetrics>();
    const trafficMap = new Map<string, TrafficSource>();
    
    let totalRevenue = 0;
    let totalContracts = 0;
    let totalProposalValue = 0;

    // --- DATE RANGE SETUP ---
    // Usamos datas bem abertas inicialmente para filtrar os cards
    // MAS, para os gráficos, vamos calcular o range real dos dados
    let filterStartDate: Date;
    let filterEndDate: Date;
    const today = new Date();

    if (dateFilter.preset === 'all') {
        filterStartDate = new Date(1970, 0, 1);
        filterEndDate = new Date(2100, 11, 31);
    } else if (dateFilter.startDate && dateFilter.endDate) {
        filterStartDate = normalizeDate(parseDateSafe(dateFilter.startDate));
        filterEndDate = normalizeDate(parseDateSafe(dateFilter.endDate));
    } else {
        const past = new Date();
        if (dateFilter.preset === 'today') past.setDate(today.getDate());
        else if (dateFilter.preset === 'week') past.setDate(today.getDate() - 7);
        else if (dateFilter.preset === 'last_month') {
             past.setMonth(past.getMonth() - 1);
             past.setDate(1);
             today.setDate(0); 
        } else {
             past.setDate(1); 
        }
        filterStartDate = normalizeDate(past);
        filterEndDate = normalizeDate(today);
    }

    // Variáveis para detectar o PRIMEIRO e ÚLTIMO dado real encontrado
    // Isso corrige o bug de "Todo o período" renderizar 50 anos de dados vazios
    let minDataDate = new Date(8640000000000000); 
    let maxDataDate = new Date(-8640000000000000);
    let hasData = false;

    // --- ITERATE PIPELINE ---
    pipeline.forEach(stage => {
        const stageLabelNorm = normalizeStr(stage.label);
        
        // --- STAGE TYPE DETECTION ---
        // Detecção explícita de Pagamento Confirmado e Contrato Assinado
        const isPaymentConfirmed = stageLabelNorm.includes('pagamento') && stageLabelNorm.includes('confirmado');
        const isContractSigned = stageLabelNorm.includes('contrato') && stageLabelNorm.includes('assinado');
        
        // Detecção de Proposta
        const isProposalStage = stageLabelNorm.includes('proposta') || stageLabelNorm.includes('enviada');

        const filteredCards: CardSimple[] = [];
        let stageValue = 0;

        stage.cards.forEach((card: any) => {
            const contact = card.fullContact;
            const status = String(card.status || '').toLowerCase();
            
            // --- 1. DETERMINE IF SALE FIRST (Crucial for Date Logic) ---
            // É venda se: O card estiver marcado como 'won' OU se estiver em etapas de sucesso
            // independente do status ser 'open', desde que nao seja lost/archived explicitamente em etapa errada
            let isSale = status === 'won' || status === 'paid' || status === 'ganho';
            if (!isSale && (isPaymentConfirmed || isContractSigned)) {
                if (status !== 'lost' && status !== 'perdido' && status !== 'archived') {
                    isSale = true;
                }
            }

            // --- 2. DATE LOGIC (Requested Update) ---
            // Se for venda (Pagamento confirmado), usamos updatedAt. Se não, createdAt.
            let relevantDateRaw = card.createdAt;
            if (isSale) {
                 // Prioriza updated_at para fechamento de contrato
                 relevantDateRaw = card.updatedAt || card.updated_at || card.dateLastActivity || card.createdAt;
            }
            
            const relevantDate = parseDateSafe(relevantDateRaw);
            const normalizedDate = normalizeDate(relevantDate);

            // Strict Filter Check
            if (normalizedDate < filterStartDate || normalizedDate > filterEndDate) {
                return; 
            }

            // Rastreia o intervalo REAL de dados para os gráficos
            if (normalizedDate < minDataDate) minDataDate = normalizedDate;
            if (normalizedDate > maxDataDate) maxDataDate = normalizedDate;
            hasData = true;

            const val = getMonetaryValue(card.monetaryAmount || card.value || card.amount);
            
            stageValue += val;
            const cardTitle = card.title || (contact ? contact.name : 'Sem Nome');

            // --- 3. METRIC: Daily Leads ---
            // Leads sempre contam pela data de criação
            const creationDate = parseDateSafe(card.createdAt);
            const normCreationDate = normalizeDate(creationDate);
            if (normCreationDate >= filterStartDate && normCreationDate <= filterEndDate) {
                const dayKey = formatDateString(creationDate);
                const entry = dailyLeadsMap.get(dayKey) || { value: 0 };
                entry.value++;
                dailyLeadsMap.set(dayKey, entry);
                
                // Também atualiza min/max date baseado na criação de leads
                if (normCreationDate < minDataDate) minDataDate = normCreationDate;
                if (normCreationDate > maxDataDate) maxDataDate = normCreationDate;
            }

            // --- 4. METRIC: Revenue / Proposals ---
            if (isSale) {
                totalRevenue += val;
                totalContracts++;
                
                // Agrupa vendas por data de atualização (fechamento)
                const saleDayKey = formatDateString(relevantDate);
                const currentEntry = dailyRevenueMap.get(saleDayKey) || { value: 0, breakdown: [] };
                currentEntry.value += val;
                currentEntry.breakdown.push({ name: cardTitle, value: val });
                dailyRevenueMap.set(saleDayKey, currentEntry);
            } else if (isProposalStage) {
                totalProposalValue += val;
            }

            // --- 5. METRIC: Services / Tags (FIXED) ---
            let rawTags: any[] = [];
            
            // 1. Tags do Objeto Card
            if (Array.isArray(card.tags)) rawTags = [...card.tags];
            
            // 2. Tags por ID (CORREÇÃO CRÍTICA)
            // Muitos cards vêm apenas com tagIds, precisamos buscar no mapa global
            if (Array.isArray(card.tagIds)) {
                card.tagIds.forEach((tid: string) => {
                    if (globalTagMap.has(tid)) {
                        rawTags.push(globalTagMap.get(tid));
                    }
                });
            }

            // 3. Tags do Contato
            if (contact && Array.isArray(contact.tags)) rawTags = [...rawTags, ...contact.tags];

            const displayTags: {name: string, color: string}[] = [];
            const processedTagNames = new Set<string>();

            rawTags.forEach(t => {
                let name = "";
                let color = "#C59D5F";
                if (typeof t === 'string') name = t;
                else if (typeof t === 'object') {
                    name = t.name || t.label || t.tag?.name || "";
                    color = t.color || t.bgColor || t.tag?.color || color;
                }
                if (!name) return;
                
                const nameNorm = normalizeStr(name);
                if (processedTagNames.has(nameNorm)) return;
                processedTagNames.add(nameNorm);
                displayTags.push({ name, color });

                if (!OPERATIONAL_TAGS.has(nameNorm)) {
                    const current = servicesMap.get(name) || { count: 0, value: 0, color: color };
                    current.count++;
                    if (isSale) current.value += val;
                    servicesMap.set(name, current);
                }
            });

            // --- 6. METRIC: Ads / Creatives / Source ---
            const adData = extractAdData(card, contact);
            if (adData.source) {
                const sourceName = adData.source.length > 20 ? adData.source.substring(0, 20) + '...' : adData.source;
                const sourceKey = normalizeStr(sourceName);
                const currentSource = trafficMap.get(sourceKey) || { 
                    name: sourceName, 
                    value: 0, 
                    salesCount: 0, 
                    conversionRate: 0, 
                    color: '#808080' 
                };
                
                if (sourceKey.includes('google')) currentSource.color = '#4285F4';
                else if (sourceKey.includes('insta')) currentSource.color = '#E1306C';
                else if (sourceKey.includes('face')) currentSource.color = '#1877F2';
                else if (sourceKey.includes('indic')) currentSource.color = '#34A853';

                currentSource.value++; 
                if (isSale) currentSource.salesCount++;
                if (currentSource.value > 0) currentSource.conversionRate = Math.round((currentSource.salesCount / currentSource.value) * 100);
                
                trafficMap.set(sourceKey, currentSource);
            }

            if (adData.name) {
                 const cleanName = adData.name.replace(/#\d+/g, '').trim();
                 const current = creativeMap.get(cleanName) || { 
                     id: cleanName, 
                     name: cleanName, 
                     url: adData.url || undefined,
                     source: adData.source, 
                     leads: 0, 
                     sales: 0, 
                     revenue: 0 
                 };
                 current.leads++;
                 if (isSale) { 
                     current.sales++; 
                     current.revenue += val; 
                 }
                 creativeMap.set(cleanName, current);
            }

            // --- 7. METRIC: Team ---
            const userId = String(card.responsibleUserId || 'unassigned');
            let userName = card.responsibleUser?.name;
            if (USER_ID_MAP[userId]) {
                userName = USER_ID_MAP[userId];
            } else if (!userName || userId === 'unassigned') {
                userName = 'Sem Responsável';
            }
            
            if (!teamMap.has(userId)) {
                teamMap.set(userId, {
                    id: userId,
                    name: userName,
                    role: 'Vendedor', 
                    sales: 0,
                    target: 100000,
                    commission: 0,
                    avatarInitial: getInitials(userName),
                    activity: { leads: 0, scheduledMeetings: 0, meetingsHeld: 0, proposalsSent: 0, contractsSigned: 0, conversionRate: 0 }
                });
            }
            const member = teamMap.get(userId)!;
            member.activity.leads++;
            if (isSale) {
                member.sales += val;
                member.commission += (val * 0.1); 
                member.activity.contractsSigned++;
            }
            if (isProposalStage) {
                member.activity.proposalsSent++;
            }
            if (member.activity.leads > 0) {
                 member.activity.conversionRate = Math.round((member.activity.contractsSigned / member.activity.leads) * 100);
            }

            filteredCards.push({
                id: String(card.id),
                title: cardTitle,
                value: val,
                responsibleName: userName,
                date: relevantDate.toLocaleDateString('pt-BR'),
                tags: displayTags,
                adName: adData.name || undefined,
                adUrl: adData.url || undefined
            });
        });

        stage.cards = filteredCards;
        stage.count = filteredCards.length;
        stage.value = stageValue;
    });

    const totalPipelineItems = pipeline.reduce((sum, s) => sum + s.count, 0);
    pipeline.forEach(s => s.total = totalPipelineItems);

    // --- FINALIZE CHARTS ---
    
    // CORREÇÃO CRÍTICA PARA 'TODO O PERÍODO'
    // Se preset for 'all', usamos o intervalo de dados reais (minDataDate até maxDataDate)
    // ao invés de usar 1970 até 2100. Isso reduz os pontos do gráfico de milhares para apenas os dias relevantes.
    let chartStart = filterStartDate;
    let chartEnd = filterEndDate;

    if (dateFilter.preset === 'all') {
        if (hasData) {
            chartStart = minDataDate;
            chartEnd = maxDataDate;
            
            // Safety: se por acaso só tiver um dia, expande um pouco pra ficar bonito no gráfico
            if (chartStart.getTime() === chartEnd.getTime()) {
                const tempEnd = new Date(chartEnd);
                tempEnd.setDate(tempEnd.getDate() + 1);
                chartEnd = tempEnd;
            }
        } else {
            // Se não tiver dados, mostra range do mês atual
            const d = new Date();
            d.setDate(1);
            chartStart = d;
            chartEnd = new Date();
        }
    }

    // Double check sanity
    if (chartStart.getFullYear() < 2000) chartStart = new Date(2023, 0, 1);
    if (chartEnd > new Date()) chartEnd = new Date(); // Don't project too far into future

    const chartDays = fillMissingDates(dailyRevenueMap, formatDateString(chartStart), formatDateString(chartEnd));
    const finalDailyRevenue = chartDays.map(d => ({
        day: d.date.split('-')[2] + '/' + d.date.split('-')[1], // DD/MM for better XAxis
        fullDate: d.date,
        meta: currentData.currentGoals.revenueTarget / 30, 
        realizado: d.value,
        salesBreakdown: d.breakdown 
    }));

    const leadDays = fillMissingDates(dailyLeadsMap, formatDateString(chartStart), formatDateString(chartEnd));
    const finalDailyLeads = leadDays.map(d => ({
        day: d.date.split('-')[2] + '/' + d.date.split('-')[1], // DD/MM
        count: d.value
    }));

    const finalServices = Array.from(servicesMap.entries())
        .map(([k, v]) => ({ name: k, value: v.count, monetaryValue: v.value, color: v.color }))
        .sort((a,b) => b.value - a.value)
        .slice(0, 10);

    const finalCreatives = Array.from(creativeMap.values())
        .sort((a,b) => b.revenue - a.revenue || b.leads - a.leads);
        
    const finalTraffic = Array.from(trafficMap.values())
        .sort((a,b) => b.value - a.value);

    return {
        ...currentData,
        lastUpdated: new Date().toISOString(),
        metrics: {
            totalRevenue,
            totalContracts,
            totalCashFlow: totalRevenue, 
            totalCommission: totalRevenue * 0.1,
            totalProposalValue 
        },
        charts: {
            dailyRevenue: finalDailyRevenue,
            dailyLeads: finalDailyLeads,
            services: finalServices,
            traffic: finalTraffic 
        },
        pipeline: pipeline,
        team: Array.from(teamMap.values()),
        creatives: finalCreatives
    };
};