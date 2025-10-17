// app/store/page.tsx

import Store from '@/components/Store';
import Header from '@/components/Header';

export default function StorePage() {
    return (
        <div className= "min-h-screen" >
        <Header />


<main className="container mx-auto px-4 py-8" >
    <Store />
    </main>

{/* Puedes agregar un Footer aquí si tienes uno */ }
</div>
    );
}
