import { useRef, useState } from "react";

export default function ContactForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const form = formRef.current;
    if (!form) return; // 🔴 evita el error

    const formData = {
      nombre: (form.elements.namedItem("nombre") as HTMLInputElement).value,
      email: (form.elements.namedItem("email") as HTMLInputElement).value,
      objetivo: (form.elements.namedItem("objetivo") as HTMLTextAreaElement).value,
    };

    try {
      const res = await fetch("/api/inscribir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage(`✅ ${data.message}. Cupos restantes: ${data.cuposRestantes}`);
        form.reset(); // ✅ ahora sí funciona
      } else {
        setMessage(`❌ ${data.message || "Error desconocido"}`);
      }
    } catch (error) {
      setMessage(`❌ Error en el servidor: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
      <input name="nombre" placeholder="Tu nombre" className="w-full border p-2" />
      <input name="email" type="email" placeholder="tu@email.com" className="w-full border p-2" />
      <textarea name="objetivo" placeholder="Ej: Perder peso, ganar músculo..." className="w-full border p-2" />
      <button disabled={loading} className="bg-red-600 text-white px-4 py-2 rounded">
        {loading ? "Enviando..." : "Quiero mi plan personalizado"}
      </button>
      {message && <p className="text-sm">{message}</p>}
    </form>
  );
}
