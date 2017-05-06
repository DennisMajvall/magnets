module.exports = class Loginhandler {

  constructor(expressApp){
    this.app = expressApp;
    this.get();
    this.post();
    this.delete();
  }


  get(){
    // check if logged in
    this.app.get('/rest/login',(req,res)=>{
      // not logged in
      if(!req.session.content.user){
        res.json({user:false, status: 'not logged in'});
        return;
      }
      // logged in
      res.json({user:req.session.content.user, status: 'logged in'});
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
      var username = req.body.username;
      var password = sha1(req.body.password + global.passwordSalt);
      var foundUser, foundEntity;
      // look for user in all different entitities
			User.findOne({
				username:username,
				password:password
			},(err,found)=>{
				if(found){
					foundUser = found;
				}
				this.postReply(req,res,foundUser);
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
