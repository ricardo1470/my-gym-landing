// app/store/page.tsx

import Store from '@/components/Store'; // Importa tu componente de la tienda
import Header from '@/components/Header'; // Asumiendo que quieres el Header en tu tienda

// Esta será la página que cargará Next.js para la ruta /store
export default function StorePage() {
    return (
        <div className= "min-h-screen" >
        <Header />


{/* 💡 Montamos el componente de la tienda */ }
<main className="container mx-auto px-4 py-8" >
    <Store />
    </main>

{/* Puedes agregar un Footer aquí si tienes uno */ }
</div>
    );
}
