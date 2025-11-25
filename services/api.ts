
import { DashboardData, PipelineStage, DateFilterState, TeamMember, ServiceData, CardSimple, CreativeMetrics, TrafficSource, WtsContact, WtsTag, TeamRole, WtsCardItem } from '../types';

// ============================================================================
// CONFIGURAÇÃO DE INTEGRAÇÃO
// ============================================================================
const WTS_BASE_URL = 'https://swebhooks.conversapp.com.br/webhook/webhook/dashboard-data';

// Ordem Fixa das Etapas conforme solicitado
const FIXED_STAGE_ORDER = [
    'BASE (Entrada Inicial)',
    'QUALIFICADO (Lead com potencial)',
    'DESQUALIFICADO (Lead sem potencial)',
    'FOLLOW-UP (Em acompanhamento)',
    'REUNIÃO AGENDADA',
    'NO-SHOW (Não compareceu)',
    'RECUPERAÇÃO (Nova tentativa)',
    'PROPOSTA ENVIADA',
    'DESISTIU DE SEGUIR',
    'CONTRATO ASSINADO',
    'PAGAMENTO CONFIRMADO'
];

// Mapeamento de IDs e Funções
// Roles: SDR, Closer, SDR/Closer
const USER_CONFIG: Record<string, { name: string, role: TeamRole }> = {
    '63f93580-afaa-49c8-af82-4c531d91e02a': { name: 'Nerik Lino', role: 'Closer' },
    '697b8530-66ca-4ca6-8fc2-c9be22257ac9': { name: 'Maria Eduarda', role: 'SDR' }, 
    '21b6c240-c438-44f1-929c-dd75e147bc2f': { name: 'Ketylaine Souza', role: 'SDR' },
    'f8c14041-5757-4d37-b3e4-6e9d8c3e9ec7': { name: 'Italo Antonio', role: 'Closer' },
    '954fb85f-aeb6-4747-a2cc-95fe2a8ae105': { name: 'Erick Gabriel', role: 'Closer' },
    '8282fef2-2c76-4fc8-a4cb-9194daf6a617': { name: 'Eduarda Felipe', role: 'SDR' },
};

// Helper para buscar ID por nome (Fallback)
const findUserConfigByName = (name: string): { id: string, config: { name: string, role: TeamRole } } | null => {
    if (!name) return null;
    const norm = normalizeStr(name);
    for (const [id, config] of Object.entries(USER_CONFIG)) {
        if (normalizeStr(config.name) === norm || norm.includes(normalizeStr(config.name))) {
            return { id, config };
        }
    }
    return null;
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

const parseDateSafe = (input: any): Date | null => {
    if (!input) return null;
    if (input instanceof Date) return input;

    // Handle Array (common in ConversApp custom fields)
    if (Array.isArray(input)) {
        if (input.length === 0) return null;
        input = input[0];
    }
    
    if (!input) return null;

    // Numeric timestamp
    if (typeof input === 'number') {
        if (input < 10000000000) return new Date(input * 1000); // Unix seconds
        return new Date(input); // Ms
    }

    // String parsing
    if (typeof input === 'string') {
        let cleanInput = input.trim();
        if (!cleanInput) return null;
        
        // Handle YYYY/MM/DD (Non-standard ISO) -> Convert to YYYY-MM-DD
        if (cleanInput.match(/^\d{4}\/\d{1,2}\/\d{1,2}/)) {
            cleanInput = cleanInput.replace(/\//g, '-');
        }

        // ISO format usually works
        const isoDate = new Date(cleanInput);
        if (!isNaN(isoDate.getTime()) && cleanInput.includes('-')) return isoDate;
        
        // PT-BR dd/mm/yyyy
        const ptBrMatch = cleanInput.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
        if (ptBrMatch) {
             return new Date(parseInt(ptBrMatch[3]), parseInt(ptBrMatch[2]) - 1, parseInt(ptBrMatch[1]));
        }
    }
    return null;
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
    
    const MAX_DAYS = 3650; 
    let current = new Date(start);
    let safety = 0;

    // Safety checks for extremely wide ranges
    if (current.getFullYear() < 2020) current = new Date(2023, 0, 1);
    if (end.getFullYear() > 2030) end.setFullYear(2030);

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
    if (Array.isArray(val) && val.length > 0) val = val[0];
    
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
        let cleaned = val.replace(/[R$\s\u00A0a-zA-Z]/g, '').trim();
        if (!cleaned) return 0;
        
        if (cleaned.includes(',') && !cleaned.includes('.')) {
             cleaned = cleaned.replace('.', '').replace(',', '.');
        } else if (cleaned.includes('.') && cleaned.includes(',')) {
             if (cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')) {
                cleaned = cleaned.replace(/\./g, '').replace(',', '.');
             } else {
                cleaned = cleaned.replace(/,/g, '');
             }
        } else if (cleaned.includes(',')) {
            cleaned = cleaned.replace(',', '.');
        }
        
        const parsed = parseFloat(cleaned);
        return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
};

// ============================================================================
// HELPER: CUSTOM FIELDS EXTRACTION (FLATTENED AWARE)
// ============================================================================

const getCustomFieldValue = (card: any, searchTerms: string[]): any => {
    const normalizedTerms = searchTerms.map(t => normalizeStr(t));

    const sources = [card, card.customFields, card.fullContact?.customFields];
    
    for (const source of sources) {
        if (!source || typeof source !== 'object') continue;
        
        for (const key of Object.keys(source)) {
            if (source[key] === undefined || source[key] === null) continue;

            const normalizedKey = normalizeStr(key); 
            const cleanKey = normalizedKey.replace(/^[-_]+/, '').replace(/[-_.]/g, ' '); 
            
            for (const term of normalizedTerms) {
                const cleanTerm = term.replace(/[-_.]/g, ' ');
                if (normalizedKey === term) return source[key];
                if (cleanKey === cleanTerm) return source[key];
                if (term.length > 3 && cleanKey.includes(cleanTerm)) {
                    return source[key];
                }
            }
        }
    }

    const candidates: { key: string, value: any }[] = [];
    const extractFromArray = (fields: any) => {
        if (Array.isArray(fields)) {
            fields.forEach((f: any) => {
                const k = f.name || f.key || f.id || '';
                const v = f.value || f.text;
                if (k && v !== undefined && v !== null) candidates.push({ key: normalizeStr(k), value: v });
            });
        }
    };

    extractFromArray(card.customFields);
    if (card.fullContact) extractFromArray(card.fullContact.customFields);

    for (const term of normalizedTerms) {
        const cleanTerm = term.replace(/[-_.]/g, ' ');
        const found = candidates.find(c => {
            const cleanKey = c.key.replace(/^[-_]+/, '').replace(/[-_.]/g, ' ');
            return cleanKey === cleanTerm || cleanKey.includes(cleanTerm);
        });
        if (found) return found.value;
    }
    return null;
};

// ============================================================================
// LOGIC: ADS / UTM PARSER
// ============================================================================

interface ExtractedAdData {
    name: string | null;
    source: string;
    url: string | null;
}

const extractAdData = (card: any): ExtractedAdData => {
    const result: ExtractedAdData = { name: null, source: 'Orgânico', url: null };
    const candidates: { key: string, value: string }[] = [];
    
    if (card.utm_source) candidates.push({ key: 'utm_source', value: String(card.utm_source) });
    if (card.utm_campaign) candidates.push({ key: 'utm_campaign', value: String(card.utm_campaign) });
    if (card.lead_origin) candidates.push({ key: 'origin', value: String(card.lead_origin) });
    if (card.ad_referral_url) candidates.push({ key: 'referral_url', value: String(card.ad_referral_url) });

    const collect = (obj: any, prefix = '') => {
        if (!obj) return;
        Object.keys(obj).forEach(key => {
            const val = obj[key];
            if (!val || typeof val === 'object') return;
            candidates.push({ key: normalizeStr(prefix + key), value: String(val) });
        });
    };

    collect(card);
    if (card.customFields && typeof card.customFields === 'object' && !Array.isArray(card.customFields)) collect(card.customFields);
    
    if (card.fullContact) {
        if (card.fullContact.utm) collect(card.fullContact.utm, 'utm_');
    }

    for (const item of candidates) {
        const { key: k, value: v } = item;
        if (v.toLowerCase() === 'api' || v === 'undefined' || v === 'null') continue;

        if (k.includes('utm_source') || k.includes('origem') || k === 'source' || k === 'origin') {
             if (result.source === 'Orgânico' || (v.length > result.source.length && !v.toLowerCase().includes('unknown'))) {
                result.source = v;
             }
        }
        if (['ad_name', 'adname', 'campaign', 'campanha', 'utm_campaign', 'criativo'].some(x => k.includes(x))) {
            if (!result.name || (v.length > result.name.length && !v.toLowerCase().includes('unknown'))) {
                 result.name = v;
            }
        }
        if ((k.includes('url') || k.includes('link')) && v.startsWith('http')) {
            result.url = v;
        }
    }
    return result;
};

const OPERATIONAL_TAGS = new Set([
  'quente', 'frio', 'morno', 'follow', 'reunião', 'agendada', 'lead', 
  'novo', 'cliente', 'importado', 'wts', 'arquivado', 'perdido', 
  'desqualificado', 'contato', 'agendado', 'pendente', 'sdr', 'closer',
  'indicação', 'google', 'instagram', 'facebook', 'ads', 'orgânico',
  'conversapp', 'sistema', 'automático', 'clie', 'prosp', 'ativo',
  'etapa', 'funil', 'card', 'won', 'lost', 'open'
]);

// ============================================================================
// DATA NORMALIZATION (N8N Flattened -> Internal Structure)
// ============================================================================

const normalizeN8NItem = (item: any): WtsCardItem => {
    // Se já parece estar no formato padrão, retorna
    if (item.id && !item.card_id) return item;

    // Reconstrói Tags da string
    let parsedTags: WtsTag[] = [];
    
    // Tratamento robusto para tags (pode vir array ou string)
    let tagNames: string[] = [];
    if (item.tags) {
        if (Array.isArray(item.tags)) {
            tagNames = item.tags.map((t: any) => typeof t === 'string' ? t : t.name || '').filter(Boolean);
        } else if (typeof item.tags === 'string') {
            tagNames = item.tags.split(',').map((s: string) => s.trim()).filter(Boolean);
        }
    }

    // Tratamento robusto para cores (pode vir array ou string)
    let tagColors: string[] = [];
    if (item.tags_colors) {
        if (Array.isArray(item.tags_colors)) {
            tagColors = item.tags_colors.map(String);
        } else if (typeof item.tags_colors === 'string') {
            const colorStr = item.tags_colors.trim();
            // CORREÇÃO CRÍTICA: Lógica para parsear cores, suportando RGB(a,b,c) que contém vírgulas
            // Se só tem uma tag, assume que a string inteira de cor é para ela
            if (tagNames.length <= 1) {
                tagColors = [colorStr];
            } else {
                // Se tem múltiplas tags, tenta separar por vírgula IGNORANDO vírgulas dentro de parênteses
                // Regex: Match vírgula apenas se não for seguida de um fechamento de parênteses que não tenha uma abertura antes
                tagColors = colorStr.split(/,(?![^(]*\))/).map((s: string) => s.trim());
            }
        }
    }
    
    if (tagNames.length > 0) {
        parsedTags = tagNames.map((name, idx) => {
            let finalColor = '#C59D5F'; // Default Gold
            
            // 1. Tenta pegar do array tags_colors na mesma posição
            if (tagColors[idx] && tagColors[idx].length > 1 && tagColors[idx] !== 'null' && tagColors[idx] !== 'undefined') {
                finalColor = tagColors[idx];
            } 
            // 2. Se falhar, tenta pegar do mapa global de tags
            else {
                const normName = normalizeStr(name);
                if (globalTagMap.has(normName)) {
                    finalColor = globalTagMap.get(normName)!.bgColor;
                }
            }

            return {
                id: `tag-${name}`,
                name: name,
                nameColor: '#fff',
                bgColor: finalColor
            };
        });
    }

    // Reconstrói Objeto de Contato
    const fullContact: WtsContact = {
        id: item.contact_id || item.card_id, 
        name: item.contact_name || item.card_title || 'Sem Nome',
        phoneNumber: item.contact_phone,
        email: item.contact_email,
        utm: {
            source: item.utm_source,
            medium: item.utm_medium,
            campaign: item.utm_campaign,
            term: item.utm_term,
            content: item.utm_content,
            referralUrl: item.ad_referral_url
        },
        origin: item.lead_origin
    };

    // --- CORREÇÃO: RESPONSÁVEL (Mapping ID -> Nome via Config) ---
    // Verifica diferentes padrões de chave que podem vir do JSON
    const rId = item.responsible_user_id || item.responsibleUserId;
    let rName = item.responsible_user_name || item.responsible_name || item.responsibleUserName;

    // Se não tiver nome, mas tiver ID, tenta buscar na config
    if (!rName && rId && USER_CONFIG[rId]) {
        rName = USER_CONFIG[rId].name;
    }

    const responsibleUser = (rId || rName) ? {
        id: rId || 'unknown',
        name: rName || 'Sem Responsável'
    } : null;

    return {
        ...item, 
        id: item.card_id,
        title: item.card_title,
        monetaryAmount: item.monetary_amount,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        stepName: item.step_name,
        position: item.step_position,
        tags: parsedTags, 
        tags_names: item.tags,
        fullContact: fullContact,
        responsibleUser: responsibleUser,
        responsibleUserId: rId
    };
};

// ============================================================================
// MAIN FETCH
// ============================================================================

let globalTagMap = new Map<string, WtsTag>();

export const fetchConversAppData = async (currentData: DashboardData, dateFilter: DateFilterState): Promise<DashboardData> => {
  try {
    const url = new URL(WTS_BASE_URL);
    url.searchParams.append('_t', new Date().getTime().toString());

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 180000);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) throw new Error(`Status ${response.status}: ${response.statusText}`);
    
    const text = await response.text();
    if (!text) return currentData;

    let rawJson;
    try { rawJson = JSON.parse(text); } catch (e) { throw new Error("JSON Inválido"); }

    let rawCards: any[] = [];
    let rawSteps: any[] = [];

    if (Array.isArray(rawJson)) {
        rawCards = rawJson;
    } else if (rawJson.data && Array.isArray(rawJson.data)) {
        rawCards = rawJson.data;
        if (rawJson.steps) rawSteps = rawJson.steps; 
        if (rawJson.tags) {
             rawJson.tags.forEach((tag: any) => {
                if (tag.id) globalTagMap.set(tag.id, tag);
                if (tag.name) globalTagMap.set(normalizeStr(tag.name), tag); 
            });
        }
    } else if (rawJson.json) {
         if (rawJson.json.data) rawCards = rawJson.json.data;
         else if (Array.isArray(rawJson.json)) rawCards = rawJson.json;
    }

    const normalizedCards = rawCards.map(normalizeN8NItem);

    const pipelineMap = new Map<string, PipelineStage>();
    
    if (rawSteps.length > 0) {
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

    normalizedCards.forEach((card: any) => {
        if (!card) return;

        let targetStageId: string | null = null;
        const stepId = String(card.stepId || card.stageId || '');
        const stepName = normalizeStr(card.stepName || card.stageName || '');

        if (stepId && pipelineMap.has(stepId)) targetStageId = stepId;
        else {
            for (const [pId, pVal] of pipelineMap.entries()) {
                if (normalizeStr(pVal.label) === stepName) {
                    targetStageId = pId;
                    break;
                }
            }
            if (!targetStageId && stepName) {
                const newId = stepId || `auto-${stepName}`;
                pipelineMap.set(newId, {
                     id: newId,
                     label: card.stepName || "Etapa Nova",
                     count: 0, 
                     total: 0,
                     color: getPipelineColor(pipelineMap.size),
                     cards: [],
                     value: 0
                });
                targetStageId = newId;
            }
        }

        if (targetStageId) pipelineMap.get(targetStageId)!.cards.push(card);
        else {
             if (pipelineMap.size === 0) pipelineMap.set('default', { id: 'default', label: 'Geral', count: 0, total: 0, color: '#404040', cards: [], value: 0});
             pipelineMap.get(pipelineMap.keys().next().value)!.cards.push(card);
        }
    });

    const finalPipeline = Array.from(pipelineMap.values());
    
    finalPipeline.sort((a, b) => {
        const normA = normalizeStr(a.label);
        const normB = normalizeStr(b.label);
        
        const indexA = FIXED_STAGE_ORDER.findIndex(fixed => normalizeStr(fixed).includes(normA) || normA.includes(normalizeStr(fixed)));
        const indexB = FIXED_STAGE_ORDER.findIndex(fixed => normalizeStr(fixed).includes(normB) || normB.includes(normalizeStr(fixed)));

        const valA = indexA === -1 ? 999 : indexA;
        const valB = indexB === -1 ? 999 : indexB;

        return valA - valB;
    });

    return processMetrics(currentData, dateFilter, finalPipeline, normalizedCards);

  } catch (error) {
    console.error('API Processing Error:', error);
    throw error;
  }
};


// ============================================================================
// METRICS PROCESSING
// ============================================================================

const processMetrics = (
    currentData: DashboardData, 
    dateFilter: DateFilterState, 
    pipeline: PipelineStage[],
    allCards: any[]
): DashboardData => {
    
    const dailyRevenueMap = new Map<string, { value: number, breakdown: {name: string, value: number}[] }>(); 
    const dailyLeadsMap = new Map<string, { value: number }>();   
    
    const servicesMap = new Map<string, any>();
    const teamMap = new Map<string, TeamMember>();
    const creativeMap = new Map<string, CreativeMetrics>();
    const trafficMap = new Map<string, TrafficSource>();
    
    let totalRevenue = 0; 
    let totalContracts = 0; 
    let totalCashFlow = 0; 
    let totalMeetings = 0; 
    let totalProposalValue = 0;
    let totalCommission = 0;

    const existingRoles = new Map<string, TeamRole>();
    if (currentData && currentData.team) {
        currentData.team.forEach(m => existingRoles.set(m.id, m.role));
    }

    let filterStartDate: Date, filterEndDate: Date;
    const today = new Date();

    if (dateFilter.preset === 'all') {
        filterStartDate = new Date(2000, 0, 1);
        filterEndDate = new Date(2100, 11, 31);
    } else if (dateFilter.startDate && dateFilter.endDate) {
        filterStartDate = normalizeDate(parseDateSafe(dateFilter.startDate) || new Date());
        filterEndDate = normalizeDate(parseDateSafe(dateFilter.endDate) || new Date());
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

    let minDataDate = new Date(8640000000000000); 
    let maxDataDate = new Date(-8640000000000000);
    let hasData = false;

    const isDateInRange = (d: Date | null): boolean => {
        if (!d) return false;
        const norm = normalizeDate(d);
        if (norm < minDataDate) minDataDate = norm;
        if (norm > maxDataDate) maxDataDate = norm;
        hasData = true;
        return norm >= filterStartDate && norm <= filterEndDate;
    };

    allCards.forEach(card => {
        let monetaryVal = getMonetaryValue(card.monetaryAmount);
        
        if (monetaryVal === 0) {
            const customVal = getCustomFieldValue(card, [
                'valor', 
                'honorarios', 
                'honor-rios',
                'preco', 
                'valor-contrato', 
                'valor-do-contrato',
                'valor-causa', 
                'honorarios-contratuais',
                'valor-total',
                'montante',
                'receita'
            ]);
            monetaryVal = getMonetaryValue(customVal);
        }

        const contact = card.fullContact;
        const cardTitle = card.title || (contact ? contact.name : 'Sem Nome');
        
        const creationDate = parseDateSafe(card.createdAt);
        const updateDate = parseDateSafe(card.updatedAt);
        
        const meetingDateRaw = getCustomFieldValue(card, [
            'data-da-reuni-o', 
            'data da reuniao', 
            'agendamento', 
            'dt reuniao', 
            'data agendamento'
        ]);
        const meetingDate = parseDateSafe(meetingDateRaw);

        const contractDateRaw = getCustomFieldValue(card, [
            'assinatura-do-contra', 
            'assinatura', 
            'data assinatura', 
            'fechamento', 
            'contrato', 
            'data fechamento'
        ]);
        const contractDate = parseDateSafe(contractDateRaw);

        const paymentDateRaw = getCustomFieldValue(card, [
            'data-do-pagamento', 
            'pagamento', 
            'data pagamento'
        ]);
        const paymentDate = parseDateSafe(paymentDateRaw);

        const entryValueRaw = getCustomFieldValue(card, [
            '-valor-da-entrada', 
            'valor-da-entrada',
            'valor da entrada', 
            'entrada', 
            'sinal'
        ]);
        const entryValue = getMonetaryValue(entryValueRaw);

        const stageName = normalizeStr(card.stepName || card.stageName || '');
        
        const isContractStageByName = stageName.includes('contrato assinado') || stageName.includes('pagamento confirmado');
        const isPaymentStageByName = stageName.includes('pagamento confirmado');

        const isEffectiveWin = isContractStageByName || (paymentDate !== null);

        let effectiveContractDate = contractDate;
        if (!effectiveContractDate && isContractStageByName) {
             effectiveContractDate = updateDate || creationDate;
        }

        let userId = card.responsibleUserId;
        if (!userId && card.responsibleUser) userId = card.responsibleUser.id;
        
        if (!userId || userId === 'unknown') {
             const customResp = getCustomFieldValue(card, ['responsavel', 'vendedor', 'closer', 'sdr']);
             if (customResp) {
                 const found = findUserConfigByName(String(customResp));
                 if (found) {
                     userId = found.id;
                 }
             }
        }

        userId = String(userId || 'unassigned');
        
        let userName = card.responsibleUser?.name || 'Sem Responsável';
        let memberConfig = USER_CONFIG[userId];
        
        if (!memberConfig && userName !== 'Sem Responsável') {
            const found = findUserConfigByName(userName);
            if (found) {
                userId = found.id;
                memberConfig = found.config;
            }
        }

        if (memberConfig) userName = memberConfig.name;

        // --- BACKFILL RESPONSIBLE USER NAME IF MISSING ---
        // Garante que o nome resolvido seja persistido no card para visualização no pipeline
        if ((!card.responsibleUser || !card.responsibleUser.name || card.responsibleUser.name === 'Sem Responsável') && userName !== 'Sem Responsável') {
            card.responsibleUser = { id: userId, name: userName };
        }

        if (!teamMap.has(userId)) {
            let role: TeamRole = memberConfig ? memberConfig.role : 'Vendedor';
            if (existingRoles.has(userId)) {
                role = existingRoles.get(userId)!;
            }

            teamMap.set(userId, {
                id: userId,
                name: userName,
                role: role, 
                sales: 0,
                target: 100000,
                commission: 0,
                avatarInitial: getInitials(userName),
                activity: { leads: 0, scheduledMeetings: 0, meetingsHeld: 0, proposalsSent: 0, contractsSigned: 0, conversionRate: 0 }
            });
        }
        const member = teamMap.get(userId)!;

        if (isDateInRange(creationDate)) {
            const dayKey = formatDateString(creationDate!);
            const entry = dailyLeadsMap.get(dayKey) || { value: 0 };
            entry.value++;
            dailyLeadsMap.set(dayKey, entry);
            member.activity.leads++;
        }

        if (isDateInRange(meetingDate)) {
            totalMeetings++;
            member.activity.meetingsHeld++;
        }

        if ((isContractStageByName || contractDate) && isDateInRange(effectiveContractDate)) {
            totalContracts++; 
            member.activity.contractsSigned++;
            totalRevenue += monetaryVal; 
            member.sales += monetaryVal;

            const baseCommValue = entryValue > 0 ? entryValue : 0; 
            let commissionVal = 0;
            if (baseCommValue > 0) {
                if (member.role === 'SDR') commissionVal = baseCommValue * 0.03; 
                else if (member.role === 'Closer') commissionVal = baseCommValue * 0.05;
                else if (member.role === 'SDR/Closer') commissionVal = baseCommValue * 0.08;
                else commissionVal = baseCommValue * 0.05; 
                member.commission += commissionVal;
                totalCommission += commissionVal;
            }
        }

        let revenueChartDate = paymentDate;

        if (revenueChartDate && isDateInRange(revenueChartDate)) {
             const cashIn = entryValue > 0 ? entryValue : monetaryVal;
             totalCashFlow += cashIn;

             if (monetaryVal > 0) {
                const payDayKey = formatDateString(revenueChartDate);
                const currentEntry = dailyRevenueMap.get(payDayKey) || { value: 0, breakdown: [] };
                currentEntry.value += monetaryVal;
                
                if (!currentEntry.breakdown.some(b => b.name === cardTitle && Math.abs(b.value - monetaryVal) < 0.1)) {
                    currentEntry.breakdown.push({ name: cardTitle, value: monetaryVal });
                }
                dailyRevenueMap.set(payDayKey, currentEntry);
             }
        } else if (isPaymentStageByName && !revenueChartDate) {
            const fallbackDate = updateDate || creationDate;
            if (fallbackDate && isDateInRange(fallbackDate)) {
                 const cashIn = entryValue > 0 ? entryValue : monetaryVal;
                 totalCashFlow += cashIn;
            }
        }

        if ((isDateInRange(creationDate) || isDateInRange(updateDate)) && (stageName.includes('proposta') || stageName.includes('negocia'))) {
             totalProposalValue += monetaryVal;
             member.activity.proposalsSent++;
        }

        const isActiveForStats = isDateInRange(creationDate) || isDateInRange(effectiveContractDate) || isDateInRange(updateDate);

        if (isActiveForStats) {
             let tagsToProcess: {name: string, color?: string}[] = [];
             
             if (card.tags && Array.isArray(card.tags)) {
                 card.tags.forEach((t: any) => {
                     const n = typeof t === 'string' ? t : (t.name || '');
                     const c = typeof t === 'object' ? t.bgColor : undefined;
                     if (n) tagsToProcess.push({ name: n, color: c });
                 });
             } else if (card.tags_data && Array.isArray(card.tags_data)) {
                 card.tags_data.forEach((t: any) => {
                     if (t.name) tagsToProcess.push({ name: t.name, color: t.color });
                 });
             } else if (card.tags_names) {
                  card.tags_names.split(',').forEach((t: string) => tagsToProcess.push({ name: t.trim() }));
             }

             const processedTagNames = new Set<string>();
             
             tagsToProcess.forEach(tObj => {
                const nameNorm = normalizeStr(tObj.name);
                
                if (!processedTagNames.has(nameNorm) && !OPERATIONAL_TAGS.has(nameNorm)) {
                    processedTagNames.add(nameNorm);
                    
                    let tagColor = tObj.color || '#C59D5F';
                    
                    if ((tagColor === '#C59D5F' || tagColor === '#fff') && globalTagMap.has(nameNorm)) {
                        const globalColor = globalTagMap.get(nameNorm)!.bgColor;
                        if (globalColor && globalColor !== '#C59D5F') tagColor = globalColor;
                    }

                    const current = servicesMap.get(tObj.name) || { name: tObj.name, value: 0, monetaryValue: 0, color: tagColor };
                    
                    if ((current.color === '#C59D5F' || current.color === '#fff') && tagColor && tagColor !== '#C59D5F') {
                        current.color = tagColor;
                    }

                    current.value++; 
                    if (isEffectiveWin) {
                        current.monetaryValue += monetaryVal;
                    }
                    servicesMap.set(tObj.name, current);
                }
             });

             const adData = extractAdData(card);
             if (adData.source) {
                const sourceKey = normalizeStr(adData.source);
                const currentSource = trafficMap.get(sourceKey) || { 
                    name: adData.source, value: 0, salesCount: 0, conversionRate: 0, color: '#808080' 
                };
                if (sourceKey.includes('google')) currentSource.color = '#4285F4';
                else if (sourceKey.includes('insta')) currentSource.color = '#E1306C';
                
                if (isDateInRange(creationDate)) currentSource.value++;
                if (isEffectiveWin) currentSource.salesCount++;
                if (currentSource.value > 0) currentSource.conversionRate = Math.round((currentSource.salesCount / currentSource.value) * 100);
                trafficMap.set(sourceKey, currentSource);
             }

             if (adData.name) {
                const cleanName = adData.name;
                const current = creativeMap.get(cleanName) || { 
                    id: cleanName, name: cleanName, url: adData.url || undefined, source: adData.source, leads: 0, sales: 0, revenue: 0 
                };
                if (isDateInRange(creationDate)) current.leads++;
                if (isEffectiveWin) { 
                    current.sales++; 
                    current.revenue += monetaryVal; 
                }
                creativeMap.set(cleanName, current);
             }
        }
    });

    pipeline.forEach(stage => {
        const filteredCards: CardSimple[] = [];
        let stageTotal = 0;

        stage.cards.forEach((card: any) => {
             const creationDate = parseDateSafe(card.createdAt);
             const updateDate = parseDateSafe(card.updatedAt);
             const contractDate = parseDateSafe(getCustomFieldValue(card, ['assinatura-do-contra', 'assinatura']));
             const meetingDate = parseDateSafe(getCustomFieldValue(card, ['data-da-reuni-o', 'reuniao']));
             
             if (isDateInRange(creationDate) || isDateInRange(updateDate) || isDateInRange(contractDate) || isDateInRange(meetingDate)) {
                 let val = getMonetaryValue(card.monetaryAmount || card.value);
                 if (val === 0) {
                     val = getMonetaryValue(getCustomFieldValue(card, ['valor', 'honorarios', 'honor-rios', 'preco', 'contrato']));
                 }

                 stageTotal += val;
                 
                 const displayTags: {name: string, color: string}[] = [];
                 
                 if (card.tags && Array.isArray(card.tags)) {
                     card.tags.slice(0,3).forEach((t:any) => displayTags.push({ name: t.name || 'Tag', color: t.bgColor || '#333'}));
                 } else if (card.tags_data && Array.isArray(card.tags_data)) {
                     card.tags_data.slice(0,3).forEach((t:any) => displayTags.push({ name: t.name, color: t.color || '#333' }));
                 } else if (card.tags_names) {
                     card.tags_names.split(',').slice(0,3).forEach((t: string) => displayTags.push({ name: t.trim(), color: '#333' }));
                 }

                 filteredCards.push({
                     id: String(card.id),
                     title: card.title || card.fullContact?.name || 'Sem Nome',
                     value: val,
                     responsibleName: card.responsibleUser?.name || 'Sem Resp.',
                     date: (contractDate || creationDate || new Date()).toLocaleDateString('pt-BR'),
                     tags: displayTags,
                     adName: extractAdData(card).name || undefined,
                     rawDate: (contractDate || creationDate || new Date()),
                     position: card.position || 0
                 } as any);
             }
        });

        filteredCards.sort((a: any, b: any) => {
             const posA = a.position !== undefined ? a.position : 9999;
             const posB = b.position !== undefined ? b.position : 9999;
             if (posA !== posB) return posA - posB;
             const dateA = a.rawDate ? new Date(a.rawDate).getTime() : 0;
             const dateB = b.rawDate ? new Date(b.rawDate).getTime() : 0;
             return dateB - dateA; 
        });

        stage.cards = filteredCards;
        stage.count = filteredCards.length;
        stage.value = stageTotal;
    });

    let chartStart = filterStartDate;
    let chartEnd = filterEndDate;

    if (dateFilter.preset === 'all') {
        if (hasData) {
            chartStart = minDataDate;
            chartEnd = maxDataDate;
        } else {
            chartStart = new Date(new Date().getFullYear(), 0, 1);
            chartEnd = new Date();
        }
    }
    
    if (chartStart.getFullYear() < 2000) chartStart = new Date(2023, 0, 1);
    
    const safeEnd = hasData && maxDataDate > new Date() ? maxDataDate : new Date();
    if (chartEnd > safeEnd) chartEnd = safeEnd;
    if (chartEnd < chartStart) chartEnd = chartStart;

    const chartDays = fillMissingDates(dailyRevenueMap, formatDateString(chartStart), formatDateString(chartEnd));
    const finalDailyRevenue = chartDays.map(d => ({
        day: d.date.split('-')[2] + '/' + d.date.split('-')[1], 
        fullDate: d.date,
        meta: currentData.currentGoals.revenueTarget / 30, 
        realizado: d.value,
        salesBreakdown: d.breakdown 
    }));

    const leadDays = fillMissingDates(dailyLeadsMap, formatDateString(chartStart), formatDateString(chartEnd));
    const finalDailyLeads = leadDays.map(d => ({
        day: d.date.split('-')[2] + '/' + d.date.split('-')[1], 
        count: d.value
    }));

    const finalServices = Array.from(servicesMap.values()).sort((a,b) => b.value - a.value).slice(0, 10);
    const finalCreatives = Array.from(creativeMap.values()).sort((a,b) => b.revenue - a.revenue);
    const finalTraffic = Array.from(trafficMap.values()).sort((a,b) => b.value - a.value);

    teamMap.forEach(m => {
        if (m.activity.leads > 0) m.activity.conversionRate = Math.round((m.activity.contractsSigned / m.activity.leads) * 100);
    });

    return {
        ...currentData,
        lastUpdated: new Date().toISOString(),
        metrics: {
            totalRevenue,
            totalContracts,
            totalCashFlow, 
            totalMeetings,
            totalCommission, 
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
