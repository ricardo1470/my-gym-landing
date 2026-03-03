// generate-password.js
// Script para generar un nuevo hash de contraseña para el dashboard

const bcrypt = require('bcryptjs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n🔐 Generador de Hash de Contraseña para Dashboard\n');

rl.question('Ingresa la nueva contraseña para el dashboard: ', async (password) => {
  if (!password || password.length < 6) {
    console.error('❌ La contraseña debe tener al menos 6 caracteres');
    rl.close();
    return;
  }

  try {
    const hash = await bcrypt.hash(password, 10);
    // In Next.js env files, `$` should be escaped to prevent variable expansion.
    const escapedHash = hash.replace(/\$/g, '\\$');
    
    console.log('\n✅ Hash generado exitosamente!\n');
    console.log('Copia esta línea en tu archivo .env.local:\n');
    console.log(`DASHBOARD_PASSWORD_HASH=${escapedHash}`);
    console.log('\n📝 Contraseña que usarás para entrar: ' + password);
    console.log('\n⚠️  Guarda esta contraseña en un lugar seguro!\n');
    
  } catch (error) {
    console.error('❌ Error generando hash:', error);
  }
  
  rl.close();
});
