module.exports = class Loginhandler {

  constructor(expressApp){
    this.app = expressApp;
    this.get();
    this.put();
    this.post();
    this.delete();
  }


  get(){
    // check if logged in
    this.app.get('/rest/login',(req,res)=>{
      if(!req.session.content.user){
        res.json({user:false, status: 'not logged in'});
        return;
      }
      res.json({user:req.session.content.user, status: 'logged in'});
    });
  }

	// Updates the session user with a lookup in the user table
	put(){
		this.app.put('/rest/login',(req,res)=>{
      if(!req.session.content.user){
        res.json({user:false, status: 'not logged in'});
        return;
      }

      // if logged in - lookup the current version of the user
			User.findOne({_id: req.session.content.user._id},(err,found)=>{
				this.postReply(req,res,found);
			});
		});
	}

  post(){
    // logging in
    this.app.post('/rest/login',(req,res)=>{
      // already logged in
      if(req.session.content.user){
        res.json({
          user:req.session.content.user,
          status: 'already logged in'
        });
        return;
      }
      // trying to log in
			User.findOne({
				username: req.body.username,
				password: sha1(req.body.password + global.passwordSalt)
			},(err,found)=>{
				this.postReply(req,res,found);
			});
    });
  }


  postReply(req,res,foundUser){
    if(foundUser){
      // copy user and delete password and __v
      var user = Object.assign({},foundUser._doc);
      delete user.password;
      delete user.__v;
      // log in successful
      req.session.content.user = user;
      // since content is of type mixed we need to
      // tell Mongoose it is updated before saving
      req.session.markModified('content');
      req.session.save();
      res.json({user:user, status: 'logged in succesfully'});
    }
    else {
      res.json({user:false, status: 'wrong credentials'});
    }
  }


  delete(){
    // logging out
    this.app.delete('/rest/login',(req,res)=>{
      // already logged out / not logged in
      if(!req.session.content.user){
        res.json({
          user:false,
          status: 'already logged out'
        });
        return;
      }
      // loggin out
      req.session.content.user = false;
      // since content is of type mixed we need to
      // tell Mongoose it is updated before saving
      req.session.markModified('content');
      req.session.save();
      res.json({
        user:false,
        status: 'logged out successfully'
      });
    });
  }

}
