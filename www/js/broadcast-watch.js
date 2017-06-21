var BROADCAST = function(...args){ return new BroadcastWatch().broadcast(...args); }
var WATCH =     function(...args){ return new BroadcastWatch().watch(...args); }

class BroadcastWatch {
  constructor(){
    if (BroadcastWatch.once)
      return BroadcastWatch.once;
    BroadcastWatch.once = this;

    this.watchers = {};
    this.pastBroadcasts = {};

    BROADCAST = (...args)=> {return this.broadcast.apply(this, args)};
    WATCH = (...args)=> {return this.watch.apply(this, args)};
  }

  broadcast(name, data) {
    this.pastBroadcasts[name] = this.pastBroadcasts[name] || [];
    this.watchers[name] = this.watchers[name] || [];

    for (let watcher of this.watchers[name]){
      watcher.cb.call(watcher.scope, data);
    }

    this.pastBroadcasts[name].push(data);
  }

  watch(name, callback, scope) {
    if (!callback)
      return false;

    let w = this.watchers[name] = this.watchers[name] || [];
    if (w && w.length && callback != console.log) {
      if (w.find((obj) => {return obj.cb == callback && obj.scope == scope;}))
        return false;
    }

    this.pastBroadcasts[name] = this.pastBroadcasts[name] || [];
    for (let past of this.pastBroadcasts[name]){
      callback.call(scope, past);
    }

    w.push({cb: callback, scope: scope});
    return true;
  }
}