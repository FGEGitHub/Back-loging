const jwt = require("jsonwebtoken")
module.exports = {



    isLoggedInn(req,res, next){
        
        //
        const authorization = req.get('authorization')
        let token =null
        console.log(authorization)
        if (authorization && authorization.startsWith('Bearer')){
            console.log('entraa')
            token = authorization.substring(7) 
        }
        let decodedToken = {}
        
        try{
             decodedToken = jwt.verify(token, 'fideicomisocs121')
           
        }catch{}
      
        if (!token || !decodedToken.id){
            console.log('error token')
            return res.send('error login')
        }
      
       // res.send(decodedToken.cuil_cuit)
        
        next()
    },

    isLoggedInn2(req,res, next){
        console.log('entra1')
        //
        const authorization = req.get('authorization')
        let token =null
        console.log(authorization)
        if (authorization && authorization.startsWith('Bearer')){
            console.log('entraa')
            token = authorization.substring(7) 
        }
        let decodedToken = {}
        
        try{
             decodedToken = jwt.verify(token, 'fideicomisocs121')
             console.log(decodedToken)
           
        }catch{}
      
        if (!token || !decodedToken.id || (decodedToken.nivel <2) ){
            console.log('error token')
            return res.send('error login')
        }
      
       // res.send(decodedToken.cuil_cuit)
        
        next()
    },

    isLoggedInn3(req,res, next){
        console.log('entra1')
        //
        const authorization = req.get('authorization')
        let token =null
        console.log(authorization)
        if (authorization && authorization.startsWith('Bearer')){
            console.log('entraa')
            token = authorization.substring(7) 
        }
        let decodedToken = {}
        
        try{
             decodedToken = jwt.verify(token, 'fideicomisocs121')
             console.log(decodedToken)
           
        }catch{}
      
        if (!token || !decodedToken.id || (decodedToken.nivel <3) ){
            console.log('error token')
            return res.send('error login')
        }
      
       // res.send(decodedToken.cuil_cuit)
        
        next()
    },

    isLoggedIn(req,res, next){
        if (req.isAuthenticated()) {     /// isathenticated metodo de pasport
            return next()   //si existe esta seccion continua con el codigo
        }
        return res.redirect('/signin') //si no esta logueado 
    },
    isNotLoggedIn(req,res, next){
        if (!req.isAuthenticated()) {    
            return next()
    }
    return res.redirect('/profile')

    }

}