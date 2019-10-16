const mysql=require('mysql');
const {MYSQL_CONF} =require('../conf/db')

const con=mysql.createConnection(MYSQL_CONF)

con.connect();

//统一执行 sql 的函数
function exec(sql){
  return new Promise((reslove,reject)=>{
    con.query(sql, (err, result) => {
      if (err) {
        reject(err);
        return
      }
      reslove(result)
    })
  })
}

module.exports={
  exec
}