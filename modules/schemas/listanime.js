module.exports = class ListAnime {

  schema(){
    return {
			showId: {type: Number, required: true, unique: true },
      slug: String,
      title: String,
			timeCreated: {type: Date, default: Date.now}
    };
  }

}
