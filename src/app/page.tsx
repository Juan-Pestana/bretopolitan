'use client';
import { Calendar, Dumbbell, Users, Clock, MapPin, Check } from 'lucide-react';

import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <section className="max-w-6xl mx-auto px-6 py-20 md:py-28">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <MapPin className="w-4 h-4" />
              Breton de los Herreros 46, Madrid
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Tu gimnasio privado, cuando quieras
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Reserva el espacio de gimnasio de nuestra comunidad de forma fácil
              y rápida. Entrena solo o con tu entrenador personal.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button className="bg-emerald-600 text-white px-8 py-4 rounded-lg hover:bg-emerald-700 transition-colors font-semibold text-lg shadow-lg shadow-emerald-600/20">
                Hacer una reserva
              </button>
              <button className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors font-semibold text-lg">
                Ver horarios
              </button>
            </div>
          </div>
          <div className="relative">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-8 shadow-2xl">
              <div className="bg-white rounded-xl p-6 space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                  <span className="text-sm font-medium text-gray-500">
                    Próximas reservas
                  </span>
                  <Calendar className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="space-y-3">
                  {[
                    { time: '09:00 - 10:00', type: 'Entrenamiento personal' },
                    { time: '18:30 - 19:30', type: 'Sesión individual' },
                    { time: '20:00 - 21:00', type: 'Disponible' },
                  ].map((slot, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <Clock className="w-5 h-5 text-gray-400" />
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">
                          {slot.time}
                        </div>
                        <div className="text-sm text-gray-500">{slot.type}</div>
                      </div>
                      <div
                        className={`w-2 h-2 rounded-full ${i === 2 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                      ></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="bg-gray-50 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              ¿Cómo funciona?
            </h2>
            <p className="text-xl text-gray-600">
              Reservar es sencillo y rápido
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Calendar className="w-8 h-8" />,
                title: 'Consulta disponibilidad',
                description:
                  'Revisa los horarios disponibles en tiempo real y encuentra el momento perfecto para tu entrenamiento.',
              },
              {
                icon: <Clock className="w-8 h-8" />,
                title: 'Reserva tu franja',
                description:
                  'Selecciona el día y la hora que mejor se adapte a tu rutina. Entrenamientos de 1 hora.',
              },
              {
                icon: <Check className="w-8 h-8" />,
                title: 'Confirma y entrena',
                description:
                  'Recibe una confirmación instantánea y disfruta de tu espacio de gimnasio privado.',
              },
            ].map((step, i) => (
              <div
                key={i}
                className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="bg-emerald-100 text-emerald-600 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                  {step.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {step.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Ventajas para vecinos
          </h2>
          <p className="text-xl text-gray-600">
            Todo lo que necesitas en tu propio edificio
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {[
            {
              icon: <Dumbbell className="w-6 h-6" />,
              title: 'Equipamiento completo',
              description:
                'Espacio equipado con todo lo necesario para entrenamientos efectivos',
            },
            {
              icon: <Users className="w-6 h-6" />,
              title: 'Entrena con tu trainer',
              description:
                'Reserva sesiones con tu entrenador personal sin salir del edificio',
            },
            {
              icon: <MapPin className="w-6 h-6" />,
              title: 'Máxima comodidad',
              description:
                'Tu gimnasio a unos pasos de casa, sin desplazamientos ni pérdidas de tiempo',
            },
            {
              icon: <Calendar className="w-6 h-6" />,
              title: 'Gestión automática',
              description:
                'Sistema de reservas inteligente que evita solapamientos y conflictos',
            },
          ].map((feature, i) => (
            <div
              key={i}
              className="flex gap-4 p-6 bg-white border-2 border-gray-100 rounded-xl hover:border-emerald-200 transition-colors"
            >
              <div className="bg-emerald-100 text-emerald-600 w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0">
                {feature.icon}
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="bg-gradient-to-br from-emerald-600 to-teal-700 py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            ¿Listo para empezar?
          </h2>
          <p className="text-xl text-emerald-50 mb-8">
            Reserva tu primera sesión y descubre la comodidad de entrenar en tu
            propio edificio
          </p>
          <button className="bg-white text-emerald-700 px-10 py-4 rounded-lg hover:bg-emerald-50 transition-colors font-bold text-lg shadow-xl">
            Hacer mi primera reserva
          </button>
        </div>
      </section>
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <Dumbbell className="w-6 h-6 text-emerald-500" />
              <span className="text-lg font-bold text-white">Bretopolitan</span>
            </div>
            <div className="text-center md:text-left">
              <p className="text-sm">
                © 2025 Bretopolitan - Breton de los Herreros 46, Madrid
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Exclusivo para residentes de la comunidad
              </p>
            </div>
          </div>
        </div>
      </footer>{' '}
    </div>
  );
}
