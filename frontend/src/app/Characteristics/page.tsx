/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import "./Characteristics.css";

export default function Caracteristicas() {
  return (
    <div className="caracteristicas">
      <header className="header">
        <div className="container header-container">
          <div className="logo">
            <div className="logo-img">
             <Link href="/"><img src="/icons/logomed.png" alt="Logo MedBay"/></Link>
            </div>
            <Link href="/"><span className="logo-text1">Med</span><span className="logo-text2">Bay</span></Link>
          </div>
        |  <nav className="nav">
            <Link href="/Characteristics">Características</Link>
            <Link href="/About">Nosotros</Link>
            <Link href="/Contact">Contacto</Link>
          </nav>
          <div className="header-buttons">
            <a href="/login" className="btn-outline">
              Iniciar sesión
            </a>
            <a href="/register" className="btn-primary">
              Registrarse
            </a>
          </div>
        </div>
      </header>

      <section className="caracteristicas-hero">
        <h1>Características de MedBay</h1>
        <p>
          Nuestra plataforma está diseñada para facilitar la gestión de insumos
          médicos, optimizando cada etapa del proceso comercial.
        </p>
      </section>

      <section className="caracteristicas-lista">
        <div className="caracteristica">
          <h2>Gestión de Productos</h2>
          <p>
            Controla fácilmente tu catálogo de insumos médicos, con opciones de
            edición, actualización masiva y visualización rápida.
          </p>
        </div>

        <div className="caracteristica">
          <h2>Importación Inteligente</h2>
          <p>
            Importa tus productos desde archivos Excel o bases de datos
            externas, con validación automática y detección de errores.
          </p>
        </div>

        <div className="caracteristica">
          <h2>Panel Administrativo</h2>
          <p>
            Supervisa proveedores, compradores y órdenes en un dashboard claro y
            funcional, adaptado a tus necesidades.
          </p>
        </div>

        <div className="caracteristica">
          <h2>Seguridad y Cumplimiento</h2>
          <p>
            Cumplimos con normativas y estándares de seguridad para garantizar
            la protección de datos médicos y empresariales.
          </p>
        </div>
      </section>
    </div>
  );
}
