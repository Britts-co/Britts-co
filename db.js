const mysql = require('mysql');

let connection;

function handleDisconnect() {
  connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  connection.connect(err => {
    if (err) {
      console.error('❌ Error al conectar a la base de datos:', err.message);
      setTimeout(handleDisconnect, 2000); // Reintenta conexión
    } else {
      console.log('✅ Conectado a MySQL');
    }
  });

  connection.on('error', err => {
    console.error('⚠️ Error en la conexión MySQL:', err.code);
    if (err.code === 'PROTOCOL_CONNECTION_LOST' || err.fatal) {
      console.log('🔁 Intentando reconectar...');
      handleDisconnect();
    } else {
      throw err;
    }
  });
}

handleDisconnect();

module.exports = {
  query: (...args) => {
    if (!connection) {
      throw new Error('La conexión a MySQL no está lista.');
    }
    return connection.query(...args);
  }
};
