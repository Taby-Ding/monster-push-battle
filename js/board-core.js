// 纯棋盘内核：供游戏本体与 AI 共用，不触碰 DOM。
var BoardCore={
  SIZE:6, DIRS:[[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]], LINES:[],
  inside(r,c){return r>=0&&r<6&&c>=0&&c<6},
  rc(i){return [Math.floor(i/6),i%6]},
  buildLines(){if(this.LINES.length)return this.LINES;const out=[],dirs=[[0,1],[1,0],[1,1],[1,-1]];for(let r=0;r<6;r++)for(let c=0;c<6;c++)for(const[dR,dC]of dirs){const line=[];for(let k=0;k<3;k++){const rr=r+dR*k,cc=c+dC*k;if(!this.inside(rr,cc))break;line.push(rr*6+cc)}if(line.length===3)out.push(line)}return this.LINES=out},
  snapshot(S){return{board:S.board.map(p=>p?{owner:p.owner,stage:p.stage}:null),hands:S.hands.map(h=>({...h})),turn:S.turn,pool:S.pool.map(x=>x)}},
  canPlace(state,i,stage){if(!state||state.board[i]!==null)return false;const h=state.hands&&state.hands[state.turn];return !!(h&&h[stage]>0)},
  moveList(state){const out=[];if(!state||!state.hands)return out;const h=state.hands[state.turn];if(!h)return out;for(let i=0;i<36;i++){if(state.board[i])continue;if(h.young>0)out.push({i,stage:'young'});if(h.adult>0)out.push({i,stage:'adult'})}return out},
  pushTargets(board,origin,stage){const [r,c]=this.rc(origin),out=[];for(const[dr,dc]of this.DIRS){const sr=r+dr,sc=c+dc;if(!this.inside(sr,sc))continue;const si=sr*6+sc,piece=board[si];if(!piece)continue;if(stage==='young'&&piece.stage==='adult')continue;const tr=sr+dr,tc=sc+dc;if(this.inside(tr,tc)&&board[tr*6+tc])continue;out.push({si,ti:this.inside(tr,tc)?tr*6+tc:-1,piece})}return out},
  applyPush(board,origin,stage,hands){let pushed=0,ejected=[];for(const m of this.pushTargets(board,origin,stage)){board[m.si]=null;if(m.ti<0){hands[m.piece.owner][m.piece.stage]++;ejected.push(m.piece.owner)}else board[m.ti]=m.piece;pushed++}return{pushed,ejected}},
  evolveLines(board,player,stage){return this.buildLines().filter(line=>line.every(i=>{const p=board[i];return p&&p.owner===player&&p.stage===stage})).map(line=>[...line])},
  hasLine(board,player,stage){return this.buildLines().some(line=>line.every(i=>{const p=board[i];return p&&p.owner===player&&p.stage===stage}))},
  winLines(board,player,stage){return this.evolveLines(board,player,stage)},
  // 落子 + （仅必要时）进化 + 推动。唯一三连自动进化，多组合不在此处理（AI 只取第一组）。
  commit(state,move){const board=state.board,hands=state.hands,player=state.turn;if(!move||board[move.i]||!hands[player]||hands[player][move.stage]<=0)return null;const piece={owner:player,stage:move.stage};hands[player][move.stage]--;board[move.i]=piece;const lines=this.evolveLines(board,player,'young');let evolved=false;if(lines.length){lines[0].forEach(i=>board[i]=null);hands[player].young+=3;if(state.pool[player]>0){state.pool[player]--;hands[player].adult++;evolved=true}}const push=this.applyPush(board,move.i,move.stage,hands);const win=this.winLines(board,player,'adult');return{pushed:push.pushed,ejected:push.ejected,evolved,evolveLines:lines.length,youngEvolved:lines.length,adultHand:hands[player].adult,win:win.length?win[0]:null,winLines:win,full:board.every(Boolean)}},
  lineScore(board,player){let score=0;for(const line of this.buildLines()){let young=0,adult=0,other=0;for(const i of line){const p=board[i];if(!p)continue;if(p.owner===player){if(p.stage==='young')young++;else adult++}else other++}if(other)continue;if(adult===3)score+=10000;else if(adult===2)score+=900;else if(adult===1)score+=140;else if(young===3)score+=420;else if(young===2)score+=300;else if(young===1)score+=55}return score}
};
if(typeof module!=='undefined')module.exports=BoardCore;