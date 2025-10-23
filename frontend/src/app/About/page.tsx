/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import "./About.css";

export default function Nosotros() {
  return (
    <div className="nosotros">

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

      <section className="nosotros-header">
        <h1>Sobre Nosotros</h1>
        <p>
          En MedBay trabajamos para conectar el sector médico con soluciones
          tecnológicas eficientes y seguras.
        </p>
      </section>

      <section className="nosotros-info">
        <div className="nosotros-texto">
          <h2>Nuestra Misión</h2>
          <p>
            Facilitar la compra y venta de insumos médicos mediante una
            plataforma confiable que impulse la innovación en el sector salud.
          </p>

          <h2>Visión</h2>
          <p>
            Convertirnos en el marketplace líder en Latinoamérica para la
            distribución de productos médicos con cumplimiento normativo
            integrado.
          </p>
        </div>

        <div className="nosotros-imagen"></div>
      </section>
    </div>
  );
}
