/**
 * 픽셀 아이콘 (pixelarticons, MIT). 쓰는 것만 SVG 문자열로 번들에 넣는다.
 * fill="currentColor" 라서 CSS color 로 색을 바꾼다.
 */
const RAW = import.meta.glob(
  '../../node_modules/pixelarticons/svg/{sword,shield,potion,coins,store,backpack,crown,skull,fire,zap,smile,frown,angry,annoyed,leaf,sparkles,sparkle,castle,home,map,heart,trophy,wand,target,menu,diamond-gem,book-open,hourglass,share,download,search,bed,arrow-down,arrow-left,arrow-right,door-closed,gift,lock,check,close,user,briefcase,chart-line,warning-diamond,moon,sun}.svg',
  { query: '?raw', import: 'default', eager: true },
) as Record<string, string>;

const SVG: Record<string, string> = {};
for (const [path, svg] of Object.entries(RAW)) {
  const name = path.slice(path.lastIndexOf('/') + 1, -4);
  SVG[name] = svg.replace(/ width="24" height="24"/, '').replace('<svg ', '<svg aria-hidden="true" ');
}

export type IconName =
  | 'sword' | 'shield' | 'potion' | 'coins' | 'store' | 'backpack' | 'crown' | 'skull' | 'fire' | 'zap'
  | 'smile' | 'frown' | 'angry' | 'annoyed' | 'leaf' | 'sparkles' | 'sparkle' | 'castle' | 'home' | 'map'
  | 'heart' | 'trophy' | 'wand' | 'target' | 'menu' | 'diamond-gem' | 'book-open' | 'hourglass' | 'share'
  | 'download' | 'search' | 'bed' | 'arrow-down' | 'arrow-left' | 'arrow-right' | 'door-closed' | 'gift'
  | 'lock' | 'check' | 'close' | 'user' | 'briefcase' | 'chart-line' | 'warning-diamond' | 'moon' | 'sun';

/** <i class="ic">svg</i> */
export function icon(name: IconName, cls = ''): string {
  return `<i class="ic ${cls}">${SVG[name] ?? ''}</i>`;
}

export const hasIcon = (name: string) => !!SVG[name];
