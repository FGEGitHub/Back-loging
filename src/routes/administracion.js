const express = require('express')
const router = express.Router()
const passport= require('passport')
const pool = require('../database')
const {isLoggedIn,isLoggedInn,isLoggedInn2, } = require('../lib/auth')

router.get('/todos/', async (req, res) => {
   
  
    const etc = await pool.query ('select * from usuarios' )
console.log(etc)
  res.json(etc);
//res.render('index')
})




  router.post('/signupp', isLoggedInn2, passport.authenticate('local.registroadmin', {
    successRedirect: '/exitosignup',
    failureRedirect:'/noexito',
    failureFlash:true

}))


router.post('/modificarusuario', isLoggedInn2, passport.authenticate('local.modificadoradmin', {
  successRedirect: '/exitosignupp',
  failureRedirect:'/exitosignupp',
  failureFlash:true

}))


router.post('/borrarusuario', async (req, res) => {
  const { id } = req.body
  try {
    await pool.query('delete  from  usuarios where id = ?',[id])
    res.json('Realizado')
  } catch (error) {
    console.log(error)
    res.json('no realizado')
  }

})


module.exports = router