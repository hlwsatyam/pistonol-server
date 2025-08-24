const mysql = require("mysql2");

const connection = mysql.createConnection({
  host: "127.0.0.1",
  user: "homestead",
  password: "secret",
  database: "homestead",
  port: 3306,
});

connection.connect((err) => {
  if (err) {
    console.error("Error connecting:", err.stack);
    return;
  }
  console.log("Connected as id " + connection.threadId);
});
 


 

connection.query("SHOW TABLES", (error, results) => {
  if (error) throw error;

  console.log("All Tables:");
  results.forEach((table) => {
    console.log(Object.values(table)[0]);
  });

  connection.end();
});
