import { GENERATED_UPDATE_HISTORY } from './update-history.generated';

export interface UpdateEntry {
  date: string;
  title: string;
  summary: string;
}

const FALLBACK_UPDATE_HISTORY: readonly UpdateEntry[] = Object.freeze([
  Object.freeze({
    date: '2026-08-13',
    title: '기지 성장과 본부 꾸미기',
    summary: '기지에서 꾸미기 아이템 해금과 업데이트 내역 패널을 사용할 수 있습니다.',
  }),
  Object.freeze({
    date: '2026-08-12',
    title: '구조 피드백과 접근성',
    summary: '수리 신호 입력에 소리·진동 피드백과 접근성 설정을 추가했습니다.',
  }),
  Object.freeze({
    date: '2026-08-11',
    title: '본부 시스템의 스킨',
    summary: '임무 보상과 기지 성장 마일스톤을 추가했습니다.',
  }),
  Object.freeze({
    date: '2026-08-10',
    title: '리듬 구조 시작',
    summary: '첫 번째 리듬 구조 임무 플레이 루프를 추가했습니다.',
  }),
]);

const UPDATE_HISTORY: readonly UpdateEntry[] = Object.freeze(
  (GENERATED_UPDATE_HISTORY.length > 0 ? GENERATED_UPDATE_HISTORY : FALLBACK_UPDATE_HISTORY).map(
    (entry) => Object.freeze({ ...entry }),
  ),
);

export function getUpdateHistory(): readonly UpdateEntry[] {
  return UPDATE_HISTORY;
}
