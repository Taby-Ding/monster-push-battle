// AI 策略：以"落子并结算推动之后"的真实局面评估。
var BoardCore = (typeof module !== 'undefined') ? require('./board-core.js') : window.BoardCore;
var LINES = BoardCore.buildLines();

// 每条无对手阻挡的线上，己方该形态棋子的数量。
function lineProfiles(board, owner, stage) {
  const out = [];
  for (const line of LINES) {
    let mine = 0, blocked = false;
    for (const i of line) {
      const p = board[i];
      if (!p) continue;
      if (p.owner === owner && p.stage === stage) mine++;
      else if (p.owner !== owner) blocked = true;
    }
    if (!blocked) out.push(mine);
  }
  return out;
}
const countStage = (board, owner, stage) => board.reduce((n, p) => n + (p && p.owner === owner && p.stage === stage ? 1 : 0), 0);
// 一键成三的空位数量：对手下一手可以直接取胜的点。
const immediateWins = (board, owner) => LINES.filter(line => {
  const occ = line.filter(i => board[i]);
  if (occ.length !== 2) return false;
  return occ.every(i => board[i].owner === owner && board[i].stage === 'adult') && line.some(i => !board[i]);
}).length;

var MonsterAI = {
  levels: { easy: { name: '新手 AI', depth: 0 }, normal: { name: '进阶 AI', depth: 1 }, hard: { name: '高手 AI', depth: 2 } },

  toCore(game) {
    const S = game.state;
    return {
      board: S.board.map(p => p ? { owner: p.owner, stage: p.stage } : null),
      hands: S.players.map(p => ({ young: p.young, adult: p.adult })),
      pool: S.players.map(p => p.pool),
      turn: S.turn
    };
  },
  simulate(state, mv) { const s = BoardCore.snapshot(state); const res = BoardCore.commit(s, mv); return res ? Object.assign(res, { board: s.board, hands: s.hands, pool: s.pool, turn: s.turn }) : null; },
  winMoves(state, owner) { return BoardCore.moveList(state).filter(mv => { const n = this.simulate(state, mv); return n && BoardCore.winLines(n.board, owner, 'adult').length; }); },

  // 己方已形成的“双连”数量，用于给主动进攻加权。
  attackBonus(state, me) {
    let pairs = 0;
    for (const line of BoardCore.buildLines()) {
      let mine = 0, blocked = false;
      for (const i of line) { const p = state.board[i]; if (!p) continue; if (p.owner === me && p.stage === 'adult') mine++; else if (p.owner !== me) blocked = true; }
      if (!blocked && mine === 2) pairs++;
    }
    return 900 * pairs;
  },

  score(board, state, me, strict = true) {
    const foe = 1 - me;
    let s = 0;
    const myWins = immediateWins(board, me), foeWins = immediateWins(board, foe);
    s += 120000 * myWins - 200000 * foeWins;               // 能让对手一步成三，必须付出巨大代价
    const weight = (arr, one, two) => arr.reduce((a, n) => a + (n >= 3 ? 90000 : n === 2 ? two : n === 1 ? one : 0), 0);
    const myA = lineProfiles(board, me, 'adult'), foeA = lineProfiles(board, foe, 'adult');
    const myY = lineProfiles(board, me, 'young'), foeY = lineProfiles(board, foe, 'young');
    s += weight(myA, 220, 3300) - 1.3 * weight(foeA, 220, 3300);
    s += weight(myY, 80, 620) - 1.1 * weight(foeY, 80, 620);
    // 手牌中的成年体是主动进攻资源，未落场也应计入威胁潜力。
    s += 260 * state.hands[me].adult - 260 * state.hands[foe].adult;
    // 棋子存活：留在场上比被推回营地更有价值
    s += 60 * (countStage(board, me, 'young') - countStage(board, foe, 'young'));
    s += 95 * (countStage(board, me, 'adult') - countStage(board, foe, 'adult'));
    if (strict) {
      s += 6 * (state.hands[me].young + state.hands[me].adult) - 6 * (state.hands[foe].young + state.hands[foe].adult);
      s += 12 * (state.pool[me] - state.pool[foe]);
    }
    return s;
  },

  postScore(state, mv, me) {
    const nx = this.simulate(state, mv);
    if (!nx) return { nx: null, score: -Infinity };
    if (BoardCore.winLines(nx.board, me, 'adult').length) return { nx, score: 1e9 };
    let score = this.score(nx.board, nx, me);
    // 进化取走三枚幼年体换成年体，避免被“棋子减少”误判为亏。
    if (nx.youngEvolved) score += 5000 + 900 * (nx.adultHand || 0);
    score += 8 * (nx.pushed || 0);
    return { nx, score };
  },

  decide(game, levelKey = 'normal') {
    const level = this.levels[levelKey] || this.levels.normal;
    const state = this.toCore(game);
    const me = state.turn;
    const list = BoardCore.moveList(state);
    if (!list.length) return null;

    // 一步取胜优先。
    const win = this.winMoves(state, me)[0];
    if (win) return win;

    // 对手已能一步成三：必须把威胁点占掉；多点威胁时选局面最好的。
    const blocks = this.winMoves(state, 1 - me);
    if (blocks.length) {
      let best = null, bestScore = -Infinity;
      for (const mv of blocks) { const p = this.postScore(state, mv, me); if (p.score > bestScore) { bestScore = p.score; best = mv; } }
      return best;
    }

    const ranked = list.map(mv => ({ mv, ...this.postScore(state, mv, me) })).filter(r => r.nx).sort((a, b) => b.score - a.score);
    if (!ranked.length) return null;
    if (level.depth === 0) { const cut = Math.max(1, Math.ceil(ranked.length * 0.45)); return ranked[Math.floor(Math.random() * cut)].mv; }
    if (level.depth === 1) return ranked[0].mv;

    // 高手：模拟对手最佳回应，取最坏情况最好的那步。
    let best = null, bestScore = -Infinity;
    for (const { mv, nx, score } of ranked.slice(0, 26)) {
      let worst;
      const replies = BoardCore.moveList(nx);
      if (!replies.length) worst = this.score(nx.board, nx, me);
      else if (this.winMoves(nx, 1 - me).length) worst = -1e8;
      else {
        worst = Infinity;
        for (const rp of replies) {
          const after = this.simulate(nx, rp);
          if (!after) continue;
          let v = this.score(after.board, after, me);
          if (BoardCore.winLines(after.board, 1 - me, 'adult').length) v -= 1e8;
          if (v < worst) worst = v;
        }
      }
      // 进攻倾向：自己已形成双连时，优先补成三连而非被动防守。
      const total = score * 0.45 + worst * 0.55 + this.attackBonus(nx, me);
      if (total > bestScore) { bestScore = total; best = mv; }
    }
    return best || ranked[0].mv;
  }
};
if (typeof module !== 'undefined') module.exports = MonsterAI;
