/**
 * Lógica para determinar células azuis (Blue Cells) no Timesheet
 * Baseado na especificação de BLUE_CELLS_FEATURE.md
 */

import { WorkItemRevision, ProcessStateMap } from './timesheet-types';

/**
 * Determina se uma célula deve ser destacada em azul.
 *
 * Uma célula é azul quando, na data correspondente:
 * 1. O Work Item estava em estado "InProgress"
 * 2. O Work Item estava atribuído ao usuário logado
 *
 * @param revisions Lista de revisões do Work Item
 * @param cellDate Data da célula (YYYY-MM-DD)
 * @param userId ID do usuário logado no Azure DevOps
 * @param stateMap Dicionário estado -> categoria
 * @returns true se deve destacar em azul
 */
export function isBlueCell(
  revisions: WorkItemRevision[],
  cellDate: string,
  userId: string,
  stateMap: ProcessStateMap
): boolean {
  if (!revisions || revisions.length === 0) {
    return false;
  }

  // Converter cellDate para Date (início do dia UTC)
  const cellDateTime = new Date(cellDate + 'T00:00:00Z');

  // 1. Encontrar a revisão válida para aquele dia
  // Filtrar revisões até a data da célula
  const validRevisions = revisions.filter(rev => {
    const changedDate = new Date(rev.fields['System.ChangedDate']);
    return changedDate <= cellDateTime;
  });

  if (validRevisions.length === 0) {
    return false;
  }

  // Ordenar por data decrescente e pegar a mais recente
  const activeRevision = validRevisions.sort((a, b) => {
    const dateA = new Date(a.fields['System.ChangedDate']);
    const dateB = new Date(b.fields['System.ChangedDate']);
    return dateB.getTime() - dateA.getTime();
  })[0];

  // 2. Validar estado e atribuição
  const state = activeRevision.fields['System.State'];
  const assignedToId = activeRevision.fields['System.AssignedTo']?.id;

  // Validar se state existe antes de usar como índice
  if (!state) {
    return false;
  }

  // 3. Aplicar as regras de negócio
  const category = stateMap[state];
  const isInProgress = category === 'InProgress';
  const isAssignedToMe = assignedToId === userId;

  return isInProgress && isAssignedToMe;
}

/**
 * Determina quais células de uma linha devem ser azuis.
 *
 * @param revisions Lista de revisões do Work Item
 * @param weekDates Array com as 7 datas da semana (YYYY-MM-DD)
 * @param userId ID do usuário logado
 * @param stateMap Dicionário estado -> categoria
 * @returns Array de 7 booleanos indicando se cada célula é azul
 */
export function getBlueCellsForWeek(
  revisions: WorkItemRevision[],
  weekDates: string[],
  userId: string,
  stateMap: ProcessStateMap
): boolean[] {
  return weekDates.map(date =>
    isBlueCell(revisions, date, userId, stateMap)
  );
}