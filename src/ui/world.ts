import type { Item, LifeState } from '../types';
import { MARKET, MARKET_CATS, marketPrice, owns, type MarketCat } from '../data/market';
import { RARITY_NAME, biomeOf } from '../data/items';
import { combatPower } from '../engine/combat';
import { DUNGEON_DEPTH, DUNGEON_MIN_AGE, canEnterDungeon, preview, startFloors } from '../engine/dungeon';
import { INN_PRICE, bagCap, fmtGold, goldOf, maxHp } from '../engine/economy';
import { icon, type IconName } from './icons';

const esc = (v: string | number) =>
  String(v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

const KIND_ICON: Record<Item['kind'], IconName> = { weapon: 'sword', armor: 'shield', potion: 'potion', loot: 'diamond-gem' };

/** HP 막대 */
export function hpBar(s: LifeState): string {
  const hp = s.hp ?? maxHp(s);
  const max = maxHp(s);
  const pct = Math.round((hp / max) * 100);
  return `<span class="hpbar ${pct < 30 ? 'low' : ''}">${icon('heart')}<i><u style="width:${pct}%"></u></i><small>${hp}/${max}</small></span>`;
}

/** 골드 · 전투력 · HP 요약 줄 */
export function econRow(s: LifeState): string {
  const inc = s.lastIncome ?? 0;
  return `
    <div class="econ">
      <span class="gold ${goldOf(s) < 0 ? 'debt' : ''}" title="골드 (작년 ${inc >= 0 ? '+' : ''}${fmtGold(inc)})">${icon('coins')}${fmtGold(goldOf(s))}</span>
      <span class="cp" title="전투력: 누르면 내역" data-act="stat" data-arg="cp">${icon('sword')}${combatPower(s)}</span>
      ${hpBar(s)}
    </div>`;
}

// ───────────────────────── 던전 ─────────────────────────

export function viewDungeon(s: LifeState, duelHtml = ''): string {
  const d = s.dive;
  const head = `
    <div class="dg-head">
      <div>
        <p class="eyebrow">던전 · 시간이 흐르지 않는다</p>
        <h2>${d && d.floor > 0 ? `${esc(biomeOf(d.floor).name)} · <b>${d.floor}</b>층` : '던전 입구'} <span class="muted small">/ ${DUNGEON_DEPTH}층</span></h2>
      </div>
      ${econRow(s)}
    </div>`;
  const scene = `<div class="scene-host" data-gfx="scene" data-maxh="${Math.floor(window.innerHeight * 0.32)}"></div>`;
  const potions = (s.bag ?? []).filter((x) => x.kind === 'potion').length;

  // 보스와 턴제 전투 중
  if (duelHtml) return `${head}${scene}<div class="dg-card">${duelHtml}</div>`;
  if (d?.fallen) {
    return `${head}${scene}
      <div class="dg-card dead">
        <p class="death-cause">${icon('skull')} 던전에서 쓰러졌다… 하지만 살아남았다</p>
        <p class="warn">장비·소지품·돈을 모두 잃었다. 3년간 악몽(스트레스 100), ${s.dgBanUntil}세까지 던전 출입 금지. <b>다음에 또 쓰러지면 진짜 죽음이다.</b></p>
        ${diveLog(s)}
        <button class="btn primary wide" data-act="retreat">지상으로 돌아간다</button>
      </div>`;
  }
  if (s.death) {
    return `${head}${scene}
      <div class="dg-card dead">
        <p class="death-cause">${icon('skull')} 던전에서 쓰러졌다</p>
        ${diveLog(s)}
        <button class="btn primary wide" data-act="see-grave">묘비 앞에 선다</button>
      </div>`;
  }

  if (!d) {
    if (!canEnterDungeon(s)) {
      return `${head}${scene}<div class="dg-card"><p>${s.age < DUNGEON_MIN_AGE ? `던전은 ${DUNGEON_MIN_AGE}세부터 들어갈 수 있다.` : s.age < (s.dgBanUntil ?? 0) ? `던전의 기억이 발을 붙잡는다… ${s.dgBanUntil}세부터 다시 도전할 수 있다.` : '지금은 던전에 갈 수 없다. (진행 중인 사건이 있다)'}</p>
        <button class="btn" data-act="go" data-arg="life">돌아간다</button></div>`;
    }
    const floors = startFloors(s);
    return `${head}${scene}
      <div class="dg-card">
        <p class="muted small">5층마다 보스가 있다. 보스를 쓰러뜨리면 그 층의 귀환 포탈이 열려, 다음에 거기서부터 시작할 수 있다.
        HP는 한 해가 지나거나 회복약·여관으로 회복된다.</p>
        <h4>어디서부터 내려갈까?</h4>
        <div class="floor-grid">
          ${floors.map((f) => `<button class="floor" data-act="dive" data-arg="${f}">${f === 0 ? '입구 (1층~)' : `${f}층 포탈`}</button>`).join('')}
        </div>
        ${(s.hp ?? 0) < maxHp(s) * 0.5 ? `<p class="warn small">HP가 절반 아래다. 마을 여관(${fmtGold(INN_PRICE)})이나 회복약으로 회복하고 가자.</p>` : ''}
        <div class="setup-actions">
          <button class="btn" data-act="town">${icon('store')} 마을</button>
          <button class="btn" data-act="go" data-arg="life">돌아간다</button>
        </div>
      </div>`;
  }

  const done = d.floor >= DUNGEON_DEPTH;
  const pv = preview(s);
  return `${head}${scene}
    <div class="dg-card">
      ${done ? `<p class="dg-conquered">${icon('crown')} 던전 100층 완전 공략!</p>` : `
      <p class="eyebrow">다음 구간</p>
      <h3>${pv.from}~${pv.to}층 · ${esc(pv.biome)}</h3>
      <div class="boss-odds">
        <span>${icon('skull')} 보스 「${esc(pv.boss)}」</span>
        <span class="vs">${icon('sword')} 전투력 <b>${pv.cp}</b> vs <b>${pv.ep}</b></span>
        <span class="winp ${pv.p >= 60 ? 'good' : pv.p >= 35 ? 'mid' : 'bad'}">승률 <b>${pv.p}%</b></span>
      </div>`}
      <p class="small muted">이번 원정: 전리품 ${d.loot.length}개 · ${fmtGold(d.gold)}</p>
      <div class="dg-actions">
        ${done ? '' : `<button class="btn primary" data-act="descend">${icon('arrow-down')} 5층 내려간다</button>`}
        <button class="btn" data-act="drink" ${potions ? '' : 'disabled'}>${icon('potion')} 회복약 (${potions})</button>
        <button class="btn" data-act="retreat">${icon('door-closed')} 귀환한다</button>
      </div>
      ${diveLog(s)}
    </div>`;
}

function diveLog(s: LifeState): string {
  const log = s.dive?.log ?? [];
  return `<ol class="dg-log">${[...log].reverse().slice(0, 14).map((l) => `<li class="tone-${l.tone}">${esc(l.text)}</li>`).join('')}</ol>`;
}

// ───────────────────────── 마을 (상점 · 가방 · 여관) ─────────────────────────

export function viewTown(s: LifeState, tab: 'shop' | 'bag', cat: MarketCat): string {
  const head = `
    <div class="dg-head">
      <div><p class="eyebrow">마을 · 시간이 흐르지 않는다</p><h2>${icon('store')} 마을</h2></div>
      ${econRow(s)}
    </div>
    <div class="town-tabs">
      <button class="tab-btn ${tab === 'shop' ? 'on' : ''}" data-act="town-tab" data-arg="shop">${icon('store')} 상점</button>
      <button class="tab-btn ${tab === 'bag' ? 'on' : ''}" data-act="town-tab" data-arg="bag">${icon('backpack')} 가방 ${(s.bag ?? []).length}/${bagCap(s)}</button>
      <button class="tab-btn" data-act="inn" ${(s.hp ?? 0) >= maxHp(s) ? 'disabled' : ''}>${icon('bed')} 여관 ${fmtGold(INN_PRICE)}</button>
    </div>
    <div class="town-nav">
      <button class="btn" data-act="go" data-arg="life">${icon('user')} 인생으로</button>
      <button class="btn" data-act="dungeon" ${canEnterDungeon(s) ? '' : 'disabled'}>${icon('sword')} 던전으로</button>
    </div>`;
  return head + (tab === 'shop' ? shopView(s, cat) : bagView(s));
}

const CAT_ICON: Record<MarketCat, IconName> = {
  weapon: 'sword', armor: 'shield', potion: 'potion', life: 'home', study: 'book-open', fame: 'crown', elixir: 'wand',
};

function shopView(s: LifeState, cat: MarketCat): string {
  const items = MARKET.filter((m) => m.cat === cat);
  return `
    <div class="cat-row">${MARKET_CATS.map((c) => `<button class="chip ${c.id === cat ? 'on' : ''}" data-act="town-cat" data-arg="${c.id}">${icon(CAT_ICON[c.id])}${c.name}</button>`).join('')}</div>
    <ul class="market">${items.map((m) => {
      const price = marketPrice(s, m);
      const have = m.type === 'owned' && owns(s, m.id);
      const young = m.minAge && s.age < m.minAge;
      const poor = goldOf(s) < price;
      return `
        <li class="${have ? 'have' : ''}">
          <span class="m-icon">${icon(CAT_ICON[m.cat])}</span>
          <div><strong>${esc(m.name)}</strong><span class="muted small">${esc(m.desc)}${young ? ` · ${m.minAge}세부터` : ''}</span></div>
          ${have ? `<em class="owned">${icon('check')} 보유</em>`
            : `<button class="btn small ${poor ? '' : 'primary'}" data-act="mbuy" data-arg="${m.id}" ${poor || young ? 'disabled' : ''}>${fmtGold(price)}</button>`}
        </li>`;
    }).join('')}</ul>`;
}

function bagView(s: LifeState): string {
  const bag = [...(s.bag ?? [])].sort((a, b) => (a.kind === b.kind ? b.value - a.value : a.kind.localeCompare(b.kind)));
  const loot = bag.filter((x) => x.kind === 'loot');
  const lootTotal = loot.reduce((a, x) => a + x.value, 0);
  const slot = (label: string, it: Item | null | undefined) =>
    `<div class="slot">${icon(label === '무기' ? 'sword' : 'shield')}<div><span class="muted small">${label}</span><strong class="r-${it?.rarity ?? 'common'}">${it ? esc(it.name) : '없음'}</strong>${it ? `<span class="small">${label === '무기' ? '공격력' : '방어력'} +${it.power}</span>` : ''}</div></div>`;
  return `
    <div class="slots">${slot('무기', s.equip?.weapon)}${slot('방어구', s.equip?.armor)}</div>
    <div class="bag-actions">
      <button class="btn primary" data-act="sell-loot" ${loot.length ? '' : 'disabled'}>${icon('coins')} 전리품 모두 팔기 (${loot.length}개 · ${fmtGold(lootTotal)})</button>
    </div>
    ${bag.length ? `<ul class="market bag">${bag.map((it) => `
      <li>
        <span class="m-icon r-${it.rarity}">${icon(KIND_ICON[it.kind])}</span>
        <div><strong class="r-${it.rarity}">${esc(it.name)}</strong>
          <span class="muted small">${RARITY_NAME[it.rarity]}${it.kind === 'weapon' ? ` · 공격력 +${it.power}` : it.kind === 'armor' ? ` · 방어력 +${it.power}` : it.kind === 'potion' ? ` · HP +${it.power >= 9999 ? '전부' : it.power}` : ''}</span></div>
        <div class="bag-btns">
          ${it.kind === 'weapon' || it.kind === 'armor' ? `<button class="btn small primary" data-act="equip" data-arg="${it.uid}">장착</button>` : ''}
          ${it.kind === 'potion' ? `<button class="btn small" data-act="drink-item" data-arg="${it.uid}">마시기</button>` : ''}
          <button class="btn small" data-act="sell" data-arg="${it.uid}">${fmtGold(it.value)}</button>
        </div>
      </li>`).join('')}</ul>` : '<p class="muted">가방이 비었다. 던전에서 전리품을 모아 오자!</p>'}`;
}
