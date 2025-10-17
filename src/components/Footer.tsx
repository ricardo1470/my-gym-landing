import {
    Instagram,
    Facebook,
    MessageCircle,
    MapPin,
    Phone,
    Mail,
} from "lucide-react";
// Asumo que estás usando el componente Button de Shadcn/ui
import { Button } from "@/components/ui/button";

export default function Footer() {
    return (
        <footer className="bg-black text-white py-16">
            <div className="container mx-auto px-4">
                <div className="grid md:grid-cols-4 gap-8">
                    {/* Columna 1: Información de la Marca y Redes Sociales */}
                    <div>
                        <h3 className="text-2xl font-bold mb-4 text-primary">TRIBU TEAM</h3>
                        <p className="text-gray-300 mb-4">
                            Tu centro de transformación integral. Más que un gimnasio, tu nuevo estilo de vida.
                        </p>
                        <div className="flex space-x-4">
                            {/* Botón de Instagram */}
                            <Button 
                                variant="outline" 
                                size="icon" 
                                className="border-gray-600 hover:bg-primary bg-transparent text-white hover:text-black"
                                aria-label="Instagram"
                            >
                                <Instagram className="w-5 h-5" />
                            </Button>
                            {/* Botón de Facebook */}
                            <Button 
                                variant="outline" 
                                size="icon" 
                                className="border-gray-600 hover:bg-primary bg-transparent text-white hover:text-black"
                                aria-label="Facebook"
                            >
                                <Facebook className="w-5 h-5" />
                            </Button>
                            {/* Botón de Chat (WhatsApp/Mensaje) */}
                            <Button 
                                variant="outline" 
                                size="icon" 
                                className="border-gray-600 hover:bg-primary bg-transparent text-white hover:text-black"
                                aria-label="WhatsApp Chat"
                            >
                                <MessageCircle className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>

                    {/* Columna 2: Servicios */}
                    <div>
                        <h4 className="text-lg font-semibold mb-4">Servicios</h4>
                        <ul className="space-y-2 text-gray-300">
                            <li>Entrenamiento Personal</li>
                            <li>Nutrición Deportiva</li>
                            <li>Suplementación</li>
                        </ul>
                    </div>

                    {/* Columna 3: Contacto */}
                    <div>
                        <h4 className="text-lg font-semibold mb-4">Contacto</h4>
                        <div className="space-y-3 text-gray-300">
                            <div className="flex items-center space-x-2">
                                <MapPin className="w-4 h-4 text-primary" />
                                <span>AV siempre Viva 123</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Phone className="w-4 h-4 text-primary" />
                                <span>+57 318 5228487</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Mail className="w-4 h-4 text-primary" />
                                <span>info@fittransform.com</span>
                            </div>
                        </div>
                    </div>

                    {/* Columna 4: Horarios y CTA */}
                    <div>
                        <h4 className="text-lg font-semibold mb-4">Horarios</h4>
                        <div className="space-y-2 text-gray-300">
                            <div>Lun - Vie: 6:00 - 22:00</div>
                            <div>Sábados: 8:00 - 13:00</div>
                        </div>
                        <Button className="mt-4 w-full bg-primary hover:bg-primary/90 text-black">
                            <MessageCircle className="w-4 h-4 mr-2" />
                            WhatsApp Directo
                        </Button>
                    </div>
                </div>

                {/* Derechos de Autor */}
                <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
                    <p>&copy; 2025 TRIBU TEAM. Todos los derechos reservados.</p>
                </div>
            </div>
        </footer>
    );
}
