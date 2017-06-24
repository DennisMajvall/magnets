module.exports = class Trackers {

  schema(){
    return {
      name: {type: String, required: true, unique: true },
      isAnime: {type: Boolean, required: true },
      timeCreated: {type: Date, default: Date.now}
    };
  }

}
