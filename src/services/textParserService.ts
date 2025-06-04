import { KilledMonster, LootedItem } from '../types';

export interface SessionDataExtract {
  start_datetime?: Date;
  end_datetime?: Date;
  duration_minutes?: number;
  raw_xp_gain?: number;
  total_xp_gain?: number;
  raw_xp_per_hour?: number;
  total_xp_per_hour?: number;
  loot_value?: number;
  supplies_value?: number;
  balance?: number;
  damage_dealt?: number;
  damage_per_hour?: number;
  healing_done?: number;
  healing_per_hour?: number;
  killed_monsters?: KilledMonster[];
  looted_items?: LootedItem[];
}

interface ParserStrategy {
  canParse: (text: string) => boolean;
  parse: (text: string) => SessionDataExtract;
}

// Parser para o formato atual
class StandardFormatParser implements ParserStrategy {
  private numberFormat: 'format1' | 'format2' | 'unknown' = 'unknown';

  canParse(text: string): boolean {
    return text.includes('Session data:');
  }

  private detectNumberFormat(text: string): 'format1' | 'format2' | 'unknown' {
    const numericKeywords = ["Raw XP Gain", "XP Gain", "XP/h", "Raw XP/h", "Loot", "Supplies", "Balance", "Damage", "Healing"];
    for (const keyword of numericKeywords) {
        const escapedKeyword = keyword.replace(/[.*+?^${}()|[\\\]]/g, '\\$&');
        const regex = new RegExp(`${escapedKeyword}:\\s*([\\d.,]+)`);
        const match = text.match(regex);

        if (match && match[1]) {
            const sampleNumber = match[1];
            const hasDot = sampleNumber.includes('.');
            const hasComma = sampleNumber.includes(',');

            if (hasDot && hasComma) {
                if (sampleNumber.lastIndexOf('.') > sampleNumber.lastIndexOf(',')) {
                    return 'format1';
                } else {
                    return 'format2';
                }
            } else if (hasComma) {
                return 'format1';
            } else if (hasDot) {
                return 'format2';
            }
        }
    }
    console.warn('[detectNumberFormat] Formato numérico não pôde ser determinado. Usando \'unknown\'.');
    return 'unknown';
  }

  parse(text: string): SessionDataExtract {
    this.numberFormat = this.detectNumberFormat(text);
    console.log(`[TextParser] Formato numérico detectado: ${this.numberFormat}`);
    const result: SessionDataExtract = {};
    
    let dateMatch = text.match(/From (.*?) to (.*?) Session:/);
    if (!dateMatch) {
      dateMatch = text.match(/Session data: From (.*?) to (.*?)(?:\n|$)/m);
    }
    
    if (dateMatch && dateMatch[1] && dateMatch[2]) {
      try {
        result.start_datetime = new Date(dateMatch[1].replace(/, /g, ' '));
        result.end_datetime = new Date(dateMatch[2].replace(/, /g, ' '));
      } catch (e) {
        console.error('[TextParser] Erro ao parsear datas:', e, 'Datas originais:', dateMatch[1], dateMatch[2]);
      }
    }
    
    const durationMatch = text.match(/Session: ([\d:]+h)/);
    if (durationMatch && durationMatch[1]) {
      result.duration_minutes = this.parseDuration(durationMatch[1]);
    }
    
    const xpMatch = text.match(/Raw XP Gain: ([\d.,]+)[\s\S]*?XP Gain: ([\d.,]+)/m);
    if (xpMatch && xpMatch[1] && xpMatch[2]) {
      result.raw_xp_gain = this.parseNumber(xpMatch[1]);
      result.total_xp_gain = this.parseNumber(xpMatch[2]);
    }
    
    let xpHourMatch = text.match(/XP\/h: ([\d.,]+)[\s\S]*?Raw XP\/h: ([\d.,]+)/m);
    if (xpHourMatch && xpHourMatch[1] && xpHourMatch[2]) {
      result.total_xp_per_hour = this.parseNumber(xpHourMatch[1]);
      result.raw_xp_per_hour = this.parseNumber(xpHourMatch[2]);
    } else {
      xpHourMatch = text.match(/Raw XP\/h: ([\d.,]+)[\s\S]*?XP\/h: ([\d.,]+)/m);
      if (xpHourMatch && xpHourMatch[1] && xpHourMatch[2]) {
        result.raw_xp_per_hour = this.parseNumber(xpHourMatch[1]);
        result.total_xp_per_hour = this.parseNumber(xpHourMatch[2]);
      }
    }
        
    const lootMatch = text.match(/Loot: ([\d.,]+)[\s\S]*?Supplies: ([\d.,]+)[\s\S]*?Balance: ([\d.,]+)/m);
    if (lootMatch && lootMatch[1] && lootMatch[2] && lootMatch[3]) {
      result.loot_value = this.parseNumber(lootMatch[1]);
      result.supplies_value = this.parseNumber(lootMatch[2]);
      result.balance = this.parseNumber(lootMatch[3]);
    }
    
    const damageMatch = text.match(/Damage: ([\d.,]+)[\s\S]*?Damage\/h: ([\d.,]+)/m);
    if (damageMatch && damageMatch[1] && damageMatch[2]) {
      result.damage_dealt = this.parseNumber(damageMatch[1]);
      result.damage_per_hour = this.parseNumber(damageMatch[2]);
    }
    
    const healingMatch = text.match(/Healing: ([\d.,]+)[\s\S]*?Healing\/h: ([\d.,]+)/m);
    if (healingMatch && healingMatch[1] && healingMatch[2]) {
      result.healing_done = this.parseNumber(healingMatch[1]);
      result.healing_per_hour = this.parseNumber(healingMatch[2]);
    }
    
    const commonStopKeywords = [
      'Session:',
      'From ',
      'XP Gain:',
      'Raw XP Gain:',
      'XP/h:',
      'Raw XP/h:',
      'Supplies:',
      'Balance:',
      'Damage:',
      'Damage/h:',
      'Healing:',
      'Healing/h:'
    ];

    // For Killed Monsters, stop at Looted Items section, other common headers at line start, or end of string.
    // Temporarily removing blank line stop condition for wider capture.
    const kmLookaheadStopPatterns = [
      ...commonStopKeywords.map(k => `(?:^${k.replace(/[.*+?^${}()|[\\]]/g, '\\$&')})`),
      '(?:^(?:Looted Items|Items Looted|Itens Coletados))'
    ].join('|');
    // Switching to greedy match for the main content capture
    const killedMonstersRegex = new RegExp(`(?:Killed Monsters|Monsters Killed|Monstros Mortos):\\s*\\n?([\\s\\S]*)(?=${kmLookaheadStopPatterns}|$)`, 'im');
    const killedMonstersMatch = text.match(killedMonstersRegex);
    console.log('[TextParser] killedMonstersRegex used (greedy, no blank line stop):', killedMonstersRegex.source);
    console.log('[TextParser] killedMonstersMatch (greedy, no blank line stop):', killedMonstersMatch);
    if (killedMonstersMatch && killedMonstersMatch[1]) {
      console.log('[TextParser] Bloco de texto para parseKilledMonsters (raw - greedy, no blank line stop):', JSON.stringify(killedMonstersMatch[1]));
      result.killed_monsters = this.parseKilledMonsters(killedMonstersMatch[1].trim());
    } else {
      console.log('[TextParser] Nenhum match para Killed Monsters com (greedy, no blank line stop).');
      result.killed_monsters = [];
    }
    
    // For Looted Items, stop at other common headers at line start, or end of string.
    // Temporarily removing blank line stop condition for wider capture.
    const liLookaheadStopKeywords = commonStopKeywords.filter(k => !k.toLowerCase().startsWith('loot'));
    const liLookaheadStopPatterns = [
      ...liLookaheadStopKeywords.map(k => `(?:^${k.replace(/[.*+?^${}()|[\\]]/g, '\\$&')})`)
    ].join('|');
    // Switching to greedy match for the main content capture
    const lootedItemsRegex = new RegExp(`(?:Looted Items|Items Looted|Itens Coletados):\\s*\\n?([\\s\\S]*)(?=${liLookaheadStopPatterns}|$)`, 'im');
    const lootedItemsMatch = text.match(lootedItemsRegex);
    console.log('[TextParser] lootedItemsRegex used (greedy, no blank line stop):', lootedItemsRegex.source);
    console.log('[TextParser] lootedItemsMatch (greedy, no blank line stop):', lootedItemsMatch);
    if (lootedItemsMatch && lootedItemsMatch[1]) {
      console.log('[TextParser] Bloco de texto para parseLootedItems (raw - greedy, no blank line stop):', JSON.stringify(lootedItemsMatch[1]));
      result.looted_items = this.parseLootedItems(lootedItemsMatch[1].trim());
    } else {
      console.log('[TextParser] Nenhum match para Looted Items com (greedy, no blank line stop).');
      result.looted_items = [];
    }
    console.log('[TextParser] Resultado final do parse (após greedy, no blank line stop):', result);
    return result;
  }
  
  private parseNumber(str: string): number {
    let cleanedStr = str.trim();

    if (!cleanedStr.match(/[\d]/)) {
        console.warn(`[TextParser] String '${str}' não parece conter dígitos após trim. Retornando NaN.`);
        return NaN;
    }

    if (this.numberFormat === 'format1') { 
        cleanedStr = cleanedStr.replace(/,/g, ''); 
    } else if (this.numberFormat === 'format2') { 
        cleanedStr = cleanedStr.replace(/\./g, '');
        cleanedStr = cleanedStr.replace(/,/g, '.'); 
    } else { 
        const hasDot = cleanedStr.includes('.');
        const hasComma = cleanedStr.includes(',');

        if (hasDot && hasComma) {
            if (cleanedStr.lastIndexOf('.') > cleanedStr.lastIndexOf(',')) { 
                cleanedStr = cleanedStr.replace(/,/g, '');
            } else { 
                cleanedStr = cleanedStr.replace(/\./g, '');
                cleanedStr = cleanedStr.replace(/,/g, '.');
            }
        } else if (hasComma) { 
            if (cleanedStr.split(',').length - 1 === 1 && cleanedStr.match(/,\d{1,2}$/)) {
                 cleanedStr = cleanedStr.replace(/,/g, '.'); 
            } else { 
                 cleanedStr = cleanedStr.replace(/,/g, ''); 
            }
        } else if (hasDot) { 
            const dotParts = cleanedStr.split('.');
            if (dotParts.length > 2) {
                cleanedStr = dotParts.join('');
            } else if (dotParts.length === 2) { 
                if (dotParts[1].length === 3 && dotParts[0].length > 0) { 
                     cleanedStr = dotParts.join('');
                }
            }
        }
    }
    
    const num = parseFloat(cleanedStr);
    if (isNaN(num)) {
        console.warn(`[TextParser] Falha ao converter string '${str}' (limpa: '${cleanedStr}') para número. Formato detectado: ${this.numberFormat}`);
        return 0; 
    }
    return num;
  }
  
  private parseDuration(duration: string): number {
    const [hours, minutes] = duration.replace('h', '').split(':').map(Number);
    return hours * 60 + minutes;
  }
  
  private parseKilledMonsters(monstersText: string): KilledMonster[] {
    console.log('[TextParser] parseKilledMonsters recebido (após trim inicial):', JSON.stringify(monstersText));
    const lines = monstersText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    console.log('[TextParser] Linhas de monstros (após split por \n e trim):', lines);
    const result: KilledMonster[] = [];
    for (const line of lines) {
      // Dividir cada linha por vírgula para lidar com múltiplos monstros na mesma linha
      const monsterEntries = line.split(',').map(entry => entry.trim()).filter(entry => entry.length > 0);
      console.log(`[TextParser] Entradas de monstros da linha '${line}' (após split por vírgula):`, monsterEntries);
      for (const entry of monsterEntries) {
        const match = entry.match(/(\d+)x\s+(.+)/);
        console.log(`[TextParser] Entrada do monstro: '${entry}', Match:`, match);
        if (match && match[1] && match[2]) {
          const count = parseInt(match[1], 10);
          const name = match[2].trim();
          if (!isNaN(count) && name) {
            result.push({ count, name });
          } else {
            console.warn(`[TextParser] Monstro ignorado devido a contagem inválida ou nome vazio: count=${count}, name='${name}'`);
          }
        } else {
          console.warn(`[TextParser] Nenhum match para a entrada de monstro: '${entry}'`);
        }
      }
    }
    console.log('[TextParser] Monstros parseados:', result);
    return result;
  }
  
  private parseLootedItems(itemsText: string): LootedItem[] {
    console.log('[TextParser] parseLootedItems recebido (após trim inicial):', JSON.stringify(itemsText));
    const lines = itemsText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    console.log('[TextParser] Linhas de itens (após split por \n e trim):', lines);
    const result: LootedItem[] = [];
    for (const line of lines) {
      // Dividir cada linha por vírgula para lidar com múltiplos itens na mesma linha
      const itemEntries = line.split(',').map(entry => entry.trim()).filter(entry => entry.length > 0);
      console.log(`[TextParser] Entradas de itens da linha '${line}' (após split por vírgula):`, itemEntries);
      for (const entry of itemEntries) {
        const match = entry.match(/(\d+)x\s+(.+)/);
        console.log(`[TextParser] Entrada do item: '${entry}', Match:`, match);
        if (match && match[1] && match[2]) {
          const count = parseInt(match[1], 10);
          const name = match[2].trim();
          if (!isNaN(count) && name) {
            result.push({ count, name });
          } else {
            console.warn(`[TextParser] Item ignorado devido a contagem inválida ou nome vazio: count=${count}, name='${name}'`);
          }
        } else {
          console.warn(`[TextParser] Nenhum match para a entrada de item: '${entry}'`);
        }
      }
    }
    console.log('[TextParser] Itens parseados:', result);
    return result;
  }
}

// Parser para formato alternativo (exemplo)
class AlternativeFormatParser implements ParserStrategy {
  canParse(text: string): boolean {
    return text.includes('Hunt Summary:');
  }
  
  parse(text: string): SessionDataExtract {
    const result: SessionDataExtract = {};
    
    // Implementar lógica para extrair dados do formato alternativo
    // Este é apenas um exemplo, você precisará adaptar para seus formatos reais
    
    // Extrair datas (formato alternativo)
    const dateMatch = text.match(/Hunt period: (.*?) - (.*?)\n/);
    if (dateMatch) {
      result.start_datetime = new Date(dateMatch[1]);
      result.end_datetime = new Date(dateMatch[2]);
    }
    
    // Extrair outros dados...
    
    return result;
  }
}

// Adicione esta nova classe de parser
class NewFormatParser implements ParserStrategy {
  canParse(text: string): boolean {
    // Verifique se o texto está no formato esperado
    return text.includes('Relatório de Caça:') || text.includes('Resumo da Sessão:');
  }
  
  parse(text: string): SessionDataExtract {
    const result: SessionDataExtract = {};
    
    // Extrair datas (formato novo)
    const dateMatch = text.match(/Período: (.*?) até (.*?)\n/);
    if (dateMatch) {
      result.start_datetime = new Date(dateMatch[1]);
      result.end_datetime = new Date(dateMatch[2]);
    }
    
    // Extrair XP (formato novo)
    const xpMatch = text.match(/Experiência: ([\d\.]+)/);
    if (xpMatch) {
      result.total_xp_gain = parseInt(xpMatch[1].replace(/\./g, ''));
    }
    
    // Extrair outros dados específicos deste formato...
    
    return result;
  }
}

// Na classe TextParserService, adicione o novo parser ao construtor
export class TextParserService {
  private parsers: ParserStrategy[] = [];
  
  constructor() {
    // Registrar todos os parsers disponíveis
    this.parsers.push(new StandardFormatParser());
    this.parsers.push(new AlternativeFormatParser());
    this.parsers.push(new NewFormatParser()); // Adicione o novo parser aqui
  }
  
  parseSessionData(text: string): SessionDataExtract | null {
    // Encontrar o primeiro parser que pode processar o texto
    for (const parser of this.parsers) {
      if (parser.canParse(text)) {
        return parser.parse(text);
      }
    }
    
    // Nenhum parser encontrado
    return null;
  }
  
  // Método para tentar extrair o máximo de informações possível
  // No método extractAnyAvailableData da classe TextParserService
  
  extractAnyAvailableData(text: string): SessionDataExtract {
    const result: SessionDataExtract = {};
    
    // Inicializar arrays para evitar erros de null/undefined
    result.killed_monsters = [];
    result.looted_items = [];
    
    // Tentar extrair datas com vários formatos possíveis
    const datePatterns = [
      /From (.*?) to (.*?) Session:/,
      /Session data: From (.*?) to (.*?)$/,  // Novo padrão para o formato mostrado
      /Hunt period: (.*?) - (.*?)\n/,
      /Start: (.*?) End: (.*?)\n/,
      /Período: (.*?) até (.*?)\n/,
      /Data: (.*?) a (.*?)\n/
    ];
    
    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match) {
        try {
          result.start_datetime = new Date(match[1]);
          result.end_datetime = new Date(match[2]);
          break;
        } catch (e) {
          // Continuar tentando outros padrões
        }
      }
    }
    
    // Tentar extrair XP com vários formatos possíveis
    const xpPatterns = [
      /XP Gain: ([\d,\.]+)/i,
      /Experience: ([\d,\.]+)/i,
      /Gained XP: ([\d,\.]+)/i,
      /Experiência: ([\d\.]+)/i,
      /XP: ([\d\.]+)/i
    ];
    
    for (const pattern of xpPatterns) {
      const match = text.match(pattern);
      if (match) {
        try {
          result.total_xp_gain = parseInt(match[1].replace(/[,\.]/g, ''));
          break;
        } catch (e) {
          // Continuar tentando outros padrões
        }
      }
    }
    
    // Tentar extrair loot com vários formatos possíveis
    const lootPatterns = [
      /Loot: ([\d,\.]+)/i,
      /Loot Value: ([\d,\.]+)/i,
      /Valor do Loot: ([\d\.]+)/i
    ];
    
    for (const pattern of lootPatterns) {
      const match = text.match(pattern);
      if (match) {
        try {
          result.loot_value = parseInt(match[1].replace(/[,\.]/g, ''));
          break;
        } catch (e) {
          // Continuar tentando outros padrões
        }
      }
    }
    
    // Tentar extrair supplies com vários formatos possíveis
    const suppliesPatterns = [
      /Supplies: ([\d,\.]+)/i,
      /Supplies Cost: ([\d,\.]+)/i,
      /Custo de Suprimentos: ([\d\.]+)/i
    ];
    
    for (const pattern of suppliesPatterns) {
      const match = text.match(pattern);
      if (match) {
        try {
          result.supplies_value = parseInt(match[1].replace(/[,\.]/g, ''));
          break;
        } catch (e) {
          // Continuar tentando outros padrões
        }
      }
    }
    
    // Tentar extrair balance com vários formatos possíveis
    const balancePatterns = [
      /Balance: ([\d,\.\-]+)/i,
      /Profit: ([\d,\.\-]+)/i,
      /Lucro: ([\d\.\-]+)/i
    ];
    
    for (const pattern of balancePatterns) {
      const match = text.match(pattern);
      if (match) {
        try {
          result.balance = parseInt(match[1].replace(/[,\.]/g, ''));
          break;
        } catch (e) {
          // Continuar tentando outros padrões
        }
      }
    }
    
    // Tentar extrair monstros mortos com vários formatos possíveis
    // Este é mais complexo e pode precisar de lógica específica para cada formato
    const monsterSections = [
      /Killed Monsters: (.*?)(?=Looted Items:|$)/i,
      /Monsters Killed: (.*?)(?=Items Looted:|$)/i,
      /Monstros Mortos: (.*?)(?=Itens Saqueados:|$)/i
    ];
    
    // Na seção de extração de monstros mortos
    for (const pattern of monsterSections) {
    const match = text.match(pattern);
    if (match && match[1]) {
      try {
        // Tentar diferentes formatos de lista de monstros
        const monsterText = match[1].trim();
        
        // Formato: "5 rats, 3 goblins"
        if (monsterText.includes(',')) {
          const monsters = monsterText.split(',').map(m => m.trim());
          result.killed_monsters = monsters.map(monster => {
            const parts = monster.split(' ');
            const count = parseInt(parts[0]);
            const name = parts.slice(1).join(' ');
            return { count, name };
          }).filter(m => !isNaN(m.count) && m.name);
          break;
        }
        
        // Formato: "5 rats 3 goblins"
        else {
          const monsters = monsterText.split(' ');
          const monstersArray: KilledMonster[] = [];
          
          for (let i = 0; i < monsters.length; i += 2) {
            if (monsters[i] && monsters[i + 1]) {
              const count = parseInt(monsters[i]);
              const name = monsters[i + 1];
              if (!isNaN(count)) {
                monstersArray.push({ count, name });
              }
            }
          }
          
          result.killed_monsters = monstersArray;
          break;
        }
      } catch (e) {
        // Continuar tentando outros padrões
      }
    }
  }
    
    // Calcular campos ausentes quando possível
    if (result.start_datetime && result.end_datetime && !result.duration_minutes) {
      const diffMs = result.end_datetime.getTime() - result.start_datetime.getTime();
      result.duration_minutes = Math.round(diffMs / (1000 * 60));
    }
    
    if (result.total_xp_gain && result.duration_minutes && !result.total_xp_per_hour) {
      result.total_xp_per_hour = Math.round(result.total_xp_gain * 60 / result.duration_minutes);
    }
    
    return result;
  }
}

export const textParserService = new TextParserService();