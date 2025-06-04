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
  canParse(text: string): boolean {
    return text.includes('Session data:');
  }

  // Na classe StandardFormatParser, modifique o método parse
  parse(text: string): SessionDataExtract {
    const result: SessionDataExtract = {};
    
    // Extrair datas - padrão já corrigido
    let dateMatch = text.match(/From (.*?) to (.*?) Session:/);
    if (!dateMatch) {
      // Formato atual
      dateMatch = text.match(/Session data: From (.*?) to (.*?)(?:\n|$)/);
    }
    
    if (dateMatch) {
      result.start_datetime = new Date(dateMatch[1]);
      result.end_datetime = new Date(dateMatch[2]);
    }
    
    // Extrair duração
    const durationMatch = text.match(/Session: ([\d:]+h)/);
    if (durationMatch) {
      result.duration_minutes = this.parseDuration(durationMatch[1]);
    }
    
    // Extrair XP - ajustar para usar pontos como separadores
    const xpMatch = text.match(/Raw XP Gain: ([\d\.]+)[\s\n]+XP Gain: ([\d\.]+)/);
    if (xpMatch) {
      result.raw_xp_gain = this.parseNumber(xpMatch[1]);
      result.total_xp_gain = this.parseNumber(xpMatch[2]);
    }
    
    // Extrair XP por hora - ajustar para usar pontos como separadores
    const xpHourMatch = text.match(/XP\/h: ([\d\.]+)[\s\n]+Raw XP\/h: ([\d\.]+)/);
    if (xpHourMatch) {
      result.total_xp_per_hour = this.parseNumber(xpHourMatch[1]);
      result.raw_xp_per_hour = this.parseNumber(xpHourMatch[2]);
    }
    
    // Extrair informações de loot - ajustar para usar pontos como separadores
    const lootMatch = text.match(/Loot: ([\d\.]+)[\s\n]+Supplies: ([\d\.]+)[\s\n]+Balance: ([\d\.]+)/);
    if (lootMatch) {
      result.loot_value = this.parseNumber(lootMatch[1]);
      result.supplies_value = this.parseNumber(lootMatch[2]);
      result.balance = this.parseNumber(lootMatch[3]);
    }
    
    // Extrair informações de dano - ajustar para usar pontos como separadores
    const damageMatch = text.match(/Damage: ([\d\.]+)[\s\n]+Damage\/h: ([\d\.]+)/);
    if (damageMatch) {
      result.damage_dealt = this.parseNumber(damageMatch[1]);
      result.damage_per_hour = this.parseNumber(damageMatch[2]);
    }
    
    // Extrair informações de cura - ajustar para usar pontos como separadores
    const healingMatch = text.match(/Healing: ([\d\.]+)[\s\n]+Healing\/h: ([\d\.]+)/);
    if (healingMatch) {
      result.healing_done = this.parseNumber(healingMatch[1]);
      result.healing_per_hour = this.parseNumber(healingMatch[2]);
    }
    
    // Extrair monstros mortos - ajustar para o novo formato com quebras de linha
    const killedMonstersSection = text.match(/Killed Monsters:[\s\S]*?(?=Looted Items:|$)/);
    if (killedMonstersSection) {
      result.killed_monsters = this.parseKilledMonsters(killedMonstersSection[0]);
    }
    
    // Extrair itens saqueados - ajustar para o novo formato com quebras de linha
    const lootedItemsSection = text.match(/Looted Items:[\s\S]*$/);
    if (lootedItemsSection) {
      result.looted_items = this.parseLootedItems(lootedItemsSection[0]);
    }
    
    return result;
  }
  
  private parseNumber(str: string): number {
    // Substituir pontos por nada (remover separadores de milhar)
    return parseInt(str.replace(/\./g, ''));
  }
  
  private parseDuration(duration: string): number {
    const [hours, minutes] = duration.replace('h', '').split(':').map(Number);
    return hours * 60 + minutes;
  }
  
  private parseKilledMonsters(text: string): KilledMonster[] {
    // Remover o cabeçalho "Killed Monsters:"
    const cleanText = text.replace(/Killed Monsters:/, '').trim();
    
    // Dividir por linhas e remover linhas vazias
    const lines = cleanText.split('\n').map(line => line.trim()).filter(line => line);
    
    const result: KilledMonster[] = [];
    
    for (const line of lines) {
      // Formato esperado: "3x Cliff Strider"
      const match = line.match(/(\d+)x\s+(.+)/);
      if (match) {
        const count = parseInt(match[1]);
        const name = match[2].trim();
        if (!isNaN(count) && name) {
          result.push({ count, name });
        }
      }
    }
    
    return result;
  }
  
  private parseLootedItems(text: string): LootedItem[] {
    // Remover o cabeçalho "Looted Items:"
    const cleanText = text.replace(/Looted Items:/, '').trim();
    
    // Dividir por linhas e remover linhas vazias
    const lines = cleanText.split('\n').map(line => line.trim()).filter(line => line);
    
    const result: LootedItem[] = [];
    
    for (const line of lines) {
      // Formato esperado: "1x brown crystal splinter"
      const match = line.match(/(\d+)x\s+(.+)/);
      if (match) {
        const count = parseInt(match[1]);
        const name = match[2].trim();
        if (!isNaN(count) && name) {
          result.push({ count, name });
        }
      }
    }
    
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