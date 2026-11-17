/**
 * Os três formatos de nó da árvore.
 */
import { FileText, Hash, Heading, type LucideIcon } from 'lucide-react';
import type { Forma } from '../dados/tipos';

/** Os três formatos de nó, com o que cada um é. */
export const FORMAS: Array<{ id: Forma; nome: string; icone: LucideIcon; dica: string }> = [
  { id: 'nota', nome: 'Nota', icone: FileText, dica: 'Nota completa, com texto (mecanismo, quadro, conduta…).' },
  {
    id: 'topico',
    nome: 'Tópico',
    icone: Hash,
    dica: 'Item de lista: só o nome e, se quiser, uma recomendação curta, que aparece na árvore.',
  },
  {
    id: 'secao',
    nome: 'Seção',
    icone: Heading,
    dica: 'Só um título, em destaque, para agrupar os ramos (ex.: Dor torácica). Sem texto e sem tipo.',
  },
];
