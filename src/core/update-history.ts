export interface UpdateEntry {
  date: string;
  title: string;
  summary: string;
}

const UPDATE_HISTORY: readonly UpdateEntry[] = Object.freeze([
  Object.freeze({
    date: '2026-08-13',
    title: '湲곗? ?깆옣怨?蹂몃? 袁몃?湲?',
    summary: 'cosmetic unlocks and the update history panel are now available from the base.',
  }),
  Object.freeze({
    date: '2026-08-13',
    title: '蹂몃? ?뚯뒪諛깆쓽 ?ㅽ궓',
    summary: 'Added mission progression rewards and base growth milestones.',
  }),
  Object.freeze({
    date: '2026-08-13',
    title: '由ъ듅 援ъ“ ?쒖옉',
    summary: 'Introduced the first playable rhythm rescue mission loop.',
  }),
]);

export function getUpdateHistory(): readonly UpdateEntry[] {
  return UPDATE_HISTORY;
}
