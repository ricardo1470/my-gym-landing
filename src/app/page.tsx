"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import {
  Dumbbell,
  Apple,
  Pill,
  Users,
  CheckCircle,
  //Star,
  Phone,
  MapPin,
  Mail,
  MessageCircle,
  //MessageCircleHeart,
  Instagram,
  Facebook,
  //Twitter,
  ChevronLeft,
  ChevronRight,
  //Laptop,
} from "lucide-react"
import { useState } from "react"
import Image from "next/image"
import ContactForm from "@/components/ContactForm"
import Hero from "@/components/Hero"
import Testimonials from "@/components/Testimonials"
import PricingCards from "@/components/PricingCards"


export default function FitnessLanding() {
  const [currentImage, setCurrentImage] = useState(0)

  const carouselImages = [
    "/person-doing-intense-workout-in-modern-gym.jpg",
    "/healthy-colorful-meal-prep-containers.jpg",
    "/fitness-supplements-and-protein-powder.jpg",
    "/fitness-seminar-with-trainer-teaching-group.jpg",
  ]

  const nextImage = () => {
    setCurrentImage((prev) => (prev + 1) % carouselImages.length)
  }

  const prevImage = () => {
    setCurrentImage((prev) => (prev - 1 + carouselImages.length) % carouselImages.length)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <Hero />

      {/* Testimonials Section */}
      <Testimonials />

      {/* Services Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-16 text-balance">
            Nuestros <span className="text-primary">Servicios</span>
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <Dumbbell className="w-12 h-12 text-primary" />,
                title: "Entrenamiento Personalizado",
                description: "Rutinas adaptadas a tu nivel y objetivos específicos",
              },
              {
                icon: <Apple className="w-12 h-12 text-primary" />,
                title: "Nutrición Inteligente",
                description: "Planes alimenticios prácticos y sostenibles",
              },
              {
                icon: <Pill className="w-12 h-12 text-primary" />,
                title: "Suplementación Guiada",
                description: "Recomendaciones seguras y efectivas según tu perfil",
              },
              {
                icon: <Users className="w-12 h-12 text-primary" />,
                title: "Asesoría Online",
                description: "Accede a rutinas y seguimiento con nuestro acompañamiento personalizado en línea.",
              },
            ].map((service, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-center mb-4">{service.icon}</div>
                  <CardTitle className="text-xl mb-2">{service.title}</CardTitle>
                  <CardDescription className="text-pretty">{service.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full bg-transparent">
                    Conoce más
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Image Carousel */}
      <section className="py-20 bg-muted">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-16 text-balance">
            Vive la <span className="text-primary">Experiencia</span>
          </h2>
          <div className="relative max-w-4xl mx-auto">
              <Image
                src={carouselImages[currentImage] || "/placeholder.svg"}
                alt="Fitness experience"
                className="w-full h-full object-cover transition-opacity duration-500"
                width={1024}
                height={576}
              />
              <Button
                variant="outline"
                size="icon"
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
                onClick={prevImage}
              >
                <ChevronLeft className="w-6 h-6" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
                onClick={nextImage}
              >
                <ChevronRight className="w-6 h-6" />
              </Button>
            </div>
            <div className="flex justify-center mt-6 space-x-2">
              {carouselImages.map((_, index) => (
                <button
                  key={index}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === currentImage ? "bg-primary" : "bg-gray-300"
                  }`}
                  onClick={() => setCurrentImage(index)}
                />
              ))}
            </div>
          </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-16 text-balance">
            ¿Por qué <span className="text-primary">Elegirnos?</span>
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {[
              "Seguimiento semanal personalizado",
              "Comunidad activa de apoyo",
              "Resultados garantizados",
            ].map((benefit, index) => (
              <div key={index} className="flex items-center space-x-3">
                <CheckCircle className="w-6 h-6 text-primary flex-shrink-0" />
                <span className="text-lg">{benefit}</span>
              </div>
            ))}
          </div>
          <div className="text-center">
            <p className="text-2xl font-semibold text-muted-foreground">
              No es solo un gimnasio. <span className="text-primary">Es tu nuevo estilo de vida.</span>
            </p>
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section id="contact-form" className="py-20 bg-muted">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-8 text-balance">
              Comienza tu <span className="text-primary">Transformación</span>
            </h2>
            <ContactForm />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-muted">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-8 text-balance">
              Elige tu <span className="text-primary">Plan de Transformación</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Cada plan está diseñado para adaptarse a tus objetivos y nivel de compromiso.
              Comienza tu transformación hoy mismo.
            </p>
          </div>
          <PricingCards />
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-16 text-balance">
            Preguntas <span className="text-primary">Frecuentes</span>
          </h2>
          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible>
              <AccordionItem value="item-1">
                <AccordionTrigger className="text-left">¿Necesito experiencia previa en el gimnasio?</AccordionTrigger>
                <AccordionContent>
                  No es necesario. Nuestros planes se adaptan a todos los niveles, desde principiantes hasta atletas
                  avanzados. Comenzamos evaluando tu condición actual y diseñamos un programa progresivo.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger className="text-left">¿Qué incluye exactamente la asesoría?</AccordionTrigger>
                <AccordionContent>
                  Incluye plan de entrenamiento personalizado, guía nutricional completa, recomendaciones de
                  suplementación, seguimiento semanal, acceso a seminarios mensuales y soporte 24/7 a través de nuestra
                  comunidad.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger className="text-left">¿Cuánto tiempo veré resultados?</AccordionTrigger>
                <AccordionContent>
                  Los primeros cambios se notan en 2-3 semanas. Resultados significativos aparecen entre 6-8 semanas con
                  constancia. Cada persona es diferente, por eso personalizamos cada plan.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-4">
                <AccordionTrigger className="text-left">¿Puedo cancelar mi plan en cualquier momento?</AccordionTrigger>
                <AccordionContent>
                  Sí, ofrecemos flexibilidad total. Puedes pausar o cancelar tu plan con 30 días de aviso. También
                  ofrecemos garantía de satisfacción en los primeros 60 días.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-2xl font-bold mb-4 text-primary">FitTransform</h3>
              <p className="text-gray-300 mb-4">
                Tu centro de transformación integral. Más que un gimnasio, tu nuevo estilo de vida.
              </p>
              <div className="flex space-x-4">
                <Button variant="outline" size="icon" className="border-gray-600 hover:bg-primary bg-transparent">
                  <Instagram className="w-5 h-5" />
                </Button>
                <Button variant="outline" size="icon" className="border-gray-600 hover:bg-primary bg-transparent">
                  <Facebook className="w-5 h-5" />
                </Button>
                <Button variant="outline" size="icon" className="border-gray-600 hover:bg-primary bg-transparent">
                  <MessageCircle className="w-5 h-5" />
                </Button>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Servicios</h4>
              <ul className="space-y-2 text-gray-300">
                <li>Entrenamiento Personal</li>
                <li>Nutrición Deportiva</li>
                <li>Suplementación</li>
                <li>Seminarios</li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Contacto</h4>
              <div className="space-y-3 text-gray-300">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4" />
                  <span>AV siempre Viva 123</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4" />
                  <span>+57 318 5228487</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4" />
                  <span>info@fittransform.com</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Horarios</h4>
              <div className="space-y-2 text-gray-300">
                <div>Lun - Vie: 6:00 - 22:00</div>
                <div>Sábados: 8:00 - 13:00</div>
              </div>
              <Button className="mt-4 w-full bg-primary hover:bg-primary/90">
                <MessageCircle className="w-4 h-4 mr-2" />
                WhatsApp Directo
              </Button>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2025 FitTransform. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
