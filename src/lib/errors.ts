/**
 * unknown 으로 잡힌 예외에서 사람이 읽을 메시지를 뽑는다.
 *
 * TypeScript 4.4+ 에서 catch 파라미터는 unknown 이 기본이다. `catch (e: unknown)` 로
 * 열어 두면 errorMessage(e) 가 런타임에 undefined 일 수 있는데도 타입 검사를 통과한다.
 */
export function errorMessage(e: unknown): string {
  if (e instanceof Error) return errorMessage(e);
  if (typeof e === 'string') return e;
  return String(e);
}
