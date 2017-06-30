module.exports = class ListAnime {

  schema(){
    return {
      showId: Number,
      slug: String,
      title: {type: String, required: true, unique: true },
      timeCreated: {type: Date, default: Date.now}
    };
  }

}
