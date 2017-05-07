module.exports = class MagnetsAnime {

  schema(){
    return {
			showId: {type: Number, required: true, unique: true },
			low: [{
				episode: {type: Number, required: true },
				magnet: {type: String, required: true },
				timeCreated: {type: Date, default: Date.now}
			}],
			medium: [{
				episode: {type: Number, required: true },
				magnet: {type: String, required: true },
				timeCreated: {type: Date, default: Date.now}
			}],
			high: [{
				episode: {type: Number, required: true },
				magnet: {type: String, required: true },
				timeCreated: {type: Date, default: Date.now}
			}],
			timeCreated: {type: Date, default: Date.now}
    };
  }

}
