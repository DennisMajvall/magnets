module.exports = class ConsoleLog {

  schema(){
    return {
      text: String,
      timeCreated: {type: Date, default: Date.now}
    };
  }

}
