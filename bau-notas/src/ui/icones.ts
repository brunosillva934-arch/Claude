/**
 * Ícones disponíveis para os tipos de nota. Todos vêm embutidos no app
 * (biblioteca lucide, desenhados em SVG): nada é buscado na rede.
 * A chave é o que fica gravado no banco.
 */
import {
  Activity, Ambulance, Apple, Baby, Bandage, Biohazard, Bone, BookOpen, Bookmark, Brain, Bug, Calculator,
  CircleHelp, ClipboardList, Cog, Clock, Cross, Dna, Droplet, Ear, Eye, FileText, Flame, FlaskConical, Folder,
  GraduationCap, Hand, HeartPulse, Hospital, Lightbulb, ListChecks, Microscope, Newspaper, PersonStanding,
  Pill, Pipette, Radiation, Ribbon, Scale, Scan, Scissors, ShieldPlus, Skull, Star, Stethoscope, Syringe,
  Tablets, Tag, TestTube, Thermometer, TriangleAlert, Users, Wind, Zap,
  type LucideIcon,
} from 'lucide-react';

export const ICONES: Record<string, { nome: string; icone: LucideIcon }> = {
  coracao: { nome: 'Coração', icone: HeartPulse },
  comprimido: { nome: 'Comprimido', icone: Pill },
  frasco: { nome: 'Frasco', icone: FlaskConical },
  livro: { nome: 'Livro', icone: BookOpen },
  termometro: { nome: 'Termômetro', icone: Thermometer },
  prancheta: { nome: 'Prancheta', icone: ClipboardList },
  documento: { nome: 'Documento', icone: FileText },
  estetoscopio: { nome: 'Estetoscópio', icone: Stethoscope },
  seringa: { nome: 'Seringa', icone: Syringe },
  microscopio: { nome: 'Microscópio', icone: Microscope },
  tubo: { nome: 'Tubo de ensaio', icone: TestTube },
  pipeta: { nome: 'Pipeta', icone: Pipette },
  comprimidos: { nome: 'Comprimidos', icone: Tablets },
  atividade: { nome: 'Traçado', icone: Activity },
  engrenagem: { nome: 'Engrenagem', icone: Cog },
  imagem: { nome: 'Exame de imagem', icone: Scan },
  radiacao: { nome: 'Radiação', icone: Radiation },
  cerebro: { nome: 'Cérebro', icone: Brain },
  osso: { nome: 'Osso', icone: Bone },
  olho: { nome: 'Olho', icone: Eye },
  ouvido: { nome: 'Ouvido', icone: Ear },
  gota: { nome: 'Gota', icone: Droplet },
  vento: { nome: 'Respiração', icone: Wind },
  dna: { nome: 'DNA', icone: Dna },
  bacteria: { nome: 'Infecção', icone: Bug },
  risco: { nome: 'Risco biológico', icone: Biohazard },
  bebe: { nome: 'Pediatria', icone: Baby },
  pessoa: { nome: 'Pessoa', icone: PersonStanding },
  pessoas: { nome: 'Pessoas', icone: Users },
  mao: { nome: 'Mão', icone: Hand },
  curativo: { nome: 'Curativo', icone: Bandage },
  tesoura: { nome: 'Cirurgia', icone: Scissors },
  hospital: { nome: 'Hospital', icone: Hospital },
  ambulancia: { nome: 'Emergência', icone: Ambulance },
  escudo: { nome: 'Prevenção', icone: ShieldPlus },
  cruz: { nome: 'Cruz', icone: Cross },
  caveira: { nome: 'Gravidade', icone: Skull },
  alerta: { nome: 'Alerta', icone: TriangleAlert },
  raio: { nome: 'Raio', icone: Zap },
  chama: { nome: 'Chama', icone: Flame },
  fita: { nome: 'Fita', icone: Ribbon },
  maca: { nome: 'Nutrição', icone: Apple },
  balanca: { nome: 'Balança', icone: Scale },
  relogio: { nome: 'Relógio', icone: Clock },
  calculadora: { nome: 'Calculadora', icone: Calculator },
  lista: { nome: 'Lista', icone: ListChecks },
  formatura: { nome: 'Estudo', icone: GraduationCap },
  jornal: { nome: 'Artigo', icone: Newspaper },
  lampada: { nome: 'Ideia', icone: Lightbulb },
  duvida: { nome: 'Dúvida', icone: CircleHelp },
  estrela: { nome: 'Estrela', icone: Star },
  marcador: { nome: 'Marcador', icone: Bookmark },
  etiqueta: { nome: 'Etiqueta', icone: Tag },
  pasta: { nome: 'Pasta', icone: Folder },
};

export function iconeDoTipo(chave: string | undefined): LucideIcon {
  return (chave && ICONES[chave]?.icone) || FileText;
}
