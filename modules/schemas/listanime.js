module.exports = class ListAnime {

  schema(){
    return {
			showId: Number,
      slug: String,
      title: String,
			timeCreated: {type: Date, default: Date.now}
    };
  }

}
