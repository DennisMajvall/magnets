async function getUser(req){
  let user = false;

  if (req.params.username && req.params.password){
    user = req.params;
  } else if (req.body.username && req.body.password){
    user = req.body;
  } else if (req.session && req.session.content && req.session.content.user){
    return req.session.content.user;
  }

  user = await User.findOne({
    username: user.username,
    password: sha1(user.password + global.passwordSalt)
  }).exec().catch((e)=>{ console.log('getshows - getUser caught', e); });

  if (user){
    delete user.password;
    delete user.__v;
  }

  return user;
}

module.exports = async function getShows(req, res){
  res.set("Cache-Control", "public, max-age=1");

  let user = await getUser(req);
  if(!user){
    res.json([]);
    return;
  }

  let result = [];
  let animes = user.animes || [];

  for (let anime of animes){
    let highestEp = anime.episode;
    let magnets = await MagnetsAnime.findOne({showId: anime.showId}).exec();

    function loopThroughQuality(quality) {
      for (let epMagnet of magnets[quality]){
        if (epMagnet.episode > anime.episode){
          result.push(epMagnet.magnet);
          highestEp = Math.max(highestEp, epMagnet.episode);
        }
      }
      anime.episode = highestEp;
    }

    loopThroughQuality(user.quality);
    if (!user.exclusiveQuality) {
      user.quality == 'high' && (loopThroughQuality('medium'));
      user.quality == 'medium' && (loopThroughQuality('low'));
    }
  }

  if (result.length){
    let foundUser = await User.findOne({_id: user._id}).exec()
    .catch((e) => { console.log('catch foundUser', e); });

    foundUser.animes = user.animes;
    foundUser.save(()=>{
      res.json(result);
    });
  } else {
    res.json(result);
  }

}