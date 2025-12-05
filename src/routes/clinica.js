const express = require('express')
const router = express.Router()
const { isLoggedIn, isLoggedInn, isLoggedInn2 } = require('../lib/auth') //proteger profile
const pool = require('../database5')
const multer = require('multer')
const path = require('path')
const fse = require('fs').promises;
const fs = require('fs');
const axios = require('axios');

///import { format } from "date-fns"; // si lo querés más cómodo
////solicitado== se suma al partido
////convocado,= s enevia a un juagdor la invitacion





////////////////////


module.exports = router