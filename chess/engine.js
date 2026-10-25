// Dünne Hülle um den Stockfish-Worker: Befehle werden nacheinander abgearbeitet.
export class Engine {
  constructor() {
    this.w = new Worker(new URL('engine/stockfish-18-lite-single.js', import.meta.url));
    this.listeners = [];
    this.w.onmessage = (e) => {
      const line = typeof e.data === 'string' ? e.data : '';
      for (const l of [...this.listeners]) l(line);
    };
    this.queue = this.init();
  }
  send(cmd) { this.w.postMessage(cmd); }
  waitFor(pred, onLine) {
    return new Promise((res) => {
      const fn = (line) => {
        if (onLine) onLine(line);
        if (pred(line)) { this.listeners.splice(this.listeners.indexOf(fn), 1); res(line); }
      };
      this.listeners.push(fn);
    });
  }
  async init() {
    this.send('uci');
    await this.waitFor((l) => l === 'uciok');
    this.send('setoption name Hash value 32');
    this.send('isready');
    await this.waitFor((l) => l === 'readyok');
  }
  // opts: { depth, movetime, multipv, options: {Name: value} }
  // Ergebnis: { best, lines: [{ cp|mate (aus Sicht des Ziehenden), pv: [uci] }] }
  go(fen, opts = {}) {
    const job = this.queue.then(async () => {
      for (const [k, v] of Object.entries(opts.options || {})) this.send(`setoption name ${k} value ${v}`);
      this.send(`setoption name MultiPV value ${opts.multipv || 1}`);
      this.send('ucinewgame');
      this.send('isready');
      await this.waitFor((l) => l === 'readyok');
      this.send(`position fen ${fen}`);
      let cmd = 'go';
      if (opts.depth) cmd += ` depth ${opts.depth}`;
      if (opts.movetime) cmd += ` movetime ${opts.movetime}`;
      const lines = [];
      this.send(cmd);
      const last = await this.waitFor((l) => l.startsWith('bestmove'), (l) => {
        if (!l.startsWith('info') || !l.includes(' pv ')) return;
        const mpv = +(l.match(/ multipv (\d+)/)?.[1] || 1);
        const sc = l.match(/ score (cp|mate) (-?\d+)/);
        if (!sc) return;
        const pv = l.split(' pv ')[1].trim().split(' ');
        lines[mpv - 1] = sc[1] === 'cp' ? { cp: +sc[2], pv } : { mate: +sc[2], pv };
      });
      const best = last.split(' ')[1];
      return { best: best === '(none)' ? null : best, lines: lines.filter(Boolean) };
    });
    this.queue = job.catch(() => {});
    return job;
  }
}
