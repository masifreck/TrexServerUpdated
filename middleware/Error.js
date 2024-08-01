const ErrorHander =require('../utils/errorhandling')

module.exports=(err,req,res,next)=>{
err.status=err.status || 500;
err.message=err.message || 'Internal Server Error';
res.status(err.status).send({
    success:false,
    message:err.message
})
}