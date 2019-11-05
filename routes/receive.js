var express = require("express");
var router = express.Router();
var fs = require('fs');
router.post('/receive/call', (req, res) => {
    logger.info("HTTP POST /receive/call" + req.ip + Date());
    result = {};
    result.ifId = req.body.ifId || undefined;
    if (result.ifId === undefined){
     result.code = "99";
     result.message = "필수값 누락";
     res.send(JSON.stringify(result));
    } else {
     fs.writeFile(config.write_path + result.ifId + ".JSON",  'utf-8', function(err) {
       if(err) {
         result.code = "99";
         result.message = "파일 수신 실패";
         res.send(JSON.stringify(result));
         console.log('파일 쓰기 실패');
       } else {
         result.code = "10";
         result.message = "파일 정상 수신";
         res.send(JSON.stringify(result));
         console.log('파일 쓰기 완료');
       }
     });
    }
  });


module.exports = router;